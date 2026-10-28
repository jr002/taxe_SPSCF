const { EtatContribuableModel } = require('../models/etat-contribuable.model');

class EtatContribuableController {
  // Créer un nouvel état pour un contribuable
  static async create(req, res) {
    try {
      const id_contribuable = req.params.id_contribuable || req.body.id_contribuable;
      const { statut_activite, statut_conformite, motif } = req.body;
      const id_agent = req.user?.id || req.body.id_agent || null;

      if (!id_contribuable) {
        return res.status(400).json({
          success: false,
          message: 'L\'ID du contribuable est obligatoire',
        });
      }

      const nouvelEtat = await EtatContribuableModel.create({
        id_contribuable,
        statut_activite,
        statut_conformite,
        id_agent,
        motif,
      });

      res.status(201).json({
        success: true,
        data: nouvelEtat,
        message: 'État du contribuable enregistré avec succès',
      });
    } catch (error) {
      console.error('Erreur création état contribuable:', error);
      res.status(500).json({
        success: false,
        message: 'Erreur lors de l\'enregistrement de l\'état du contribuable',
      });
    }
  }

  // Liste paginée des états
  static async findAll(req, res) {
    try {
      const { page, limit, statut_activite, statut_conformite, id_contribuable } = req.query;
      const result = await EtatContribuableModel.findAll({
        page: parseInt(page, 10) || 1,
        limit: parseInt(limit, 10) || 20,
        statut_activite: statut_activite || '',
        statut_conformite: statut_conformite || '',
        id_contribuable: id_contribuable || null,
        scope: req.dataScope,
      });

      res.json({
        success: true,
        data: result,
      });
    } catch (error) {
      console.error('Erreur liste états:', error);
      res.status(500).json({
        success: false,
        message: 'Erreur lors de la récupération des états',
      });
    }
  }

  // Détails par ID
  static async findById(req, res) {
    try {
      const { id } = req.params;
      const etat = await EtatContribuableModel.findById(id);

      if (!etat) {
        return res.status(404).json({
          success: false,
          message: 'État introuvable',
        });
      }

      res.json({
        success: true,
        data: etat,
      });
    } catch (error) {
      console.error('Erreur détail état:', error);
      res.status(500).json({
        success: false,
        message: 'Erreur lors de la récupération de l\'état',
      });
    }
  }

  // Historique des états d'un contribuable
  static async findByContribuable(req, res) {
    try {
      const id_contribuable = req.params.id_contribuable || req.params.id;
      const historique = await EtatContribuableModel.findByContribuable(id_contribuable);

      res.json({
        success: true,
        data: historique,
      });
    } catch (error) {
      console.error('Erreur historique états contribuable:', error);
      res.status(500).json({
        success: false,
        message: 'Erreur lors de la récupération de l\'historique des états',
      });
    }
  }

  // Dernier état d'un contribuable
  static async findLatestByContribuable(req, res) {
    try {
      const id_contribuable = req.params.id_contribuable || req.params.id;
      const dernier = await EtatContribuableModel.findLatestByContribuable(id_contribuable);

      res.json({
        success: true,
        data: dernier,
      });
    } catch (error) {
      console.error('Erreur dernier état contribuable:', error);
      res.status(500).json({
        success: false,
        message: 'Erreur lors de la récupération du dernier état',
      });
    }
  }

  // Mettre à jour un enregistrement d'état
  static async update(req, res) {
    try {
      const { id } = req.params;
      const updated = await EtatContribuableModel.update(id, req.body);

      if (!updated) {
        return res.status(404).json({
          success: false,
          message: 'État introuvable',
        });
      }

      res.json({
        success: true,
        data: updated,
        message: 'État mis à jour avec succès',
      });
    } catch (error) {
      console.error('Erreur mise à jour état:', error);
      res.status(500).json({
        success: false,
        message: 'Erreur lors de la mise à jour de l\'état',
      });
    }
  }

  // Supprimer
  static async delete(req, res) {
    try {
      const { id } = req.params;
      const deleted = await EtatContribuableModel.delete(id);

      if (!deleted) {
        return res.status(404).json({
          success: false,
          message: 'État introuvable',
        });
      }

      res.json({
        success: true,
        message: 'État supprimé avec succès',
      });
    } catch (error) {
      console.error('Erreur suppression état:', error);
      res.status(500).json({
        success: false,
        message: 'Erreur lors de la suppression de l\'état',
      });
    }
  }

  // Statistiques
  static async getStats(req, res) {
    try {
      const stats = await EtatContribuableModel.getStats(req.dataScope);
      res.json({
        success: true,
        data: stats,
      });
    } catch (error) {
      console.error('Erreur statistiques états:', error);
      res.status(500).json({
        success: false,
        message: 'Erreur lors de la récupération des statistiques',
      });
    }
  }
}

module.exports = EtatContribuableController;
