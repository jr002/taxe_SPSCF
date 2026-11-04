import { referenceLegale } from '@/data/textesFiscaux.data';

/**
 * Le renvoi légal d'une règle, en une seule forme : un lien qui ouvre le PDF
 * officiel de l'éditeur, et — quand le texte ne dit pas ce que l'application
 * affiche — la phrase qui le dit.
 *
 * `source` vient du registre (`regles.data.js`, `aide.data.js`) via
 * `referenceLegale()` : sans source, le composant rend `null`, jamais une puce
 * vide. Un texte non conforme garde son lien — c'est en ouvrant l'article que le
 * lecteur constate l'écart — mais il ne peut plus se donner l'air d'une citation
 * exacte : la puce change de couleur et `ecart` s'affiche.
 *
 * Le lien s'ouvre dans un onglet séparé avec `rel="noopener noreferrer"` : les
 * PDF font plusieurs mégaoctets et la consultation du dossier ne doit pas être
 * perdue. Il pointe sur `urlAncre`, c'est-à-dire la page du fichier où se lit le
 * feuillet cité — vérifier, ce n'est pas télécharger un document de 2,4 Mo à la
 * page 1. En impression, la puce garde l'article et la page — le texte reste
 * vérifiable sur papier, seule la mention « ouvrir le PDF » disparaît.
 */
export default function RefLegal({ source, compact = false, detail = false, className = '' }) {
  const ref = referenceLegale(source);
  if (!ref) return null;

  return (
    <span className={`ref-legale${ref.conforme ? '' : ' ref-legale-prudent'}${className ? ` ${className}` : ''}`}>
      <a
        className="ref-legale-lien"
        href={ref.urlAncre}
        target="_blank"
        rel="noopener noreferrer"
        title={`${ref.document} — ${ref.editeur}`}
      >
        <span className="sr-only">Ouvrir le texte officiel — </span>
        {compact ? ref.libelleCourt : ref.libelle}
        <span className="ref-legale-ouvert" aria-hidden="true">
          {' ↗'}
        </span>
      </a>
      {detail && !ref.conforme && ref.ecart ? (
        <span className="ref-legale-ecart">{ref.ecart}</span>
      ) : null}
    </span>
  );
}
