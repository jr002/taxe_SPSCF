/**
 * Formats partagés des deux écrans du portail contribuable (dossier et aide),
 * pour qu'une même date se lise pareil partout.
 */

/** Date ISO ou objet Date → « 21/10/2026 » ; `—` si la date est illisible. */
export const formatDate = (value) => {
  if (!value) return '—';
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? '—' : date.toLocaleDateString('fr-FR');
};

/** Date ISO ou objet Date → « 21 octobre 2026 » ; `—` si la date est illisible. */
export const formatDateLongue = (value) => {
  if (!value) return '—';
  const date = new Date(value);
  return Number.isNaN(date.getTime())
    ? '—'
    : date.toLocaleDateString('fr-FR', { dateStyle: 'long' });
};
