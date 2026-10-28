const { CentreModel, CENTRE_TYPES } = require('../models/centre.model');
const { CENTRE_ADMINISTRATEURS } = require('../models/agent.model');

class CentreController {
  static async findAll(req, res) {
    try {
      res.json({ success: true, data: await CentreModel.findAll(req.dataScope) });
    } catch (error) {
      console.error('Erreur liste centres:', error);
      res.status(500).json({ success: false, message: 'Erreur lors de la récupération des centres' });
    }
  }

  static async findById(req, res) {
    try {
      const centre = await CentreModel.findById(req.params.id);
      if (!centre) return res.status(404).json({ success: false, message: 'Centre non trouvé' });
      res.json({ success: true, data: centre });
    } catch (error) {
      console.error('Erreur détail centre:', error);
      res.status(500).json({ success: false, message: 'Erreur lors de la récupération du centre' });
    }
  }

  static async create(req, res) {
    try {
      const { nom_centre, type_centre, numero_centre, email_centre, telephone_centre } = req.body || {};
      if (!nom_centre || !numero_centre || !CENTRE_TYPES.includes(type_centre)) {
        return res.status(400).json({
          success: false,
          message: `nom_centre, numero_centre et type_centre sont obligatoires. Types acceptés : ${CENTRE_TYPES.join(', ')}.`,
        });
      }
      const centre = await CentreModel.create({ nom_centre, type_centre, numero_centre, email_centre, telephone_centre });
      res.status(201).json({ success: true, data: centre, message: 'Centre créé avec succès' });
    } catch (error) {
      console.error('Erreur création centre:', error);
      if (error.code === 'P2002') return res.status(409).json({ success: false, message: 'Le numéro du centre existe déjà' });
      res.status(500).json({ success: false, message: 'Erreur lors de la création du centre' });
    }
  }

  static async update(req, res) {
    try {
      const body = req.body || {};
      if (body.type_centre !== undefined && !CENTRE_TYPES.includes(body.type_centre)) {
        return res.status(400).json({ success: false, message: `Type de centre invalide. Types acceptés : ${CENTRE_TYPES.join(', ')}.` });
      }
      const centre = await CentreModel.update(req.params.id, body);
      if (!centre) return res.status(404).json({ success: false, message: 'Centre non trouvé' });
      res.json({ success: true, data: centre, message: 'Centre mis à jour avec succès' });
    } catch (error) {
      console.error('Erreur mise à jour centre:', error);
      if (error.code === 'P2002') return res.status(409).json({ success: false, message: 'Le numéro du centre existe déjà' });
      res.status(500).json({ success: false, message: 'Erreur lors de la mise à jour du centre' });
    }
  }

  static async delete(req, res) {
    try {
      const existant = await CentreModel.findById(req.params.id);
      if (!existant) return res.status(404).json({ success: false, message: 'Centre non trouvé' });

      // La clé étrangère `agents.id_centre` est en `ON DELETE SET NULL` : supprimer
      // ce centre effacerait en silence l'affiliation de tous les administrateurs.
      if (existant.nom_centre === CENTRE_ADMINISTRATEURS) {
        return res.status(400).json({
          success: false,
          message: `Le centre ${CENTRE_ADMINISTRATEURS} est l'affiliation des administrateurs : il ne peut pas être supprimé.`,
        });
      }

      const centre = await CentreModel.delete(req.params.id);
      if (!centre) return res.status(404).json({ success: false, message: 'Centre non trouvé' });
      res.json({ success: true, message: 'Centre supprimé avec succès' });
    } catch (error) {
      console.error('Erreur suppression centre:', error);
      res.status(500).json({ success: false, message: 'Erreur lors de la suppression du centre' });
    }
  }
}

module.exports = CentreController;
