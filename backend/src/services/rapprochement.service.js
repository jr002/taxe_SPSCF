const prisma = require('../config/prisma');
const { RapprochementModel, STATUT_RAPPROCHEMENT_PAR_DEFAUT } = require('../models/rapprochement.model');
const DeclarationModel = require('../models/declaration.model');
const RecoupementModel = require('../models/recoupement.model');

const SOURCE_LABELS = {
  tiers_declarant: 'Tiers déclarant',
  banque: 'Banque',
  fournisseur: 'Fournisseur',
  client: 'Client',
  administration: 'Administration',
  assurance: 'Assurance',
  notaire: 'Notaire',
  autre: 'Autre',
};

const formatMontant = (value) => `${Number(value).toLocaleString('fr-FR')} Ar`;
const formatPourcentage = (value) => `${Number(value).toLocaleString('fr-FR', { maximumFractionDigits: 1 })} %`;
const anneeDePeriode = (periode) => {
  const match = /^(\d{4})/.exec(String(periode || ''));
  return match ? Number(match[1]) : null;
};
const estAnneeSeule = (periode) => /^\d{4}$/.test(String(periode || ''));

/**
 * Règles métier du document de contexte :
 * - écart nul : concordance exacte ;
 * - écart ≤ 1 000 Ar : tolérance ;
 * - écart ≤ 5 % du chiffre d'affaires déclaré : rapprochement partiel ;
 * - au-delà : écart à analyser.
 */
const TOLERANCE_MONTANT = 1000;
const SEUIL_PARTIEL = 0.05;

class RapprochementService {
  /**
   * Un recoupement ne doit jamais être confronté à la déclaration d'une autre
   * année. Sans période demandée, on retient les périodes identiques ou, à
   * défaut, une année compatible. Sans aucune information de période
   * exploitable, on écarte le recoupement plutôt que de le dupliquer sur tous
   * les exercices du contribuable.
   */
  static isPeriodCompatible(declaration, recoupement, periodeDemandee) {
    const decPeriode = declaration.periode || null;
    const recPeriode = recoupement.periode || null;
    const decAnnee = Number(declaration.annee) || anneeDePeriode(decPeriode);
    const recAnnee = anneeDePeriode(recPeriode)
      || (recoupement.date_operation ? new Date(recoupement.date_operation).getFullYear() : null);

    if (periodeDemandee) {
      // Une période « AAAA » sélectionne tout l'exercice : la déclaration
      // annuelle comme les recoupements datés de cette année.
      if (estAnneeSeule(periodeDemandee)) {
        const annee = Number(periodeDemandee);
        if (decAnnee !== annee) return false;
        return recAnnee === annee;
      }

      if (recPeriode !== periodeDemandee) return false;
      if (decPeriode) return decPeriode === periodeDemandee;
      return decAnnee === anneeDePeriode(periodeDemandee);
    }

    if (decPeriode && recPeriode) return decPeriode === recPeriode;

    if (decAnnee && recAnnee) return decAnnee === recAnnee;

    return false;
  }

