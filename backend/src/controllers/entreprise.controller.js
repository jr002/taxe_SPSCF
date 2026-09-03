const EntrepriseModel = require('../models/entreprise.model');

class EntrepriseController {
  // Créer une entreprise
  static async create(req, res) {
    try {
      const { nif, raison_sociale, secteur_activite, adresse, telephone, email, regime_fiscal } = req.body;
      
      // Vérifier si le NIF existe déjà
      const existing = await EntrepriseModel.findByNif(nif);
      if (existing) {
        return res.status(400).json({
          success: false,
          message: 'Une entreprise avec ce NIF existe déjà'
        });
      }
      
      const entreprise = await EntrepriseModel.create({
        nif, raison_sociale, secteur_activite, adresse, telephone, email, regime_fiscal
      });
      
      res.status(201).json({
        success: true,
        data: entreprise,
        message: 'Entreprise créée avec succès'
      });
    } catch (error) {
      console.error('Erreur création entreprise:', error);
      res.status(500).json({
        success: false,
        message: 'Erreur lors de la création de l\'entreprise',
        error: error.message
      });
    }
  }

  // Liste des entreprises
  static async findAll(req, res) {
    try {
      const { page, limit, search } = req.query;
      const result = await EntrepriseModel.findAll({
        page: parseInt(page) || 1,
        limit: parseInt(limit) || 20,
        search: search || ''
      });
      
      res.json({
        success: true,
        data: result
      });
    } catch (error) {
      console.error('Erreur liste entreprises:', error);
      res.status(500).json({
        success: false,
        message: 'Erreur lors de la récupération des entreprises',
        error: error.message
      });
    }
  }

  // Détails d'une entreprise
  static async findById(req, res) {
    try {
      const { id } = req.params;
      const entreprise = await EntrepriseModel.findById(id);
      
      if (!entreprise) {
        return res.status(404).json({
          success: false,
          message: 'Entreprise non trouvée'
        });
      }
      
      res.json({
        success: true,
        data: entreprise
      });
    } catch (error) {
      console.error('Erreur détail entreprise:', error);
      res.status(500).json({
        success: false,
        message: 'Erreur lors de la récupération de l\'entreprise',
        error: error.message
      });
    }
  }

  // Mettre à jour
  static async update(req, res) {
    try {
      const { id } = req.params;
      const entreprise = await EntrepriseModel.update(id, req.body);
      
      if (!entreprise) {
        return res.status(404).json({
          success: false,
          message: 'Entreprise non trouvée'
        });
      }
      
      res.json({
        success: true,
        data: entreprise,
        message: 'Entreprise mise à jour avec succès'
      });
    } catch (error) {
      console.error('Erreur mise à jour entreprise:', error);
      res.status(500).json({
        success: false,
        message: 'Erreur lors de la mise à jour de l\'entreprise',
        error: error.message
      });
    }
  }
}

module.exports = EntrepriseController;