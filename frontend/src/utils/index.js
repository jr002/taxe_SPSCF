/**
 * Porte d'entrée des utilitaires partagés. Un formatage propre à un domaine reste
 * dans le domaine ; ici ne vivent que ce que plusieurs domaines réclament.
 */
export { formatAriary, formatAxisValue, formatCompact, formatNumber, toNumber } from '@/utils/formatters';
export { getPageNumbers } from '@/utils/pagination.utils';
export { readSearchParam, updateSearchParams } from '@/utils/searchParams.utils';
export { getLandingPath, initialsOf } from '@/utils/session.utils';
