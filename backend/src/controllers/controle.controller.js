const ControleService = require('../services/controle.service');
const ControleModel = require('../models/controle.model');

class ControleController {
  // Effectuer un contrôle fiscal sur une déclaration
  static async effectuerControle(req, res) {
    try {
      const { id_declaration } = req.params;
      const { id_agent = null } = req.body;
      
      const result = await ControleService.effectuerControle(id_declaration, id_agent);
      
      res.json({
        success: true,
        data: result,
        message: 'Contrôle effectué avec succès'
      });
    } catch (error) {
      console.error('Erreur contrôle:', error);
      res.status(500).json({
        success: false,
        message: 'Erreur lors du contrôle',
        error: error.message
      });
    }
  }

  // Historique des contrôles d'une déclaration
  static async getControles(req, res) {
    try {
      const { id_declaration } = req.params;
      const controles = await ControleModel.findByDeclaration(id_declaration);
      
      res.json({
        success: true,
        data: controles
      });
    } catch (error) {
      console.error('Erreur historique contrôles:', error);
      res.status(500).json({
        success: false,
        message: 'Erreur lors de la récupération des contrôles',
        error: error.message
      });
    }
  }

  // Statistiques
  static async getStats(req, res) {
    try {
      const stats = await ControleService.getStatistiques();
      res.json({
        success: true,
        data: stats
      });
    } catch (error) {
      console.error('Erreur statistiques contrôles:', error);
      res.status(500).json({
        success: false,
        message: 'Erreur lors de la récupération des statistiques',
        error: error.message
      });
    }
  }
}

module.exports = ControleController;