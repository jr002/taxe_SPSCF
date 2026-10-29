/**
 * Utilitaires de classification des contribuables selon le CGI malgache
 *
 * Catégories :
 *   - Grand  : CA ≥ 400 000 000 Ar
 *   - Moyen  : 100 000 000 ≤ CA < 400 000 000 Ar
 *   - Petit  : CA < 100 000 000 Ar
 */
import { toNumber } from '@/utils';

/** Seuils en Ariary */
export const SEUIL_GRAND = 400_000_000;
export const SEUIL_MOYEN = 100_000_000;
/** Séparation des deux bandes du moyen contribuable */
export const SEUIL_SMT = 200_000_000;

/**
 * Dernier chiffre d'affaires connu du dossier, avec l'exercice qui le porte.
 * @param {Array} declarations
 * @returns {{ca: number, annee: number|null}} `ca` à `0` si aucune déclaration
 */
export function getCaReference(declarations = []) {
  if (!declarations.length) return { ca: 0, annee: null };

  const [laPlusRecente] = [...declarations].sort(
    (a, b) => Number(b.annee) - Number(a.annee),
  );

  return {
    ca: toNumber(laPlusRecente?.ca),
    annee: Number(laPlusRecente?.annee) || null,
  };
}

/**
 * Catégorie correspondant à un chiffre d'affaires.
 * @param {number} ca
 * @returns {'Grand' | 'Moyen' | 'Petit'}
 */
export function getCategorieFromCa(ca) {
  if (ca >= SEUIL_GRAND) return 'Grand';
  if (ca >= SEUIL_MOYEN) return 'Moyen';
  return 'Petit';
}

/**
 * Détermine la catégorie d'un contribuable d'après son CA le plus récent.
 * @param {Object} contribuable - objet contribuable avec `declarations[]`
 * @returns {'Grand' | 'Moyen' | 'Petit'}
 */
export function getCategorie(contribuable) {
  return getCategorieFromCa(getCaReference(contribuable?.declarations || []).ca);
}

/** Fiche réglementaire commune aux trois catégories. */
const COMMUN = {
  refArticle: 'Art. 20.01.53',
};

/**
 * Renvoie la fiche réglementaire d'une catégorie.
 * @param {'Grand' | 'Moyen' | 'Petit'} categorie
 * @param {number} [ca] dernier CA connu — sert à retenir la bande du moyen contribuable
 */
export function getFicheCategorie(categorie, ca) {
  const fiches = {
    Grand: {
      label: 'Grand Contribuable',
      seuil: 'CA ≥ 400 000 000 Ar',
      couleur: '#b42318',          // rouge DGE
      background: '#fff0ed',
      codeImpot: 'IR',
      impots: 'Impôt sur le revenu (IR) au taux de 20 %',
      regimeDetaille: 'Régime du Réel obligatoire',
      tva: 'TVA obligatoire',
      comptabilite: "Comptabilité d'exercice complète (PCG 2005)",
      conservation: '10 ans',
      enPratique:
        'Votre dossier se contrôle sur la comptabilité, pas sur un forfait : ' +
        'chaque exercice doit être étayé par des pièces conservées dix ans.',
      penaliteRetard: [
        '1ᵉʳ mois de retard : 3 %',
        'Chaque mois supplémentaire : 1 %',
      ],
      amendes: [
        { motif: 'Infraction à la facturation', montant: 20_000_000 },
        {
          motif: 'Défaut de conservation des factures',
          montant: 2_000_000,
          unite: 'par année manquante',
        },
      ],
    },
    Moyen: {
      label: 'Moyen Contribuable',
      seuil: '100 000 000 Ar ≤ CA < 400 000 000 Ar',
      couleur: '#946200',          // jaune SRE
      background: '#fff7d6',
      codeImpot: 'IS',
      impots: 'Impôt Synthétique (IS) par défaut',
      regimeDetaille:
        'Option possible pour l’IR et le Réel si les états comptables sont certifiés',
      comptabilite: 'Selon la bande de chiffre d’affaires retenue ci-dessus',
      enPratique:
        'La catégorie moyenne couvre deux régimes distincts : le chiffre d’affaires ' +
        'déclaré décide lequel s’applique.',
      penaliteRetard: [
        '1ᵉʳ mois de retard : 2 %',
        'Chaque mois supplémentaire : 1 %',
      ],
      amendes: [
        { motif: 'Infraction à la facturation', montant: 10_000_000 },
        {
          motif: 'Défaut de conservation des factures',
          montant: 1_000_000,
          unite: 'par année manquante',
        },
      ],
    },
    Petit: {
      label: 'Petit Contribuable',
      seuil: 'CA < 100 000 000 Ar',
      couleur: '#1769aa',          // bleu standard
      background: '#eef7ff',
      codeImpot: 'IS',
      impots:
        'Impôt Synthétique (IS) à 5 % — 3 % pour les nouveaux adhérents d’un CGA ou les immatriculations en ligne',
      regimeDetaille: 'IS libératoire de l’IR et de la TVA',
      tva: 'Non assujetti (l’IS tient lieu de TVA)',
      comptabilite: 'Journal de recettes et de dépenses',
      conservation: '3 ans',
      enPratique:
        'Une seule taxe, assise sur le chiffre d’affaires : pas de déclaration de TVA à déposer.',
      penaliteRetard: ['Chaque mois de retard : 1 %'],
      amendes: [
        { motif: 'Infraction à la facturation', montant: 1_000_000 },
        {
          motif: 'Défaut de conservation des factures',
          montant: 100_000,
          unite: 'par année manquante',
        },
      ],
    },
  };

  const fiche = { ...COMMUN, ...(fiches[categorie] || fiches.Petit), categorie };

  // Le moyen contribuable n'a pas le même régime de part et d'autre de 200 M Ar :
  // sans CA connu on laisse la fiche générale, avec le CA on ne montre que la bande utile.
  if (fiche.categorie === 'Moyen' && Number.isFinite(ca)) {
    const bandeHaute = ca >= SEUIL_SMT;
    return {
      ...fiche,
      impots: bandeHaute
        ? 'Impôt Synthétique (IS) par défaut'
        : 'Impôt Synthétique (IS) à 5 %',
      regimeDetaille: bandeHaute
        ? 'Option possible pour l’IR et le Réel si les états comptables sont certifiés'
        : 'Comptabilité allégée : Système Minimal de Trésorerie (SMT)',
      comptabilite: bandeHaute
        ? 'Comptabilité d’exercice en cas d’option pour le Réel'
        : 'Système Minimal de Trésorerie (SMT)',
      enPratique: bandeHaute
        ? `Avec ${ca.toLocaleString('fr-FR')} Ar de chiffre d’affaires, l’IS reste la règle et le Réel une option sur états certifiés.`
        : `Avec ${ca.toLocaleString('fr-FR')} Ar de chiffre d’affaires, vous relevez de l’IS à 5 % avec une comptabilité allégée (SMT).`,
    };
  }

  return fiche;
}
