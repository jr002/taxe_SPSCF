const DeclarationModel = require('../models/declaration.model');
const FiscalService = require('../services/fiscal.service');

class DeclarationController {
  // Créer une déclaration avec calcul auto
  static async create(req, res) {
    try {
      const { id_entreprise, annee, ca, benefice, tva_collectee, tva_deductible, tva_payee, regime_fiscal } = req.body;
      
      // Calculer la TVA théorique
      const tvaTheorique = FiscalService.calculerTVATheorique(ca, benefice, regime_fiscal);
      
      // Calculer l'écart et déterminer le statut
      const ecart = FiscalService.calculerEcart(tvaTheorique, tva_payee);
      const pourcentageEcart = FiscalService.calculerPourcentageEcart(tvaTheorique, tva_payee);
      const statut = FiscalService.determinerStatut(pourcentageEcart);
      
      const declaration = await DeclarationModel.create({
        id_entreprise,
        annee,
        ca,
        benefice,
        tva_collectee,
        tva_deductible,
        tva_payee,
        tva_theorique: tvaTheorique,
        statut
      });
      
      res.status(201).json({
        success: true,
        data: {
          declaration,
          analyse: {
            tva_theorique: tvaTheorique,
            ecart: ecart,
            pourcentage_ecart: pourcentageEcart,
            statut: statut
          }
        },
        message: 'Déclaration créée avec succès'
      });
    } catch (error) {
      console.error('Erreur création déclaration:', error);
      res.status(500).json({
        success: false,
        message: 'Erreur lors de la création de la déclaration',
        error: error.message
      });
    }
  }

  // Liste des déclarations
  static async findAll(req, res) {
    try {
      const { page, limit, search, statut, annee } = req.query;
      const result = await DeclarationModel.findAll({
        page: parseInt(page) || 1,
        limit: parseInt(limit) || 20,
        search: search || '',
        statut: statut || '',
        annee: annee || ''
      });
      
      res.json({
        success: true,
        data: result
      });
    } catch (error) {
      console.error('Erreur liste déclarations:', error);
      res.status(500).json({
        success: false,
        message: 'Erreur lors de la récupération des déclarations',
        error: error.message
      });
    }
  }

  // Détails d'une déclaration
  static async findById(req, res) {
    try {
      const { id } = req.params;
      const declaration = await DeclarationModel.findById(id);
      
      if (!declaration) {
        return res.status(404).json({
          success: false,
          message: 'Déclaration non trouvée'
        });
      }
      
      res.json({
        success: true,
        data: declaration
      });
    } catch (error) {
      console.error('Erreur détail déclaration:', error);
      res.status(500).json({
        success: false,
        message: 'Erreur lors de la récupération de la déclaration',
        error: error.message
      });
    }
  }

  // Statistiques
  static async getStats(req, res) {
    try {
      const stats = await DeclarationModel.getStats();
      res.json({
        success: true,
        data: stats
      });
    } catch (error) {
      console.error('Erreur statistiques:', error);
      res.status(500).json({
        success: false,
        message: 'Erreur lors de la récupération des statistiques',
        error: error.message
      });
    }
  }
}

module.exports = DeclarationController;