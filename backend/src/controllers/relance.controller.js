const { RelanceModel } = require('../models/relance.model');

class RelanceController {
  // Créer une relance
  static async create(req, res) {
    try {
      const id_agent = req.user?.id || req.body.id_agent || null;
      const relance = await RelanceModel.create({
        ...req.body,
        id_agent,
      });

      res.status(201).json({
        success: true,
        data: relance,
        message: 'Relance créée avec succès',
      });
    } catch (error) {
      console.error('Erreur création relance:', error);
      res.status(500).json({
        success: false,
        message: 'Erreur lors de la création de la relance',
      });
    }
  }

  // Liste paginée avec filtres
  static async findAll(req, res) {
    try {
      const { page, limit, search, statut, type_relance, annee, id_contribuable } = req.query;
      const result = await RelanceModel.findAll({
        page: parseInt(page, 10) || 1,
        limit: parseInt(limit, 10) || 20,
        search: search || '',
        statut: statut || '',
        type_relance: type_relance || '',
        annee: annee || '',
        id_contribuable: id_contribuable || null,
        scope: req.dataScope,
      });

      res.json({
        success: true,
        data: result,
      });
    } catch (error) {
      console.error('Erreur liste relances:', error);
      res.status(500).json({
        success: false,
        message: 'Erreur lors de la récupération des relances',
      });
    }
  }

  // Détail d'une relance
  static async findById(req, res) {
    try {
      const { id } = req.params;
      const relance = await RelanceModel.findById(id);

      if (!relance) {
        return res.status(404).json({
          success: false,
          message: 'Relance introuvable',
        });
      }

      res.json({
        success: true,
        data: relance,
      });
    } catch (error) {
      console.error('Erreur détail relance:', error);
      res.status(500).json({
        success: false,
        message: 'Erreur lors de la récupération de la relance',
      });
    }
  }

  // Relances d'un contribuable
  static async findByContribuable(req, res) {
    try {
      const { id_contribuable } = req.params;
      const relances = await RelanceModel.findByContribuable(id_contribuable);

      res.json({
        success: true,
        data: relances,
      });
    } catch (error) {
      console.error('Erreur relances contribuable:', error);
      res.status(500).json({
        success: false,
        message: 'Erreur lors de la récupération des relances du contribuable',
      });
    }
  }

  // Mettre à jour une relance
  static async update(req, res) {
    try {
      const { id } = req.params;
      const updated = await RelanceModel.update(id, req.body);

      if (!updated) {
        return res.status(404).json({
          success: false,
          message: 'Relance introuvable',
        });
      }

      res.json({
        success: true,
        data: updated,
        message: 'Relance mise à jour avec succès',
      });
    } catch (error) {
      console.error('Erreur mise à jour relance:', error);
      res.status(500).json({
        success: false,
        message: 'Erreur lors de la mise à jour de la relance',
      });
    }
  }

  // Supprimer une relance
  static async delete(req, res) {
    try {
      const { id } = req.params;
      const deleted = await RelanceModel.delete(id);

      if (!deleted) {
        return res.status(404).json({
          success: false,
          message: 'Relance introuvable',
        });
      }

      res.json({
        success: true,
        message: 'Relance supprimée avec succès',
      });
    } catch (error) {
      console.error('Erreur suppression relance:', error);
      res.status(500).json({
        success: false,
        message: 'Erreur lors de la suppression de la relance',
      });
    }
  }

  // Statistiques
  static async getStats(req, res) {
    try {
      const stats = await RelanceModel.getStats(req.dataScope);
      res.json({
        success: true,
        data: stats,
      });
    } catch (error) {
      console.error('Erreur statistiques relances:', error);
      res.status(500).json({
        success: false,
        message: 'Erreur lors de la récupération des statistiques',
      });
    }
  }
}

module.exports = RelanceController;
