const RecoupementService = require('../services/recoupement.service');
const DeclarationModel = require('../models/declaration.model');

class RecoupementController {
  // Créer un recoupement
  static async create(req, res) {
    try {
      const { 
        id_entreprise, 
        source = 'tiers_declarant', // Valeur par défaut
        merchandise_sold, 
        goods_purchased, 
        services_purchased,
        third_party_payments, 
        local_products, 
        import_expenses,
        ca_declare,
        reference_periode
      } = req.body;
      
      // Validation
      if (!id_entreprise) {
        return res.status(400).json({
          success: false,
          message: 'L\'ID de l\'entreprise est obligatoire'
        });
      }
      
      const recoupement = await RecoupementService.createRecoupement({
        id_entreprise,
        source,
        merchandise_sold,
        goods_purchased,
        services_purchased,
        third_party_payments,
        local_products,
        import_expenses,
        ca_declare,
        reference_periode
      });
      
      res.status(201).json({
        success: true,
        data: recoupement,
        message: 'Recoupement créé avec succès',
        source_utilisee: source
      });
    } catch (error) {
      console.error('Erreur création recoupement:', error);
      res.status(500).json({
        success: false,
        message: 'Erreur lors de la création du recoupement',
        error: error.message
      });
    }
  }

  // Analyser les recoupements d'une entreprise
  static async analyser(req, res) {
    try {
      const { id_entreprise } = req.params;
      const declarations = await DeclarationModel.findByEntreprise(id_entreprise);
      
      const analyse = await RecoupementService.analyserRecoupements(id_entreprise, declarations);
      
      res.json({
        success: true,
        data: analyse
      });
    } catch (error) {
      console.error('Erreur analyse recoupements:', error);
      res.status(500).json({
        success: false,
        message: 'Erreur lors de l\'analyse des recoupements',
        error: error.message
      });
    }
  }

  // Statistiques par source
  static async getSourceStats(req, res) {
    try {
      const stats = await RecoupementService.getSourceStats();
      res.json({
        success: true,
        data: stats
      });
    } catch (error) {
      console.error('Erreur statistiques sources:', error);
      res.status(500).json({
        success: false,
        message: 'Erreur lors de la récupération des statistiques',
        error: error.message
      });
    }
  }
}

module.exports = RecoupementController;