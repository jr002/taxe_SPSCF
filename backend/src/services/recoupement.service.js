const RecoupementModel = require('../models/recoupement.model');
const FiscalService = require('./fiscal.service');

class RecoupementService {
  // Créer un recoupement avec source par défaut
  static async createRecoupement(data) {
    // Si source non fournie, mettre 'tiers_declarant' par défaut
    const source = data.source || 'tiers_declarant';
    
    // Calculer la somme recoupée
    const sommeRecoupee = FiscalService.calculerSommeRecoupee(data);
    
    const recoupementData = {
      ...data,
      source: source,
      somme_recoupee: sommeRecoupee
    };
    
    const recoupement = await RecoupementModel.create(recoupementData);
    
    // Vérifier la cohérence
    if (data.ca_declare) {
      const verification = FiscalService.verifierRecoupement(
        sommeRecoupee,
        parseFloat(data.ca_declare)
      );
      recoupement.verification = verification;
    }
    
    return recoupement;
  }

  // Analyser les recoupements d'une entreprise
  static async analyserRecoupements(id_entreprise, declarations) {
    const recoupements = await RecoupementModel.findByEntreprise(id_entreprise);
    
    if (recoupements.length === 0) {
      return { 
        hasData: false, 
        message: 'Aucun recoupement trouvé' 
      };
    }
    
    const dernierRecoupement = recoupements[0];
    const caDeclare = declarations[0]?.ca || 0;
    
    const verification = FiscalService.verifierRecoupement(
      dernierRecoupement.somme_recoupee,
      caDeclare
    );
    
    return {
      hasData: true,
      recoupements: recoupements,
      dernier: dernierRecoupement,
      verification: verification,
      somme_recoupee: dernierRecoupement.somme_recoupee,
      ca_declare: caDeclare,
      source: dernierRecoupement.source // Ajouter la source
    };
  }

  // Statistiques par source
  static async getSourceStats() {
    return await RecoupementModel.getSourceStats();
  }
}

module.exports = RecoupementService;