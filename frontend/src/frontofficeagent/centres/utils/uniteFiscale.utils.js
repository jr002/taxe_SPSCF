import fiscalData from '@/data/referentiel-unites';

const dgeData = fiscalData.unites_operationnelles?.direction_des_grandes_entreprises;

const dgeAsLegacyUnit = dgeData
  ? {
      ...dgeData,
      type: dgeData.sigle,
      nom: `${dgeData.nom_complet} (${dgeData.sigle})`,
      telephone: dgeData.support_telephone,
      email: dgeData.support_email,
    }
  : null;

export function getOperationalUnits(type) {
  if (type === 'dge') {
    return dgeAsLegacyUnit ? [dgeAsLegacyUnit] : [];
  }

  const units = fiscalData.unites_operationnelles?.[type];
  return Array.isArray(units) ? units : [];
}

export function getAllOperationalUnits() {
  return ['dge', 'sre', 'centres_fiscaux'].flatMap((type) =>
    getOperationalUnits(type).map((item, index) => ({ item, type, index }))
  );
}
