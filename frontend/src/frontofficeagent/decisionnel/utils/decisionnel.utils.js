/**
 * Utilitaires pour le tableau décisionnel et l'agrégation des statistiques
 */
import { toNumber } from '@/utils';

/**
 * Détermine le régime fiscal selon le chiffre d'affaires
 * IS : régime appliqué par défaut et obligatoire lorsque le CA atteint
 *      400 000 000 Ar
 * IR : optionnel lorsque le CA est inférieur à 400 000 000 Ar
 * @param {Object} declaration
 * @returns {'IS' | 'IR'}
 */
export const getRegime = (declaration) => {
  return toNumber(declaration.ca) < 400000000 && declaration.regime_fiscal === 'IR'
    ? 'IR'
    : 'IS';
};

/**
 * Construit la série de données sur les 5 dernières années
 * @param {Array} declarations
 * @returns {Array} Données ventilées par année
 */
export const buildYears = (declarations = []) => {
  const currentYear = new Date().getFullYear();

  return Array.from({ length: 5 }, (_, index) => currentYear - 4 + index).map((year) => {
    const declarationsOfYear = declarations.filter(
      (d) => Number(d.annee) === year
    );

    return {
      year,
      is: declarationsOfYear.filter((d) => getRegime(d) === 'IS').length,
      ir: declarationsOfYear.filter((d) => getRegime(d) === 'IR').length,
      tva: declarationsOfYear.length,
    };
  });
};

/**
 * Construit les courbes comparatives de TVA payée vs TVA théorique par régime
 * @param {Array} years - Tableau des années
 * @param {Array} declarations - Liste des déclarations
 * @returns {Array} Courbes pour IS et IR
 */
export const buildCurves = (years, declarations = []) => {
  return ['IS', 'IR'].map((currentRegime) => ({
    regime: currentRegime,
    paid: years.map((yearData) => ({
      year: yearData.year,
      amount: declarations
        .filter(
          (d) => Number(d.annee) === yearData.year && getRegime(d) === currentRegime
        )
        .reduce((sum, d) => sum + toNumber(d.tva_payee), 0),
    })),
    expected: years.map((yearData) => ({
      year: yearData.year,
      amount: declarations
        .filter(
          (d) => Number(d.annee) === yearData.year && getRegime(d) === currentRegime
        )
        .reduce((sum, d) => sum + toNumber(d.tva_theorique), 0),
    })),
  }));
};

/**
 * Calcule le pourcentage de répartition arrondi
 * @param {number} count
 * @param {number} total
 * @returns {number}
 */
export const getRegimePercentage = (count, total) => {
  return Math.round((count / Math.max(total, 1)) * 100);
};
