/**
 * Légende de statuts en langage clair : le mot du tableau, puis ce qu'il veut
 * dire pour le contribuable. Le composant n'affiche que ce qu'on lui passe, pour
 * que la fiche du dossier et la page d'aide présentent exactement les mêmes
 * phrases à partir du même référentiel (`data/statuts.data.js`).
 *
 * Un statut n'est jamais donné par la couleur seule : le mot est écrit, la
 * couleur ne fait que le renforcer (exigence d'accessibilité du projet).
 */
export default function LegendeStatuts({ entrees, ariaLabel = 'Légende des statuts' }) {
  const vus = new Set();
  const lignes = (entrees || [])
    .filter((entree) => entree?.label && entree?.sens)
    // Un même mot peut venir de deux clés techniques (accentuées ou non) : la
    // légende ne le montre qu'une fois.
    .filter((entree) => (vus.has(entree.label) ? false : vus.add(entree.label)));
  if (lignes.length === 0) return null;

  return (
    <ul className="portail-legende" aria-label={ariaLabel}>
      {lignes.map((entree) => (
        <li key={entree.label}>
          {entree.badge
            ? <span className={`badge ${entree.badge}`}>{entree.label}</span>
            : <span className="portail-legende-puce">{entree.label}</span>}
          <span>{entree.sens}</span>
        </li>
      ))}
    </ul>
  );
}
