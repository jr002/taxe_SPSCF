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

const isValidCentreFiscalRef = (reference) => {
  if (typeof reference !== 'string') return false;

  const separatorIndex = reference.indexOf(':');
  if (separatorIndex < 1) return false;

  const type = reference.slice(0, separatorIndex);
  const nom = reference.slice(separatorIndex + 1);
  const unites = getOperationalUnits(type);

  return unites.some((unite) => unite.nom === nom);
};

module.exports = { isValidCentreFiscalRef };
