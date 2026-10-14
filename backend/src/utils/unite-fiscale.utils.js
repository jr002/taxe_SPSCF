const fiscalData = require('../../../unitefiscal.json');

const isValidCentreFiscalRef = (reference) => {
  if (typeof reference !== 'string') return false;

  const separatorIndex = reference.indexOf(':');
  if (separatorIndex < 1) return false;

  const type = reference.slice(0, separatorIndex);
  const nom = reference.slice(separatorIndex + 1);
  const unites = fiscalData.unites_operationnelles?.[type];

  return Array.isArray(unites) && unites.some((unite) => unite.nom === nom);
};

module.exports = { isValidCentreFiscalRef };
