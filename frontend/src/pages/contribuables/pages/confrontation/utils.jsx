/* eslint-disable react-refresh/only-export-components */

export const formatAriary = (value) => {
  if (value === null || value === undefined || value === '') return '—';
  return `${Number(value).toLocaleString('fr-FR')} Ar`;
};

export const formatDate = (value) => {
  if (!value || Number.isNaN(new Date(value).getTime())) return '—';
  return new Date(value).toLocaleDateString('fr-FR');
};

export const statusLabel = (status) => ({
  rapproche: 'Rapproché',
  a_verifier: 'À vérifier',
  ecart: 'Écart',
  valide: 'Validé',
  rejete: 'Rejeté',
  annule: 'Annulé',
}[status] || status || '—');

export const statusClass = (status) => ({
  rapproche: 'cfb cfb-g',
  valide: 'cfb cfb-b',
  a_verifier: 'cfb cfb-o',
  ecart: 'cfb cfb-r',
  rejete: 'cfb cfb-x',
  annule: 'cfb cfb-x',
}[status] || 'cfb cfb-x');

export const matchTypeLabel = (type) => ({
  exact: 'Exact',
  tolerance: 'Tolérance',
  partiel: 'Partiel',
  manuel: 'Manuel',
}[type] || type || '—');

export const declarationOf = (row) => row?.declaration || row?.declarations || {};
export const recoupementOf = (row) => row?.recoupement || row?.recoupements || {};
export const periodOf = (row) => declarationOf(row).periode || recoupementOf(row).periode || row?.periode || '';

export const buildStats = (rows) => {
  const countType = (type) => rows.filter((row) => row.type_rapprochement === type).length;
  const countStatus = (status) => rows.filter((row) => row.statut === status).length;
  const sum = (field) => rows.reduce((total, row) => total + Number(row[field] || 0), 0);
  return {
    total: rows.length,
    declarations: new Set(rows.map((row) => row.id_declaration).filter(Boolean)).size,
    recoupements: new Set(rows.map((row) => row.id_recoupement).filter(Boolean)).size,
    exact: countType('exact'),
    tolerance: countType('tolerance'),
    partiel: countType('partiel'),
    ecart: countStatus('ecart'),
    a_verifier: countStatus('a_verifier'),
    valide: countStatus('valide'),
    rejete: countStatus('rejete'),
    annule: countStatus('annule'),
    montant_declare_total: sum('montant_declare'),
    montant_recoupe_total: sum('montant_recoupe'),
    ecart_total: sum('ecart'),
  };
};

export const StatusBadge = ({ status, className = '' }) => (
  <span className={`${statusClass(status)} ${className}`.trim()}>
    {statusLabel(status)}
  </span>
);

export const MatchTypeBadge = ({ type, className = '' }) => (
  <span className={`cfb cfb-x ${className}`.trim()}>
    {matchTypeLabel(type)}
  </span>
);

export default {
  formatAriary,
  formatDate,
  statusLabel,
  statusClass,
  matchTypeLabel,
  declarationOf,
  recoupementOf,
  periodOf,
  buildStats,
  StatusBadge,
  MatchTypeBadge,
};
