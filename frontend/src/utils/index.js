/**
 * Porte d'entrée des utilitaires partagés. Un formatage propre à un domaine reste
 * dans le domaine ; ici ne vivent que ce que plusieurs domaines réclament.
 */
export {
  dateOuNull,
  formatAriary,
  formatAxisValue,
  formatCompact,
  formatMois,
  formatNumber,
  formatPeriode,
  MONTANT_ABSENT,
  montantOuNull,
  ouAbsent,
  toNumber,
  VALEUR_ABSENTE,
} from '@/utils/formatters';
export { getPageNumbers } from '@/utils/pagination.utils';
export { SEUIL_CONFORMITE, SEUIL_CRITIQUE, statutSelonEcart } from '@/utils/fiscal.utils';
export { readSearchParam, updateSearchParams } from '@/utils/searchParams.utils';
export { getLandingPath, initialsOf } from '@/utils/session.utils';
