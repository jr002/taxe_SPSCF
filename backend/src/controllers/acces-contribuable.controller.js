const prisma = require('../config/prisma');
const {
  AccesContribuableModel,
  DUREE_MAX_JOURS,
  estActif,
  masquerEmail,
  masquerNom,
  normaliserEmail,
  normaliserNif,
} = require('../models/acces-contribuable.model');
const HistoriqueUtilisateurModel = require('../models/historique-utilisateur.model');

const LIEN_INVALIDE = "Ce lien d'accès est invalide, expiré ou révoqué. Demandez-en un nouveau à votre centre fiscal.";

class AccesContribuableController {
  /**
   * Route agent : le jeton brut n'est renvoyé qu'ici, au moment de l'émission.
   * L'audit ne conserve ni le jeton ni son empreinte.
   */
  static async generer(req, res, next) {
    try {
      const id_contribuable = parseInt(req.params.id, 10);
      if (Number.isNaN(id_contribuable)) {
        return res.status(404).json({ success: false, message: 'Contribuable non trouvé' });
      }

      const dureeBrute = req.body?.duree_jours;
      if (
        dureeBrute !== undefined
        && dureeBrute !== null
        && (!Number.isInteger(Number(dureeBrute)) || Number(dureeBrute) < 1 || Number(dureeBrute) > DUREE_MAX_JOURS)
      ) {
        return res.status(400).json({
          success: false,
          message: `La durée du lien doit être comprise entre 1 et ${DUREE_MAX_JOURS} jours.`,
        });
      }

      const contribuable = await prisma.contribuables.findUnique({
        where: { id_contribuable },
        select: { nif: true, raison_sociale: true, email: true },
      });
      if (!contribuable) {
        return res.status(404).json({ success: false, message: 'Contribuable non trouvé' });
      }
      if (!normaliserEmail(contribuable.email)) {
        return res.status(400).json({
          success: false,
          message: "Renseignez l'adresse e-mail du contribuable avant d'émettre un lien : elle sert à confirmer son identité.",
        });
      }

      const resultat = await AccesContribuableModel.creer({
        id_contribuable,
        id_agent: req.user.id,
        duree_jours: dureeBrute,
      });

      await HistoriqueUtilisateurModel.enregistrerAction({
        id_agent_auteur: req.user.id,
        nom_auteur: [req.user.prenom, req.user.nom].filter(Boolean).join(' ') || req.user.email,
        cible_nom: contribuable.raison_sociale,
        cible_email: contribuable.email,
        type_action: 'ACCES_CONTRIBUABLE',
        description: `Lien de consultation émis pour ${contribuable.raison_sociale} (NIF ${contribuable.nif}), valable ${resultat.duree_jours} jour(s). Les liens actifs précédents ont été révoqués.`,
      });

      return res.status(201).json({
        success: true,
        data: {
          token: resultat.token,
          chemin: `/espace-contribuable/${resultat.token}`,
          date_expiration: resultat.date_expiration,
          duree_jours: resultat.duree_jours,
          email_masque: masquerEmail(contribuable.email),
        },
      });
    } catch (error) {
      return next(error);
    }
  }

  /** Avant vérification : seulement une identité masquée et l'échéance du lien. */
  static async statut(req, res, next) {
    try {
      const acces = await AccesContribuableModel.trouverParToken(req.params.token);
      if (!estActif(acces)) {
        return res.status(404).json({ success: false, message: LIEN_INVALIDE });
      }

      return res.json({
        success: true,
        data: {
          valide: true,
          date_expiration: acces.date_expiration,
          raison_sociale_masquee: masquerNom(acces.contribuables?.raison_sociale),
          centre: acces.contribuables?.centres?.nom_centre || null,
        },
      });
    } catch (error) {
      return next(error);
    }
  }

  /** Le NIF et l'e-mail confirment l'identité ; le jeton reste la clé du dossier. */
  static async ouvrir(req, res, next) {
    try {
      const nif = normaliserNif(req.body?.nif);
      const email = normaliserEmail(req.body?.email);
      if (!nif || !email || nif.length > 100 || email.length > 255) {
        return res.status(400).json({
          success: false,
          message: "Renseignez votre NIF et l'adresse e-mail enregistrée dans votre dossier.",
        });
      }

      const acces = await AccesContribuableModel.trouverParToken(req.params.token);
      if (!estActif(acces)) {
        return res.status(404).json({ success: false, message: LIEN_INVALIDE });
      }

      if (
        normaliserNif(acces.contribuables?.nif) !== nif
        || normaliserEmail(acces.contribuables?.email) !== email
      ) {
        await AccesContribuableModel.enregistrerEchec(acces.id_acces);
        return res.status(403).json({
          success: false,
          message: "Le NIF ou l'adresse e-mail ne correspond pas à ce dossier.",
          tentatives_restantes: req.rateLimit?.remaining ?? null,
        });
      }

      req.rateLimit?.reset?.();
      await AccesContribuableModel.enregistrerAcces(acces.id_acces);
      const dossier = await AccesContribuableModel.construireDossier(acces.id_contribuable);
      if (!dossier) {
        return res.status(404).json({ success: false, message: LIEN_INVALIDE });
      }

      return res.json({ success: true, data: dossier });
    } catch (error) {
      return next(error);
    }
  }
}

module.exports = AccesContribuableController;
