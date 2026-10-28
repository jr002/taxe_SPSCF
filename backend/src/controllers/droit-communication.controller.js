const DroitCommunicationModel = require('../models/droit-communication.model');

class DroitCommunicationController {
  static async create(req, res) {
    try {
      const droit = await DroitCommunicationModel.create({
        ...req.body,
        id_agent: req.user?.id || req.body.id_agent || null,
      });

      res.status(201).json({
        success: true,
        data: droit,
        message: 'Droit de communication enregistré avec succès',
      });
    } catch (error) {
      console.error('Erreur création droit de communication:', error);
      res.status(500).json({
        success: false,
        message: 'Erreur lors de l\'enregistrement du droit de communication',
      });
    }
  }

  static async findAll(req, res) {
    try {
      const { page, limit, search, statut, type_tier, id_contribuable } = req.query;
      const result = await DroitCommunicationModel.findAll({
        page: parseInt(page, 10) || 1,
        limit: parseInt(limit, 10) || 20,
        search: search || '',
        statut: statut || '',
        type_tier: type_tier || '',
        id_contribuable: id_contribuable || null,
        scope: req.dataScope,
      });

      res.json({ success: true, data: result });
    } catch (error) {
      console.error('Erreur liste droits de communication:', error);
      res.status(500).json({
        success: false,
        message: 'Erreur lors de la récupération des droits de communication',
      });
    }
  }

  static async findByContribuable(req, res) {
    try {
      const { id } = req.params;
      const droits = await DroitCommunicationModel.findByContribuable(id);
      res.json({ success: true, data: droits });
    } catch (error) {
      console.error('Erreur droits de communication du contribuable:', error);
      res.status(500).json({
        success: false,
        message: 'Erreur lors de la récupération des droits de communication',
      });
    }
  }

  static async findById(req, res) {
    try {
      const { id } = req.params;
      const droit = await DroitCommunicationModel.findById(id);

      if (!droit) {
        return res.status(404).json({ success: false, message: 'Droit de communication non trouvé' });
      }

      res.json({ success: true, data: droit });
    } catch (error) {
      console.error('Erreur détail droit de communication:', error);
      res.status(500).json({
        success: false,
        message: 'Erreur lors de la récupération du droit de communication',
      });
    }
  }

  static async update(req, res) {
    try {
      const { id } = req.params;
      const updated = await DroitCommunicationModel.update(id, req.body);

      if (!updated) {
        return res.status(404).json({ success: false, message: 'Droit de communication non trouvé' });
      }

      res.json({
        success: true,
        data: updated,
        message: 'Droit de communication mis à jour avec succès',
      });
    } catch (error) {
      console.error('Erreur mise à jour droit de communication:', error);
      res.status(500).json({
        success: false,
        message: 'Erreur lors de la mise à jour du droit de communication',
      });
    }
  }

  static async delete(req, res) {
    try {
      const { id } = req.params;
      const deleted = await DroitCommunicationModel.delete(id);

      if (!deleted) {
        return res.status(404).json({ success: false, message: 'Droit de communication non trouvé' });
      }

      res.json({ success: true, message: 'Droit de communication supprimé avec succès' });
    } catch (error) {
      console.error('Erreur suppression droit de communication:', error);
      res.status(500).json({
        success: false,
        message: 'Erreur lors de la suppression du droit de communication',
      });
    }
  }

  static async getStatutStats(req, res) {
    try {
      const stats = await DroitCommunicationModel.getStatutStats(req.query.id_contribuable, req.dataScope);
      res.json({ success: true, data: stats });
    } catch (error) {
      console.error('Erreur statistiques droits de communication:', error);
      res.status(500).json({
        success: false,
        message: 'Erreur lors de la récupération des statistiques',
      });
    }
  }
}

module.exports = DroitCommunicationController;
