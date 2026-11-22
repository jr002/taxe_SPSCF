const PrevisionModel = require('../models/prevision.model');

const anneeCourante = () => new Date().getFullYear();
const fenetreAnnees = () => {
  const courante = anneeCourante();
  return [courante - 4, courante - 3, courante - 2, courante - 1, courante];
};

const sansCentre = (res) =>
  res.status(403).json({
    success: false,
    message: 'Votre compte chef de centre n’est rattaché à aucun centre : les prévisions de recette restent indisponibles.',
  });

const conflitDAnnee = (annee) => ({
  success: false,
  message: `Une prévision de recette existe déjà pour ce centre en ${annee} : une seule par année civile.`,
});

const horsCentre = (res) =>
  res.status(404).json({ success: false, message: 'Prévision introuvable dans votre centre.' });

/**
 * CRUD des prévisions de recette, strictement borné au centre du chef connecté :
 * le centre et l'auteur viennent de la session, jamais du corps de la requête.
 */
class PrevisionController {
  static async findAll(req, res) {
    try {
      if (!req.user.id_centre) return sansCentre(res);
      const annees = fenetreAnnees();
      const [previsions, recettes] = await Promise.all([
        PrevisionModel.listeParCentre(req.user.id_centre),
        PrevisionModel.recettesAnnuelles(req.user.id_centre, annees),
      ]);
      res.json({
        success: true,
        data: {
          previsions,
          recettes,
          annees,
          annee_courante: anneeCourante(),
          mois_ecoules: new Date().getMonth() + 1,
          centre: { id_centre: req.user.id_centre, nom_centre: req.user.nom_centre },
        },
      });
    } catch (error) {
      console.error('Erreur liste prévisions:', error);
      res.status(500).json({ success: false, message: 'Erreur lors de la récupération des prévisions de recette' });
    }
  }

  static async create(req, res) {
    try {
      if (!req.user.id_centre) return sansCentre(res);
      const annee = parseInt(req.body.annee, 10);
      const conflit = await PrevisionModel.trouveParCentreEtAnnee(req.user.id_centre, annee);
      if (conflit) return res.status(409).json(conflitDAnnee(annee));

      const prevision = await PrevisionModel.creer({
        id_centre: req.user.id_centre,
        id_agent: req.user.id,
        annee,
        montant_prevu: Number(req.body.montant_prevu),
        observation: req.body.observation || null,
      });
      res.status(201).json({ success: true, data: prevision, message: `Prévision de recette ${annee} enregistrée.` });
    } catch (error) {
      console.error('Erreur création prévision:', error);
      res.status(500).json({ success: false, message: 'Erreur lors de l’enregistrement de la prévision de recette' });
    }
  }

  static async update(req, res) {
    try {
      if (!req.user.id_centre) return sansCentre(res);
      const existante = await PrevisionModel.trouve(parseInt(req.params.id, 10));
      if (!existante || existante.id_centre !== req.user.id_centre) return horsCentre(res);

      const donnees = {};
      if (req.body.annee !== undefined) {
        const annee = parseInt(req.body.annee, 10);
        if (annee !== existante.annee) {
          const conflit = await PrevisionModel.trouveParCentreEtAnnee(req.user.id_centre, annee);
          if (conflit) return res.status(409).json(conflitDAnnee(annee));
        }
        donnees.annee = annee;
      }
      if (req.body.montant_prevu !== undefined) donnees.montant_prevu = Number(req.body.montant_prevu);
      if (req.body.observation !== undefined) donnees.observation = req.body.observation || null;

      const prevision = await PrevisionModel.modifier(existante.id_prevision, donnees);
      res.json({ success: true, data: prevision, message: `Prévision de recette ${prevision.annee} mise à jour.` });
    } catch (error) {
      console.error('Erreur modification prévision:', error);
      res.status(500).json({ success: false, message: 'Erreur lors de la modification de la prévision de recette' });
    }
  }

  static async delete(req, res) {
    try {
      if (!req.user.id_centre) return sansCentre(res);
      const existante = await PrevisionModel.trouve(parseInt(req.params.id, 10));
      if (!existante || existante.id_centre !== req.user.id_centre) return horsCentre(res);
      await PrevisionModel.supprimer(existante.id_prevision);
      res.json({ success: true, message: `Prévision de recette ${existante.annee} supprimée.` });
    } catch (error) {
      console.error('Erreur suppression prévision:', error);
      res.status(500).json({ success: false, message: 'Erreur lors de la suppression de la prévision de recette' });
    }
  }
}

module.exports = PrevisionController;