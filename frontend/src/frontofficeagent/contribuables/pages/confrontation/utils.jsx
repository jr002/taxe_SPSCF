/* eslint-disable react-refresh/only-export-components */

export const formatAriary = (value) => {
  if (value === null || value === undefined || value === '') return '—';
  return `${Number(value).toLocaleString('fr-FR')} Ar`;
};

export const formatEcart = (value) => {
  if (value === null || value === undefined || value === '') return '—';
  const number = Number(value);
  if (number === 0) return '0 Ar (concordance)';
  return `${number > 0 ? '+' : '−'}${Math.abs(number).toLocaleString('fr-FR')} Ar`;
};

export const formatDate = (value) => {
  if (!value || Number.isNaN(new Date(value).getTime())) return '—';
  return new Date(value).toLocaleDateString('fr-FR');
};

export const formatDateTime = (value) => {
  if (!value || Number.isNaN(new Date(value).getTime())) return '—';
  return new Date(value).toLocaleString('fr-FR', { dateStyle: 'long', timeStyle: 'short' });
};

export const SOURCE_LABELS = {
  tiers_declarant: 'Tiers déclarant',
  banque: 'Banque',
  fournisseur: 'Fournisseur',
  client: 'Client',
  administration: 'Administration',
  assurance: 'Assurance',
  notaire: 'Notaire',
  autre: 'Autre',
};

export const OPERATION_LABELS = {
  vente: 'Vente',
  achat: 'Achat',
  service: 'Service',
  autre: 'Autre',
};

export const sourceLabel = (source) => SOURCE_LABELS[source] || source || '—';
export const operationLabel = (operation) => OPERATION_LABELS[operation] || operation || '—';

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

export const monthLabel = (periode) => {
  const [annee, mois] = String(periode || '').split('-').map(Number);
  if (!annee || !mois) return periode || '—';
  const libelle = new Date(Date.UTC(annee, mois - 1, 1)).toLocaleDateString('fr-FR', {
    month: 'long',
    year: 'numeric',
    timeZone: 'UTC',
  });
  return libelle.charAt(0).toUpperCase() + libelle.slice(1);
};

export const periodOptionLabel = (value) => (/^\d{4}$/.test(String(value)) ? `Exercice ${value}` : monthLabel(value));

/**
 * Choix de période proposés à l'agent : les exercices déclarés d'abord, puis
 * les mois couverts par les recoupements. Un exercice confronte chaque
 * recoupement de l'année à la déclaration annuelle ; un mois isole le mois.
 */
export const buildPeriodOptions = (apercu) => {
  const recoupementsParAnnee = new Map(
    (apercu?.recoupements?.annees || []).map((entree) => [String(entree.annee), entree.total]),
  );
  const annees = new Set([
    ...(apercu?.declarations?.annees || []).map((entree) => String(entree.annee)),
    ...(apercu?.recoupements?.annees || []).map((entree) => String(entree.annee)),
  ]);

  return {
    annees: [...annees]
      .sort((a, b) => b.localeCompare(a))
      .map((annee) => ({
        value: annee,
        label: `Exercice ${annee} — ${recoupementsParAnnee.get(annee) || 0} recoupement(s)`,
      })),
    mois: (apercu?.recoupements?.periodes || []).map((entree) => ({
      value: entree.periode,
      label: `${monthLabel(entree.periode)} — ${entree.total} recoupement(s)`,
    })),
  };
};

export const periodLabel = (row) => {
  const declaration = declarationOf(row);
  const recoupement = recoupementOf(row);

  if (declaration.periode) return declaration.periode;
  if (declaration.annee) return `Exercice ${declaration.annee}`;
  return recoupement.periode || '—';
};

export const ecartSens = (value) => {
  const number = Number(value || 0);
  if (number === 0) return 'Concordance';
  return number > 0 ? 'Déclaré supérieur' : 'Recoupé supérieur';
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
  formatEcart,
  formatDate,
  formatDateTime,
  monthLabel,
  periodOptionLabel,
  buildPeriodOptions,
  periodLabel,
  ecartSens,
  statusLabel,
  statusClass,
  matchTypeLabel,
  sourceLabel,
  operationLabel,
  declarationOf,
  recoupementOf,
  StatusBadge,
  MatchTypeBadge,
};
