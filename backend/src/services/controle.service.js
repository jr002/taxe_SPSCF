const ControleModel = require('../models/controle.model');
const DeclarationModel = require('../models/declaration.model');
const FiscalService = require('./fiscal.service');

class ControleService {
  // Effectuer un contrôle complet
  static async effectuerControle(id_declaration, id_agent) {
    // Récupérer la déclaration
    const declaration = await DeclarationModel.findById(id_declaration);
    if (!declaration) {
      throw new Error('Déclaration non trouvée');
    }
    
    // Calculer la TVA théorique
    const tvaTheorique = FiscalService.calculerTVATheorique(
      declaration.ca,
      declaration.benefice,
      declaration.regime_fiscal
    );
    
    // Calculer l'écart
    const ecart = FiscalService.calculerEcart(tvaTheorique, declaration.tva_payee);
    const pourcentageEcart = FiscalService.calculerPourcentageEcart(
      tvaTheorique,
      declaration.tva_payee
    );
    
    // Déterminer le statut
    const resultat = FiscalService.determinerStatut(pourcentageEcart);
    
    // Créer le contrôle
    const controleData = {
      id_declaration,
      id_agent,
      type: 'TVA',
      resultat,
      ecart,
      pourcentage_ecart: pourcentageEcart,
      commentaire: `Écart de ${pourcentageEcart}% détecté`
    };
    
    const controle = await ControleModel.create(controleData);
    
    // Mettre à jour la déclaration
    await DeclarationModel.update(id_declaration, {
      tva_theorique: tvaTheorique,
      statut: resultat
    });
    
    return {
      controle,
      declaration: {
        ...declaration,
        tva_theorique: tvaTheorique,
        statut: resultat
      },
      analyse: {
        tva_theorique: tvaTheorique,
        tva_payee: declaration.tva_payee,
        ecart: ecart,
        pourcentage_ecart: pourcentageEcart,
        resultat: resultat
      }
    };
  }

  // Statistiques globales
  static async getStatistiques(scope) {
    const stats = await ControleModel.getStats(scope);
    const byType = await ControleModel.getByType(scope);
    
    return {
      global: stats,
      par_type: byType
    };
  }
}

module.exports = ControleService;