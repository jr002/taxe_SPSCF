const fiscalData = require('../../../unitefiscal.json');

const dgeData = fiscalData.unites_operationnelles?.direction_des_grandes_entreprises;
const legacyDgeName = dgeData
  ? `${dgeData.nom_complet} (${dgeData.sigle})`
  : '';

const getOperationalUnits = (type) => {
  if (type === 'dge') {
    return dgeData ? [{ ...dgeData, nom: legacyDgeName }, { ...dgeData, nom: dgeData.nom_complet }] : [];
  }

  const units = fiscalData.unites_operationnelles?.[type];
  return Array.isArray(units) ? units : [];
};

const splitCentreFiscalRef = (reference) => {
  if (typeof reference !== 'string') return null;

  const separatorIndex = reference.indexOf(':');
  if (separatorIndex < 1) return null;

  return {
    type: reference.slice(0, separatorIndex),
    nom: reference.slice(separatorIndex + 1),
  };
};

const isValidCentreFiscalRef = (reference) => {
  const parts = splitCentreFiscalRef(reference);
  if (!parts) return false;

  return getOperationalUnits(parts.type).some((unite) => unite.nom === parts.nom);
};

/**
 * Passerelle entre la table `centres` (`type_centre`) et le référentiel
 * `unitefiscal.json` (clé de `unites_operationnelles`) : les deux décrivent le
 * même rattachement fiscal, `contribuables.centre_fiscal_ref` en est la forme
 * textuelle `cle:nom`.
 */
const CLE_UNITE_PAR_TYPE_CENTRE = {
  'Centre Fiscal': 'centres_fiscaux',
  SRE: 'sre',
  DGE: 'dge',
};

const TYPE_CENTRE_PAR_CLE_UNITE = Object.fromEntries(
  Object.entries(CLE_UNITE_PAR_TYPE_CENTRE).map(([typeCentre, cle]) => [cle, typeCentre])
);

/**
 * Construit la référence textuelle d'un centre de la table `centres`.
 * Renvoie `null` quand le centre n'a pas d'équivalent dans le référentiel
 * (type inconnu, ou `nom_centre` absent de `unitefiscal.json`) : une référence
 * inventée échouerait partout où `isValidCentreFiscalRef` est consulté.
 */
const centreFiscalRefFromCentre = (centre) => {
  const cle = CLE_UNITE_PAR_TYPE_CENTRE[centre?.type_centre];
  const nom = typeof centre?.nom_centre === 'string' ? centre.nom_centre : '';
  if (!cle || !nom) return null;

  const reference = `${cle}:${nom}`;
  return isValidCentreFiscalRef(reference) ? reference : null;
};

module.exports = {
  TYPE_CENTRE_PAR_CLE_UNITE,
  centreFiscalRefFromCentre,
  isValidCentreFiscalRef,
  splitCentreFiscalRef,
};
