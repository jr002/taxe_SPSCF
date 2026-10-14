const prisma = require('../config/prisma');
const RapprochementModel = require('../models/rapprochement.model');
const DeclarationModel = require('../models/declaration.model');
const RecoupementModel = require('../models/recoupement.model');

class RapprochementService {
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

    // Déterminer les montants à comparer selon le type
    const montantDeclare = options.montant_declare !== undefined
      ? Number(options.montant_declare)
      : (Number(declaration.ca) || Number(declaration.tva_payee) || 0);

    const montantRecoupe = options.montant_recoupe !== undefined
      ? Number(options.montant_recoupe)
      : (Number(recoupement.somme_recoupee) || Number(recoupement.montant_ttc) || Number(recoupement.montant_declare) || 0);

    const ecart = Math.round((montantDeclare - montantRecoupe) * 100) / 100;
    const ecartAbs = Math.abs(ecart);
    const maxMontant = Math.max(montantDeclare, montantRecoupe);
    
    // Calcul du score de cohérence (sur 100)
    let score = 100;
    if (maxMontant > 0) {
      const pctEcart = (ecartAbs / maxMontant) * 100;
      score = Math.max(0, Math.round((100 - pctEcart) * 100) / 100);
    }

    // Typage du rapprochement
    let typeRapprochement = 'exact';
    let statut = 'valide';
    let motif = 'Concordance exacte des montants';

    if (ecartAbs === 0) {
      typeRapprochement = 'exact';
      statut = 'valide';
      motif = 'Montant déclaré strictement égal au montant recoupé';
    } else if (score >= 80) {
      typeRapprochement = 'partiel';
      statut = 'a_verifier';
      motif = `Écart mineur de ${ecartAbs} Ar (${(100 - score).toFixed(1)}%)`;
    } else {
      typeRapprochement = 'divergent';
      statut = 'anomalie';
      motif = `Écart significatif de ${ecartAbs} Ar détecté entre la déclaration et le recoupement (${recoupement.source})`;
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

  // Rapprochement automatique pour un contribuable
  static async autoRapprocherContribuable(id_contribuable, options = {}) {
    const numericId = parseInt(id_contribuable, 10);
    if (isNaN(numericId)) throw new Error('ID contribuable invalide');

    const declarations = await DeclarationModel.findByContribuable(numericId);
    const recoupements = await RecoupementModel.findByContribuable(numericId);

    const results = [];

    for (const dec of declarations) {
      // Chercher des recoupements correspondants par période ou par année
      const matchingRecoupements = recoupements.filter((rec) => {
        if (options.periode && rec.periode !== options.periode) return false;
        if (dec.periode && rec.periode) {
          return dec.periode === rec.periode;
        }
        if (rec.periode && rec.periode.startsWith(String(dec.annee))) {
          return true;
        }
        return true;
      });

      for (const rec of matchingRecoupements) {
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
        } else {
          results.push(existing);
        }
      }
    }

    return {
      count: results.length,
      rapprochements: results,
    };
  }
}

module.exports = RapprochementService;
