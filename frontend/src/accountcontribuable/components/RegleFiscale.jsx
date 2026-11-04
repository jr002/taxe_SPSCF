import RefLegal from '@/components/common/RefLegal';
import Infobulle from '@/accountcontribuable/components/Infobulle';
import LienAide from '@/accountcontribuable/components/LienAide';
import { regle } from '@/accountcontribuable/data/regles.data';

/**
 * Une règle énoncée dans le portail, toujours posée de la même façon : le terme
 * s'explique au survol (forme courte, issue du registre) et le renvoi ouvre la
 * page d'aide sur la rubrique qui la développe. Les deux viennent de la même
 * entrée de `data/regles.data.js`, donc ils ne peuvent plus diverger.
 *
 * `compact` sert aux cellules de tableau, où seule la mention « Règle » tient :
 * le lien vers le texte officiel n'y a pas de place, il est posé dans la page
 * d'aide que ce renvoi ouvre. Hors `compact`, la référence vérifiée
 * (`referenceLegale()`) accompagne le renvoi — et une règle sans source n'affiche
 * aucun lien, jamais une puce vide.
 *
 * Une id inconnue rend le texte sans artifice : rien ne disparaît, le renvoi
 * absent signale une règle non enregistrée.
 */
export default function RegleFiscale({ id, children, onOuvrirAide, compact = false }) {
  const entree = regle(id);
  if (!entree) return <>{children}</>;

  return (
    <span className={`portail-regle${compact ? ' compact' : ''}`}>
      <Infobulle texte={entree.regle}>{children}</Infobulle>
      <LienAide section={entree.section} onOuvrirAide={onOuvrirAide}>
        {compact ? (
          <>
            <span className="sr-only">Ouvrir la règle dans l’aide — </span>
            règle
          </>
        ) : (
          'Règle dans l’aide'
        )}
      </LienAide>
      {!compact && <RefLegal source={entree.source} compact />}
    </span>
  );
}
