import { useId, useState } from 'react';

import { terme } from '@/frontofficeagent/aide/data/aideAgent.data.js';

/**
 * Un terme du vocabulaire fiscal expliqué au survol, côté agent.
 *
 * Même mécanique que l'infobulle du portail contribuable — bouton porteur de
 * `aria-describedby`, ouverture au survol, au focus clavier et au tap,
 * fermeture par `Escape` (qui retire le focus) ou au blur — mais écriture et
 * classes propres à l'espace agent : les trois espaces restent étanches, cet
 * écran n'importe rien de `accountcontribuable`.
 *
 * Une id absente du registre rend le texte sans artifice : rien ne disparaît,
 * l'absence d'explication signale un terme non enregistré.
 */
export default function AideTerme({ id, children }) {
  const entree = terme(id);
  const tipId = useId();
  const [ouvert, setOuvert] = useState(false);

  if (!entree) return <>{children}</>;

  return (
    <span className={`aide-term${ouvert ? ' ouvert' : ''}`}>
      <button
        type="button"
        className="aide-term-cible"
        aria-describedby={tipId}
        onClick={() => setOuvert((valeur) => !valeur)}
        onBlur={() => setOuvert(false)}
        onKeyDown={(event) => {
          if (event.key === 'Escape') {
            setOuvert(false);
            event.currentTarget.blur();
          }
        }}
      >
        {children ?? entree.terme}
      </button>
      <span className="aide-term-tip" role="tooltip" id={tipId}>
        {entree.sens}
      </span>
    </span>
  );
}
