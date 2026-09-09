/**
 * Utilitaires de classification des contribuables selon le CGI malgache
 *
 * Catégories :
 *   - Grand  : CA ≥ 400 000 000 Ar
 *   - Moyen  : 100 000 000 ≤ CA < 400 000 000 Ar
 *   - Petit  : CA < 100 000 000 Ar
 */
import { toNumber } from './formatters';

/** Seuils en Ariary */
export const SEUIL_GRAND = 400_000_000;
export const SEUIL_MOYEN = 100_000_000;

/**
 * Détermine la catégorie d'un contribuable d'après son CA le plus récent.
 * @param {Object} contribuable - objet contribuable avec `declarations[]`
 * @returns {'Grand' | 'Moyen' | 'Petit'}
 */
export function getCategorie(contribuable) {
  const declarations = contribuable?.declarations || [];
  if (!declarations.length) return 'Petit';

  // Prend le CA le plus récent
  const sorted = [...declarations].sort(
    (a, b) => Number(b.annee) - Number(a.annee)
  );
  const ca = toNumber(sorted[0].ca);

  if (ca >= SEUIL_GRAND) return 'Grand';
  if (ca >= SEUIL_MOYEN) return 'Moyen';
  return 'Petit';
}

/**
 * Renvoie la fiche réglementaire complète pour une catégorie.
 */
export function getFicheCategorie(categorie) {
  const fiches = {
    Grand: {
      label: 'Grand Contribuable',
      seuil: 'CA ≥ 400 000 000 Ar',
      couleur: '#b42318',          // rouge DGE
      background: '#fff0ed',
      regime:
        'Régime du Réel obligatoire — IR au taux de 20 % — TVA obligatoire. ' +
        'Comptabilité d\'exercice complète (PCG 2005). Conservation des pièces : 10 ans.',
      penaliteRetard: [
        '3 % pour le 1er mois de retard',
        '1 % par mois supplémentaire',
      ],
      amendes: [
        { motif: 'Infraction e-Facturation', montant: 20_000_000 },
        {
          motif: 'Défaut de conservation des factures',
          montant: 2_000_000,
          unite: 'par année manquante',
        },
      ],
      refArticle: 'Art. 20.01.53',
    },
    Moyen: {
      label: 'Moyen Contribuable',
      seuil: '100 000 000 Ar ≤ CA < 400 000 000 Ar',
      couleur: '#946200',          // jaune SRE
      background: '#fff7d6',
      regime:
        'CA 200–400 M Ar : Impôt Synthétique (IS) par défaut, option IR/Réel si états certifiés. ' +
        'CA 100–200 M Ar : IS à 5 %, comptabilité SMT (Système Minimal de Trésorerie).',
      penaliteRetard: [
        '2 % pour le 1er mois de retard',
        '1 % par mois supplémentaire',
      ],
      amendes: [
        { motif: 'Infraction e-Facturation', montant: 10_000_000 },
        {
          motif: 'Défaut de conservation des factures',
          montant: 1_000_000,
          unite: 'par année manquante',
        },
      ],
      refArticle: 'Art. 20.01.53',
    },
    Petit: {
      label: 'Petit Contribuable',
      seuil: 'CA < 100 000 000 Ar',
      couleur: '#1769aa',          // bleu standard
      background: '#eef7ff',
      regime:
        'Impôt Synthétique (IS) à 5 % (3 % pour nouveaux adhérents CGA ou immatriculés en ligne). ' +
        'Libératoire de l\'IR et de la TVA. Journal de recettes/dépenses. Conservation : 3 ans.',
      penaliteRetard: ['1 % par mois de retard'],
      amendes: [
        { motif: 'Infraction e-Facturation', montant: 1_000_000 },
        {
          motif: 'Défaut de conservation des factures',
          montant: 100_000,
          unite: 'par année manquante',
        },
      ],
      refArticle: 'Art. 20.01.53',
    },
  };

  return fiches[categorie] || fiches.Petit;
}
