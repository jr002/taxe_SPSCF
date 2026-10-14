const RecoupementService = require('../services/recoupement.service');
const RecoupementModel = require('../models/recoupement.model');
const DeclarationModel = require('../models/declaration.model');

class RecoupementController {
  // Créer un recoupement
  static async create(req, res) {
    try {
      const { 
        id_contribuable, 
        source = 'tiers_declarant',
        merchandise_sold, 
        goods_purchased, 
        services_purchased,
        third_party_payments, 
        local_products, 
        import_expenses,
        somme_recoupee,
        periode,
        reference,
        type_operation,
        nif_tiers,
        date_operation,
        montant_declare,
        montant_tva,
        montant_ttc,
        ca_declare,
        reference_periode
      } = req.body;
      
      const recoupement = await RecoupementService.createRecoupement({
        id_contribuable,
        source,
        merchandise_sold,
        goods_purchased,
        services_purchased,
        third_party_payments,
        local_products,
        import_expenses,
        somme_recoupee,
        periode: periode || reference_periode,
        reference,
        type_operation,
        nif_tiers,
        date_operation,
        montant_declare,
        montant_tva,
        montant_ttc,
        ca_declare
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

  // Liste paginée des recoupements
  static async findAll(req, res) {
    try {
      const { page, limit, search, periode, source, type_operation, id_contribuable } = req.query;
      const result = await RecoupementModel.findAll({
        page: parseInt(page, 10) || 1,
        limit: parseInt(limit, 10) || 20,
        search: search || '',
        periode: periode || '',
        source: source || '',
        type_operation: type_operation || '',
        id_contribuable: id_contribuable || null,
      });

      res.json({
        success: true,
        data: result
      });
    } catch (error) {
      console.error('Erreur liste recoupements:', error);
      res.status(500).json({
        success: false,
        message: 'Erreur lors de la récupération des recoupements',
        error: error.message
      });
    }
  }

  // Détails d'un recoupement
  static async findById(req, res) {
    try {
      const { id } = req.params;
      const recoupement = await RecoupementModel.findById(id);
      
      if (!recoupement) {
        return res.status(404).json({
          success: false,
          message: 'Recoupement non trouvé'
        });
      }

      res.json({
        success: true,
        data: recoupement
      });
    } catch (error) {
      console.error('Erreur détail recoupement:', error);
      res.status(500).json({
        success: false,
        message: 'Erreur lors de la récupération du recoupement',
        error: error.message
      });
    }
  }

  // Mettre à jour un recoupement
  static async update(req, res) {
    try {
      const { id } = req.params;
      const updated = await RecoupementModel.update(id, req.body);

      if (!updated) {
        return res.status(404).json({
          success: false,
          message: 'Recoupement non trouvé'
        });
      }

      res.json({
        success: true,
        data: updated,
        message: 'Recoupement mis à jour avec succès'
      });
    } catch (error) {
      console.error('Erreur mise à jour recoupement:', error);
      res.status(500).json({
        success: false,
        message: 'Erreur lors de la mise à jour du recoupement',
        error: error.message
      });
    }
  }

  // Supprimer un recoupement
  static async delete(req, res) {
    try {
      const { id } = req.params;
      const deleted = await RecoupementModel.delete(id);

      if (!deleted) {
        return res.status(404).json({
          success: false,
          message: 'Recoupement non trouvé'
        });
      }

      res.json({
        success: true,
        message: 'Recoupement supprimé avec succès'
      });
    } catch (error) {
      console.error('Erreur suppression recoupement:', error);
      res.status(500).json({
        success: false,
        message: 'Erreur lors de la suppression du recoupement',
        error: error.message
      });
    }
  }

  // Analyser les recoupements d'un contribuable
  static async analyser(req, res) {
    try {
      const { id_contribuable } = req.params;
      const declarations = await DeclarationModel.findByContribuable(id_contribuable);
      
      const analyse = await RecoupementService.analyserRecoupements(id_contribuable, declarations);
      
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