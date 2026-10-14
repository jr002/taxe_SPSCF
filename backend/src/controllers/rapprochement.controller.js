const RapprochementModel = require('../models/rapprochement.model');
const RapprochementService = require('../services/rapprochement.service');

class RapprochementController {
  // Créer manuellement un rapprochement
  static async create(req, res) {
    try {
      const rapprochement = await RapprochementModel.create(req.body);
      res.status(201).json({
        success: true,
        data: rapprochement,
        message: 'Rapprochement créé avec succès',
      });
    } catch (error) {
      console.error('Erreur création rapprochement:', error);
      res.status(500).json({
        success: false,
        message: 'Erreur lors de la création du rapprochement',
        error: error.message,
      });
    }
  }

  // Confronter une déclaration et un recoupement
  static async confronter(req, res) {
    try {
      const { id_declaration, id_recoupement, montant_declare, montant_recoupe, id_controle, motif } = req.body;

      if (!id_declaration || !id_recoupement) {
        return res.status(400).json({
          success: false,
          message: 'id_declaration et id_recoupement sont requis',
        });
      }

      const rapprochement = await RapprochementService.confronter(id_declaration, id_recoupement, {
        montant_declare,
        montant_recoupe,
        id_controle,
        motif,
      });

      res.status(201).json({
        success: true,
        data: rapprochement,
        message: 'Confrontation effectuée avec succès',
      });
    } catch (error) {
      console.error('Erreur confrontation:', error);
      res.status(500).json({
        success: false,
        message: 'Erreur lors de la confrontation',
        error: error.message,
      });
    }
  }

  // Rapprochement automatique pour un contribuable
  static async autoRapprocher(req, res) {
    try {
      const { id_contribuable } = req.params;
      const { periode } = req.query;

      const result = await RapprochementService.autoRapprocherContribuable(id_contribuable, { periode });

      res.json({
        success: true,
        data: result,
        message: `${result.count} rapprochement(s) traité(s)`,
      });
    } catch (error) {
      console.error('Erreur rapprochement automatique:', error);
      res.status(500).json({
        success: false,
        message: 'Erreur lors du rapprochement automatique',
        error: error.message,
      });
    }
  }

  // Liste paginée avec filtres
  static async findAll(req, res) {
    try {
      const {
        page,
        limit,
        statut,
        type_rapprochement,
        id_declaration,
        id_recoupement,
        id_controle,
        id_contribuable,
      } = req.query;

      const result = await RapprochementModel.findAll({
        page: parseInt(page, 10) || 1,
        limit: parseInt(limit, 10) || 20,
        statut: statut || '',
        type_rapprochement: type_rapprochement || '',
        id_declaration: id_declaration || null,
        id_recoupement: id_recoupement || null,
        id_controle: id_controle || null,
        id_contribuable: id_contribuable || null,
      });

      res.json({
        success: true,
        data: result,
      });
    } catch (error) {
      console.error('Erreur liste rapprochements:', error);
      res.status(500).json({
        success: false,
        message: 'Erreur lors de la récupération des rapprochements',
        error: error.message,
      });
    }
  }

  // Détail d'un rapprochement
  static async findById(req, res) {
    try {
      const { id } = req.params;
      const rapprochement = await RapprochementModel.findById(id);

      if (!rapprochement) {
        return res.status(404).json({
          success: false,
          message: 'Rapprochement introuvable',
        });
      }

      res.json({
        success: true,
        data: rapprochement,
      });
    } catch (error) {
      console.error('Erreur détail rapprochement:', error);
      res.status(500).json({
        success: false,
        message: 'Erreur lors de la récupération du rapprochement',
        error: error.message,
      });
    }
  }

  // Mettre à jour un rapprochement
  static async update(req, res) {
    try {
      const { id } = req.params;
      const updated = await RapprochementModel.update(id, req.body);

      if (!updated) {
        return res.status(404).json({
          success: false,
          message: 'Rapprochement introuvable',
        });
      }

      res.json({
        success: true,
        data: updated,
        message: 'Rapprochement mis à jour avec succès',
      });
    } catch (error) {
      console.error('Erreur mise à jour rapprochement:', error);
      res.status(500).json({
        success: false,
        message: 'Erreur lors de la mise à jour du rapprochement',
        error: error.message,
      });
    }
  }

  // Changer le statut d'un rapprochement (validation/rejet)
  static async updateStatut(req, res) {
    try {
      const { id } = req.params;
      const { statut, motif } = req.body;

      if (!statut) {
        return res.status(400).json({
          success: false,
          message: 'Le statut est obligatoire',
        });
      }

      const updated = await RapprochementModel.update(id, { statut, motif });

      if (!updated) {
        return res.status(404).json({
          success: false,
          message: 'Rapprochement introuvable',
        });
      }

      res.json({
        success: true,
        data: updated,
        message: `Statut mis à jour : ${statut}`,
      });
    } catch (error) {
      console.error('Erreur statut rapprochement:', error);
      res.status(500).json({
        success: false,
        message: 'Erreur lors du changement de statut du rapprochement',
        error: error.message,
      });
    }
  }

  // Supprimer un rapprochement
  static async delete(req, res) {
    try {
      const { id } = req.params;
      const deleted = await RapprochementModel.delete(id);

      if (!deleted) {
        return res.status(404).json({
          success: false,
          message: 'Rapprochement introuvable',
        });
      }

      res.json({
        success: true,
        message: 'Rapprochement supprimé avec succès',
      });
    } catch (error) {
      console.error('Erreur suppression rapprochement:', error);
      res.status(500).json({
        success: false,
        message: 'Erreur lors de la suppression du rapprochement',
        error: error.message,
      });
    }
  }

  // Statistiques globales
  static async getStats(req, res) {
    try {
      const stats = await RapprochementModel.getStats();
      res.json({
        success: true,
        data: stats,
      });
    } catch (error) {
      console.error('Erreur statistiques rapprochements:', error);
      res.status(500).json({
        success: false,
        message: 'Erreur lors de la récupération des statistiques',
        error: error.message,
      });
    }
  }
}

module.exports = RapprochementController;
