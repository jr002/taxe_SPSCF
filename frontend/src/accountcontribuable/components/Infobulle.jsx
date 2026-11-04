import { useId, useState } from 'react';

/**
 * Explication au survol, conservée au focus clavier et accessible au tap.
 *
 * L'infobulle reste dans l'arbre d'accessibilité (elle est seulement transparente
 * et hors pointage) : `aria-describedby` la lit aussi bien au survol qu'au focus,
 * et un lecteur d'écran n'est jamais privé de l'explication. Le texte porté ici
 * est la forme courte d'une règle : la forme longue vit dans la page d'aide, que
 * `RegleFiscale` propose juste à côté.
 */
export default function Infobulle({ texte, children }) {
  const id = useId();
  const [ouvert, setOuvert] = useState(false);

  return (
    <span className={`portail-infobulle${ouvert ? ' ouvert' : ''}`}>
      <button
        type="button"
        className="portail-infobulle-cible"
        aria-describedby={id}
        onClick={() => setOuvert((valeur) => !valeur)}
        onBlur={() => setOuvert(false)}
        onKeyDown={(event) => {
          // Échap referme l'explication et rend la sortie visible : sans ce `blur`,
          // la règle `:focus-within` la maintiendrait affichée tant que la cible a
          // le focus clavier.
          if (event.key === 'Escape') {
            setOuvert(false);
            event.currentTarget.blur();
          }
        }}
      >
        {children}
      </button>
      <span className="portail-infobulle-tip" role="tooltip" id={id}>
        {texte}
      </span>
    </span>
  );
}
