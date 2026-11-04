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

/**
 * Rend lisible une période fiscale `AAAA-MM` (ex: "Septembre 2026").
 * Une valeur qui n'est pas une période est renvoyée telle quelle.
 * @param {string} value
 * @returns {string}
 */
export const formatPeriode = (value) => {
  const [annee, mois] = String(value || '').split('-').map(Number);
  if (!annee || !mois) return value || '—';
  const libelle = new Date(Date.UTC(annee, mois - 1, 1)).toLocaleDateString('fr-FR', {
    month: 'long',
    year: 'numeric',
    timeZone: 'UTC',
  });
  return libelle.charAt(0).toUpperCase() + libelle.slice(1);
};

/**
 * Le mois seul d'une période `AAAA-MM` (ex: "Septembre").
 * @param {string} value
 * @returns {string}
 */
export const formatMois = (value) => formatPeriode(value).replace(/\s+\d{4}$/, '');

/**
 * Ce qu'on écrit quand une information n'existe pas au dossier. Une donnée absente
 * ne se remplace pas par une valeur plausible : elle s'annonce. Utilisé par les
 * écrans, les imports et les courriers imprimables, pour que « on ne sait pas » se
 * lise partout de la même façon.
 */
export const VALEUR_ABSENTE = 'Non renseigné au dossier';

/** Idem pour un montant : l'absence d'une ligne en base n'est pas un calcul. */
export const MONTANT_ABSENT = 'Non liquidé au dossier';

/**
 * Renvoie la valeur, ou la mention d'absence si elle est vide.
 * @param {any} value
 * @param {string} [absence]
 */
export const ouAbsent = (value, absence = VALEUR_ABSENTE) => {
  const texte = value === null || value === undefined ? '' : String(value).trim();
  return texte || absence;
};

/**
 * montant ou `null` — `formatAriary(null)` rend « 0 Ar », ce qui ferait passer
 * l'absence d'une colonne en base pour un montant liquidé à zéro.
 * @param {any} value
 * @returns {number|null}
 */
export const montantOuNull = (value) => {
  if (value === null || value === undefined || String(value).trim() === '') return null;
  const nombre = Number(value);
  return Number.isFinite(nombre) ? nombre : null;
};

/**
 * Une date enregistrée au dossier, en français ; `null` si la colonne est vide.
 * Une date absente ne se remplace jamais par la date du jour.
 * @param {any} value
 * @returns {string|null}
 */
export const dateOuNull = (value) => {
  if (!value) return null;
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date.toLocaleDateString('fr-FR');
};
