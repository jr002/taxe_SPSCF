/**
 * Utilitaires de formatage de données pour l'administration fiscale
 */

// Formateur de devise standard en Ariary (ex: "1 250 000 Ar")
const numberFormatter = new Intl.NumberFormat('fr-FR', {
  maximumFractionDigits: 0,
});

/**
 * Formate un montant en Ariary (ex: "50 000 000 Ar")
 * @param {number|string} val - Montant à formater
 * @returns {string}
 */
export const formatAriary = (val) => {
  const num = Number(val) || 0;
  return `${numberFormatter.format(num)} Ar`;
};

/**
 * Formate un nombre brut sans symbole
 * @param {number|string} val
 * @returns {string}
 */
export const formatNumber = (val) => {
  return numberFormatter.format(Number(val) || 0);
};

/**
 * Formate un montant de manière compacte pour les axes de graphiques (ex: "1.2 Md", "350 M", "50 k")
 * @param {number} val
 * @returns {string}
 */
export const formatCompact = (val) => {
  const num = Number(val) || 0;
  if (Math.abs(num) >= 1000000000) return `${(num / 1000000000).toFixed(1)} Md`;
  if (Math.abs(num) >= 1000000) return `${Math.round(num / 1000000)} M`;
  if (Math.abs(num) >= 1000) return `${Math.round(num / 1000)} k`;
  return String(Math.round(num));
};

/**
 * Formate une valeur pour les axes de graphiques (entiers arrondis)
 * @param {number} value
 * @returns {string}
 */
export const formatAxisValue = (value) => {
  if (value >= 1000000000) return `${Math.round(value / 1000000000)} Md`;
  if (value >= 1000000) return `${Math.round(value / 1000000)} M`;
  if (value >= 1000) return `${Math.round(value / 1000)} k`;
  return String(value);
};

/**
 * Convertit une valeur de manière sécurisée en nombre
 * @param {any} val
 * @returns {number}
 */
export const toNumber = (val) => Number(val) || 0;
