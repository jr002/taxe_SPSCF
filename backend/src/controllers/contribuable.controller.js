const ContribuableModel = require('../models/contribuable.model');

class ContribuableController {
  // Créer un contribuable
  static async create(req, res) {
    try {
      const { nif, raison_sociale, secteur_activite, adresse, telephone, email, regime_fiscal } = req.body;
      
      // Vérifier si le NIF existe déjà
      const existing = await ContribuableModel.findByNif(nif);
      if (existing) {
        return res.status(400).json({
          success: false,
          message: 'Un contribuable avec ce NIF existe déjà'
        });
      }
      
      const contribuable = await ContribuableModel.create({
        nif, raison_sociale, secteur_activite, adresse, telephone, email, regime_fiscal
      });
      
      res.status(201).json({
        success: true,
        data: contribuable,
        message: 'Contribuable créé avec succès'
      });
    } catch (error) {
      console.error('Erreur création contribuable:', error);
      res.status(500).json({
        success: false,
        message: 'Erreur lors de la création du contribuable',
        error: error.message
      });
    }
  }

  // Liste des contribuables
  static async findAll(req, res) {
    try {
      const { page, limit, search } = req.query;
      const result = await ContribuableModel.findAll({
        page: parseInt(page) || 1,
        limit: parseInt(limit) || 20,
        search: search || ''
      });
      
      res.json({
        success: true,
        data: result
      });
    } catch (error) {
      console.error('Erreur liste contribuables:', error);
      res.status(500).json({
        success: false,
        message: 'Erreur lors de la récupération des contribuables',
        error: error.message
      });
    }
  }

  // Détails d'un contribuable
  static async findById(req, res) {
    try {
      const { id } = req.params;
      const contribuable = await ContribuableModel.findById(id);
      
      if (!contribuable) {
        return res.status(404).json({
          success: false,
          message: 'Contribuable non trouvé'
        });
      }
      
      res.json({
        success: true,
        data: contribuable
      });
    } catch (error) {
      console.error('Erreur détail contribuable:', error);
      res.status(500).json({
        success: false,
        message: 'Erreur lors de la récupération du contribuable',
        error: error.message
      });
    }
  }

  // Mettre à jour
  static async update(req, res) {
    try {
      const { id } = req.params;
      const contribuable = await ContribuableModel.update(id, req.body);
      
      if (!contribuable) {
        return res.status(404).json({
          success: false,
          message: 'Contribuable non trouvé'
        });
      }
      
      res.json({
        success: true,
        data: contribuable,
        message: 'Contribuable mis à jour avec succès'
      });
    } catch (error) {
      console.error('Erreur mise à jour contribuable:', error);
      res.status(500).json({
        success: false,
        message: 'Erreur lors de la mise à jour du contribuable',
        error: error.message
      });
    }
  }
}

module.exports = ContribuableController;