  // Confronter une déclaration et un recoupement
  static async confronter(id_declaration, id_recoupement, options = {}) {
    const declaration = await DeclarationModel.findById(id_declaration);
    if (!declaration) {
      throw new Error('Déclaration introuvable');
    }

    const recoupement = await RecoupementModel.findById(id_recoupement);
    if (!recoupement) {
      throw new Error('Recoupement introuvable');
    }

    // La confrontation porte sur le chiffre d'affaires : les montants de TVA
    // restent des informations déclaratives, jamais la base de comparaison.
    const montantDeclare = options.montant_declare !== undefined
      ? Number(options.montant_declare)
      : (Number(declaration.ca) || 0);

    const montantRecoupe = options.montant_recoupe !== undefined
      ? Number(options.montant_recoupe)
      : (Number(recoupement.somme_recoupee) || Number(recoupement.montant_ttc) || Number(recoupement.montant_declare) || 0);

    const ecart = Math.round((montantDeclare - montantRecoupe) * 100) / 100;
    const ecartAbs = Math.abs(ecart);
    const assiette = Math.abs(montantDeclare);
    const pctEcart = assiette > 0
      ? (ecartAbs / assiette) * 100
      : (ecartAbs > 0 ? 100 : 0);

    // Typage du rapprochement
    let typeRapprochement = 'exact';
    let statut = 'rapproche';
    let score = 100;
    let motif = 'Concordance exacte des montants';
    const sensEcart = ecart > 0
      ? 'le montant déclaré dépasse le montant recoupé'
      : 'le montant recoupé dépasse le montant déclaré';

    if (ecartAbs === 0) {
      typeRapprochement = 'exact';
      statut = 'rapproche';
      score = 100;
      motif = 'Montant déclaré strictement égal au montant recoupé';
    } else if (ecartAbs <= TOLERANCE_MONTANT) {
      typeRapprochement = 'tolerance';
      statut = 'a_verifier';
      score = 90;
      motif = `Écart de ${formatMontant(ecartAbs)} compris dans la tolérance de ${formatMontant(TOLERANCE_MONTANT)} : ${sensEcart}`;
    } else if (assiette > 0 && ecartAbs <= assiette * SEUIL_PARTIEL) {
      typeRapprochement = 'partiel';
      statut = 'a_verifier';
      score = 70;
      motif = `Écart partiel de ${formatMontant(ecartAbs)} (${formatPourcentage(pctEcart)} du chiffre d'affaires déclaré) : ${sensEcart}`;
    } else {
      // Les contraintes `chk_rapprochements_type` et `chk_rapprochements_statut`
      // n'admettent que les valeurs déclarées dans le modèle : un écart
      // significatif se qualifie « partiel » avec le statut « ecart ».
      typeRapprochement = 'partiel';
      statut = 'ecart';
      score = 0;
      const source = SOURCE_LABELS[recoupement.source] || recoupement.source || 'source non précisée';
      motif = `Écart significatif de ${formatMontant(ecartAbs)} (${formatPourcentage(pctEcart)} du chiffre d'affaires déclaré) constaté avec le recoupement « ${source} » : ${sensEcart}`;
    }

    if (options.statut) statut = options.statut;
    if (options.motif) motif = options.motif;

    return await RapprochementModel.create({
      id_declaration: declaration.id_declaration,
      id_recoupement: recoupement.id_recoupement,
      id_controle: options.id_controle || null,
      type_rapprochement: typeRapprochement,
      score,
      montant_declare: montantDeclare,
      montant_recoupe: montantRecoupe,
      ecart,
      statut,
      motif,
    });
  }

