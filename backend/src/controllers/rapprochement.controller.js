const prisma = require('../config/prisma');
const { RapprochementModel } = require('../models/rapprochement.model');
const RapprochementService = require('../services/rapprochement.service');
const RapprochementPdfService = require('../services/rapprochement-pdf.service');

const PERIODE_VALIDE = /^\d{4}(-(0[1-9]|1[0-2]))?$/;

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
      });
    }
  }

  // Rapprochement automatique pour un contribuable
  static async autoRapprocher(req, res) {
    try {
      const { id_contribuable } = req.params;
      const { periode } = req.query;

      if (periode && !PERIODE_VALIDE.test(periode)) {
        return res.status(400).json({
          success: false,
          message: 'La période doit être au format AAAA (exercice) ou AAAA-MM (mois).',
        });
      }

      const result = await RapprochementService.autoRapprocherContribuable(id_contribuable, { periode });

      res.json({
        success: true,
        data: result,
        message: `${result.created} nouveau(x) rapprochement(s), ${result.existing} déjà existant(s)`,
      });
    } catch (error) {
      console.error('Erreur rapprochement automatique:', error);
      res.status(500).json({
        success: false,
        message: 'Erreur lors du rapprochement automatique',
      });
    }
  }

  // Aperçu des données disponibles avant une confrontation
  static async getApercu(req, res) {
    try {
      const apercu = await RapprochementService.apercuContribuable(req.params.id_contribuable);
      res.json({
        success: true,
        data: apercu,
      });
    } catch (error) {
      console.error('Erreur aperçu confrontation:', error);
      res.status(500).json({
        success: false,
        message: 'Erreur lors de la récupération de l’aperçu de confrontation',
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
        search,
        periode,
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
        search: search || '',
        periode: periode || '',
        id_declaration: id_declaration || null,
        id_recoupement: id_recoupement || null,
        id_controle: id_controle || null,
        id_contribuable: id_contribuable || null,
        scope: req.dataScope,
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
      });
    }
  }

  // Statistiques d'un périmètre, d'un contribuable ou d'une période
  static async getStats(req, res) {
    try {
      const { id_contribuable, periode } = req.query;

      if (id_contribuable && Number.isNaN(parseInt(id_contribuable, 10))) {
        return res.status(400).json({
          success: false,
          message: 'id_contribuable invalide.',
        });
      }

      if (periode && !PERIODE_VALIDE.test(periode)) {
        return res.status(400).json({
          success: false,
          message: 'La période doit être au format AAAA (exercice) ou AAAA-MM (mois).',
        });
      }

      const stats = await RapprochementModel.getStats(req.dataScope, {
        id_contribuable: id_contribuable || null,
        periode: periode || '',
      });

      res.json({
        success: true,
        data: stats,
      });
    } catch (error) {
      console.error('Erreur statistiques rapprochements:', error);
      res.status(500).json({
        success: false,
        message: 'Erreur lors de la récupération des statistiques',
      });
    }
  }

  // Export PDF du rapport de confrontation
  static async exportPdf(req, res) {
    try {
      const { id_contribuable, periode, statut, type_rapprochement, search } = req.query;

      const numericId = parseInt(id_contribuable, 10);
      if (!id_contribuable || Number.isNaN(numericId)) {
        return res.status(400).json({
          success: false,
          message: 'id_contribuable est requis et doit être un identifiant valide.',
        });
      }

      if (periode && !PERIODE_VALIDE.test(periode)) {
        return res.status(400).json({
          success: false,
          message: 'La période doit être au format AAAA (exercice) ou AAAA-MM (mois).',
        });
      }

      const contribuable = await prisma.contribuables.findUnique({
        where: { id_contribuable: numericId },
        select: { id_contribuable: true, nif: true, raison_sociale: true },
      });

      if (!contribuable) {
        return res.status(404).json({ success: false, message: 'Contribuable introuvable' });
      }

      const filters = {
        statut: statut || '',
        type_rapprochement: type_rapprochement || '',
        search: search || '',
        periode: periode || '',
        id_contribuable,
      };
      const rows = await RapprochementModel.findAllForExport(filters, req.dataScope);
      const doc = RapprochementPdfService.buildDocument({ contribuable, rows, filters });
      const nomFichier = `confrontation-${contribuable.nif || contribuable.id_contribuable}-${new Date().toISOString().slice(0, 10)}.pdf`;

      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', `attachment; filename="${nomFichier}"`);
      doc.pipe(res);
      doc.end();
    } catch (error) {
      console.error('Erreur export PDF rapprochements:', error);
      if (!res.headersSent) {
        res.status(500).json({
          success: false,
          message: 'Erreur lors de la génération du rapport PDF',
        });
      } else {
        res.end();
      }
    }
  }
}

module.exports = RapprochementController;