  /**
   * Photographie des données disponibles avant une confrontation : ce que le
   * contribuable a déclaré, ce que les sources externes ont signalé et ce qui a
   * déjà été confronté. Elle évite de charger toutes les lignes dans le
   * navigateur pour afficher l'introduction.
   */
  static async apercuContribuable(id_contribuable) {
    const numericId = parseInt(id_contribuable, 10);
    if (isNaN(numericId)) throw new Error('ID contribuable invalide');

    const [declarations, recoupements, rapprochements] = await Promise.all([
      prisma.declarations.findMany({
        where: { id_contribuable: numericId },
        select: { annee: true, ca: true },
      }),
      prisma.recoupements.findMany({
        where: { id_contribuable: numericId },
        select: {
          source: true,
          periode: true,
          date_operation: true,
          somme_recoupee: true,
          montant_ttc: true,
          montant_declare: true,
        },
      }),
      prisma.rapprochements.aggregate({
        where: {
          OR: [
            { declarations: { id_contribuable: numericId } },
            { recoupements: { id_contribuable: numericId } },
          ],
        },
        _count: { _all: true },
        _max: { date_rapprochement: true },
      }),
    ]);

    // Même montant de référence que `confronter`.
    const montantRecoupe = (rec) =>
      Number(rec.somme_recoupee) || Number(rec.montant_ttc) || Number(rec.montant_declare) || 0;

    const annees = new Map();
    for (const dec of declarations) {
      if (!dec.annee) continue;
      annees.set(dec.annee, (annees.get(dec.annee) || 0) + 1);
    }

    const periodes = new Map();
    const sources = new Map();
    const anneesRecoupements = new Map();
    let montantTotal = 0;
    let sansPeriode = 0;

    for (const rec of recoupements) {
      const montant = montantRecoupe(rec);
      montantTotal += montant;
      if (!rec.periode && !rec.date_operation) sansPeriode += 1;

      const annee = anneeDePeriode(rec.periode)
        || (rec.date_operation ? new Date(rec.date_operation).getFullYear() : null);
      if (annee) {
        anneesRecoupements.set(annee, (anneesRecoupements.get(annee) || 0) + 1);
      }

      if (rec.periode) {
        const courant = periodes.get(rec.periode) || { total: 0, montant: 0 };
        periodes.set(rec.periode, { total: courant.total + 1, montant: courant.montant + montant });
      }

      const source = rec.source || 'autre';
      const courant = sources.get(source) || { total: 0, montant: 0 };
      sources.set(source, { total: courant.total + 1, montant: courant.montant + montant });
    }

    return {
      declarations: {
        total: declarations.length,
        ca_total: declarations.reduce((sum, dec) => sum + (Number(dec.ca) || 0), 0),
        annees: [...annees.entries()]
          .sort((a, b) => b[0] - a[0])
          .map(([annee, total]) => ({ annee, total })),
      },
      recoupements: {
        total: recoupements.length,
        montant_total: montantTotal,
        sans_periode: sansPeriode,
        annees: [...anneesRecoupements.entries()]
          .sort((a, b) => b[0] - a[0])
          .map(([annee, total]) => ({ annee, total })),
        periodes: [...periodes.entries()]
          .sort((a, b) => b[0].localeCompare(a[0]))
          .map(([periode, valeurs]) => ({ periode, ...valeurs })),
        sources: [...sources.entries()]
          .sort((a, b) => b[1].total - a[1].total)
          .map(([source, valeurs]) => ({ source, ...valeurs })),
      },
      rapprochements: {
        total: rapprochements._count?._all || 0,
        derniere_date: rapprochements._max?.date_rapprochement || null,
      },
    };
  }

  // Rapprochement automatique pour un contribuable
  static async autoRapprocherContribuable(id_contribuable, options = {}) {
    const numericId = parseInt(id_contribuable, 10);
    if (isNaN(numericId)) throw new Error('ID contribuable invalide');

    const declarations = await DeclarationModel.findByContribuable(numericId);
    const recoupements = await RecoupementModel.findByContribuable(numericId);

    const results = [];
    let created = 0;
    const recoupementsRattaches = new Set();

    for (const dec of declarations) {
      // Chercher des recoupements correspondants par période ou par année
      const matchingRecoupements = recoupements.filter((rec) => this.isPeriodCompatible(dec, rec, options.periode));

      for (const rec of matchingRecoupements) {
        recoupementsRattaches.add(rec.id_recoupement);
        // Vérifier si un rapprochement existe déjà
        const existing = await prisma.rapprochements.findFirst({
          where: {
            id_declaration: dec.id_declaration,
            id_recoupement: rec.id_recoupement,
          },
        });

        if (!existing) {
          const rapprochement = await this.confronter(dec.id_declaration, rec.id_recoupement);
          results.push(rapprochement);
          created += 1;
        } else {
          results.push(existing);
        }
      }
    }

    return {
      count: results.length,
      created,
      existing: results.length - created,
      // Recoupements sans période exploitable ou rattachés à un exercice absent.
      ignored: recoupements.length - recoupementsRattaches.size,
      rapprochements: results,
    };
  }
}

module.exports = RapprochementService;
