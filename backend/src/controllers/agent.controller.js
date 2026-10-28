const bcrypt = require('bcryptjs');
const { AgentModel, AGENT_STATUTS, AGENT_ROLES } = require('../models/agent.model');
const { CentreModel } = require('../models/centre.model');
const { CENTRE_ROLES, ROLE_LABELS } = require('../utils/data-scope');
const HistoriqueUtilisateurModel = require('../models/historique-utilisateur.model');

const isSelf = (req, id) => String(req.user?.id ?? '') === String(id);

const getAuteur = (req) => ({
  id: req.user?.id || null,
  nom: [req.user?.prenom, req.user?.nom].filter(Boolean).join(' ') || req.user?.email || 'Administrateur',
});

class AgentController {
  // Liste des comptes agents (filtres facultatifs : search, statut, role)
  static async findAll(req, res) {
    try {
      const { search, statut, role } = req.query;
      const agents = await AgentModel.findAll({ search, statut, role });

      res.json({ success: true, data: agents });
    } catch (error) {
      console.error('Erreur liste agents:', error);
      res.status(500).json({
        success: false,
        message: 'Erreur lors de la récupération des utilisateurs',
      });
    }
  }

  // Activer / désactiver un compte
  static async updateStatut(req, res) {
    try {
      const { id } = req.params;
      const { statut } = req.body || {};

      if (!AGENT_STATUTS.includes(statut)) {
        return res.status(400).json({
          success: false,
          message: `Statut invalide. Valeurs acceptées : ${AGENT_STATUTS.join(', ')}.`,
        });
      }

      if (isSelf(req, id)) {
        return res.status(400).json({
          success: false,
          message: 'Vous ne pouvez pas modifier le statut de votre propre compte.',
        });
      }

      const agent = await AgentModel.findById(id);
      if (!agent) {
        return res.status(404).json({ success: false, message: 'Utilisateur non trouvé' });
      }

      if (agent.role === 'admin' && statut !== 'actif') {
        const autres = await AgentModel.countActiveAdmins({ excludeId: id });
        if (autres === 0) {
          return res.status(400).json({
            success: false,
            message: 'Impossible de désactiver le dernier administrateur actif.',
          });
        }
      }

      const updated = await AgentModel.updateStatut(id, statut);

      const auteur = getAuteur(req);
      const typeAction = statut === 'actif' ? 'ACTIVATION' : 'BLOCAGE';
      const description = statut === 'actif'
        ? `Activation du compte (${agent.email})`
        : `Désactivation / blocage du compte (${agent.email})`;

      await HistoriqueUtilisateurModel.enregistrerAction({
        id_agent_auteur: auteur.id,
        nom_auteur: auteur.nom,
        id_agent_cible: agent.id_agent,
        cible_nom: `${agent.prenom} ${agent.nom}`.trim(),
        cible_email: agent.email,
        type_action: typeAction,
        description,
        anciennes_valeurs: { statut: agent.statut },
        nouvelles_valeurs: { statut },
      });

      return res.json({
        success: true,
        data: updated,
        message:
          statut === 'actif'
            ? 'Le compte est activé et peut désormais se connecter.'
            : 'Le compte ne peut plus se connecter.',
      });
    } catch (error) {
      console.error('Erreur changement de statut:', error);
      return res.status(500).json({
        success: false,
        message: "Erreur lors de la mise à jour du statut",
      });
    }
  }

  // Changer le rôle (voir AGENT_ROLES dans `src/models/agent.model.js`)
  static async updateRole(req, res) {
    try {
      const { id } = req.params;
      const { role } = req.body || {};

      if (!AGENT_ROLES.includes(role)) {
        return res.status(400).json({
          success: false,
          message: `Rôle invalide. Valeurs acceptées : ${AGENT_ROLES.join(', ')}.`,
        });
      }

      if (isSelf(req, id)) {
        return res.status(400).json({
          success: false,
          message: 'Vous ne pouvez pas modifier votre propre rôle.',
        });
      }

      const agent = await AgentModel.findById(id);
      if (!agent) {
        return res.status(404).json({ success: false, message: 'Utilisateur non trouvé' });
      }

      if (agent.role === 'admin' && role !== 'admin') {
        const autres = await AgentModel.countActiveAdmins({ excludeId: id });
        if (autres === 0) {
          return res.status(400).json({
            success: false,
            message: 'Impossible de retirer le rôle du dernier administrateur actif.',
          });
        }
      }

      // L'affiliation des administrateurs est automatique : le centre SSIF est
      // informatif (le rôle admin voit déjà tous les centres). Sortir du rôle
      // rend le centre de rattachement inutile, donc le retire ; si le centre
      // SSIF manque en base, l'affectation existante reste intacte.
      let prochainCentre;
      if (role === 'admin') {
        const idCentreAdministrateurs = await AgentModel.findIdCentreAdministrateurs();
        prochainCentre = idCentreAdministrateurs ?? undefined;
      } else if (agent.role === 'admin') {
        prochainCentre = null;
      }

      const updated = await AgentModel.updateRole(id, role, prochainCentre);

      const auteur = getAuteur(req);
      await HistoriqueUtilisateurModel.enregistrerAction({
        id_agent_auteur: auteur.id,
        nom_auteur: auteur.nom,
        id_agent_cible: agent.id_agent,
        cible_nom: `${agent.prenom} ${agent.nom}`.trim(),
        cible_email: agent.email,
        type_action: 'ROLE_CHANGE',
        description: `Modification du rôle de ${agent.email} : ${agent.role} ➔ ${role}`,
        anciennes_valeurs: { role: agent.role, id_centre: agent.id_centre ?? null },
        nouvelles_valeurs: { role, id_centre: updated?.id_centre ?? null },
      });

      return res.json({
        success: true,
        data: updated,
        message: prochainCentre === undefined
          ? `Rôle mis à jour : ${role}.`
          : `Rôle mis à jour : ${role}${updated?.nom_centre ? ` — affilié à ${updated.nom_centre}.` : '.'}`,
      });
    } catch (error) {
      console.error('Erreur changement de rôle:', error);
      return res.status(500).json({
        success: false,
        message: 'Erreur lors de la mise à jour du rôle',
      });
    }
  }

  /**
   * Affectation du centre de rattachement : c'est elle qui détermine le
   * périmètre consulté par un inspecteur, un contrôleur ou un agent fiscal.
   * `null` retire l'affectation : sans centre, un rôle centré ne voit plus
   * aucun dossier fiscal.
   */
  static async updateCentre(req, res) {
    try {
      const { id } = req.params;
      const { id_centre: raw } = req.body || {};

      if (raw === undefined) {
        return res.status(400).json({
          success: false,
          message: "Le champ id_centre est obligatoire (envoyez null pour retirer l'affectation).",
        });
      }

      const id_centre = raw === null || raw === '' ? null : parseInt(raw, 10);
      if (raw !== null && raw !== '' && Number.isNaN(id_centre)) {
        return res.status(400).json({ success: false, message: 'Centre fiscal invalide.' });
      }

      const agent = await AgentModel.findById(id);
      if (!agent) {
        return res.status(404).json({ success: false, message: 'Utilisateur non trouvé' });
      }

      if (id_centre !== null) {
        const centre = await CentreModel.findById(id_centre);
        if (!centre) {
          return res.status(404).json({ success: false, message: 'Centre fiscal non trouvé' });
        }
      }

      const updated = await AgentModel.updateCentre(id, id_centre);

      const auteur = getAuteur(req);
      await HistoriqueUtilisateurModel.enregistrerAction({
        id_agent_auteur: auteur.id,
        nom_auteur: auteur.nom,
        id_agent_cible: agent.id_agent,
        cible_nom: `${agent.prenom} ${agent.nom}`.trim(),
        cible_email: agent.email,
        type_action: 'CENTRE_UPDATE',
        description: id_centre === null
          ? `Retrait du centre de rattachement de ${agent.email} (${agent.nom_centre ?? 'aucun'})`
          : `Affectation de ${agent.email} au centre ${updated.nom_centre ?? id_centre}`,
        anciennes_valeurs: { id_centre: agent.id_centre ?? null, nom_centre: agent.nom_centre ?? null },
        nouvelles_valeurs: { id_centre, nom_centre: updated.nom_centre ?? null },
      });

      const roleLabel = ROLE_LABELS[agent.role] || agent.role;
      const centreLabel = id_centre === null ? 'aucun centre' : (updated.nom_centre ?? `le centre #${id_centre}`);
      return res.json({
        success: true,
        data: updated,
        message: CENTRE_ROLES.includes(agent.role)
          ? `Périmètre mis à jour : ${roleLabel} sur ${centreLabel}.`
          : `Centre enregistré (${centreLabel}) : le rôle ${roleLabel} n'est pas restreint à un centre.`,
      });
    } catch (error) {
      console.error('Erreur affectation centre:', error);
      return res.status(500).json({
        success: false,
        message: 'Erreur lors de la mise à jour du centre de rattachement',
      });
    }
  }

  /**
   * Correction de l'identité d'un compte (nom, prénom, e-mail de connexion) :
   * l'administrateur peut rectifier une saisie erronée faite à l'inscription.
   * Les trois champs sont obligatoires, l'e-mail doit rester unique.
   */
  static async updateIdentite(req, res) {
    try {
      const { id } = req.params;
      const body = req.body || {};
      const nom = typeof body.nom === 'string' ? body.nom.trim() : '';
      const prenom = typeof body.prenom === 'string' ? body.prenom.trim() : '';
      const email = typeof body.email === 'string' ? body.email.trim().toLowerCase() : '';

      if (!nom || !prenom || !email) {
        return res.status(400).json({
          success: false,
          message: 'Le nom, le prénom et l\'adresse e-mail sont obligatoires.',
        });
      }
      if (nom.length > 100 || prenom.length > 100) {
        return res.status(400).json({
          success: false,
          message: 'Le nom et le prénom doivent contenir au maximum 100 caractères.',
        });
      }
      if (email.length > 255 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
        return res.status(400).json({ success: false, message: 'Adresse e-mail invalide.' });
      }

      const agent = await AgentModel.findById(id);
      if (!agent) {
        return res.status(404).json({ success: false, message: 'Utilisateur non trouvé' });
      }

      let updated;
      try {
        updated = await AgentModel.updateIdentite(id, { nom, prenom, email });
      } catch (error) {
        if (error.code === 'P2002') {
          return res.status(409).json({
            success: false,
            message: 'Un autre compte utilise déjà cette adresse e-mail.',
          });
        }
        throw error;
      }
      if (!updated) {
        return res.status(404).json({ success: false, message: 'Utilisateur non trouvé' });
      }

      const anciennes = {};
      const nouvelles = {};
      if (agent.nom !== nom) {
        anciennes.nom = agent.nom;
        nouvelles.nom = nom;
      }
      if (agent.prenom !== prenom) {
        anciennes.prenom = agent.prenom;
        nouvelles.prenom = prenom;
      }
      if (agent.email !== email) {
        anciennes.email = agent.email;
        nouvelles.email = email;
      }

      const auteur = getAuteur(req);
      await HistoriqueUtilisateurModel.enregistrerAction({
        id_agent_auteur: auteur.id,
        nom_auteur: auteur.nom,
        id_agent_cible: agent.id_agent,
        cible_nom: `${agent.prenom} ${agent.nom}`.trim(),
        cible_email: agent.email,
        type_action: 'IDENTITE_UPDATE',
        description: `Correction de l'identité de ${agent.email} : ${
          Object.keys(nouvelles).length ? Object.keys(nouvelles).join(', ') : 'aucun changement'
        }`,
        anciennes_valeurs: Object.keys(anciennes).length ? anciennes : null,
        nouvelles_valeurs: Object.keys(nouvelles).length ? nouvelles : null,
      });

      return res.json({
        success: true,
        data: updated,
        message: 'Identité mise à jour.',
      });
    } catch (error) {
      console.error('Erreur mise à jour identité:', error);
      return res.status(500).json({
        success: false,
        message: 'Erreur lors de la mise à jour de l\'identité',
      });
    }
  }

  // Réinitialiser le mot de passe d'un agent
  static async resetPassword(req, res) {
    try {
      const { id } = req.params;
      const { password } = req.body || {};

      if (typeof password !== 'string' || password.length < 4 || Buffer.byteLength(password, 'utf8') > 72) {
        return res.status(400).json({
          success: false,
          message: 'Le mot de passe doit contenir au moins 4 caractères et au maximum 72 octets.',
        });
      }

      const agent = await AgentModel.findById(id);
      if (!agent) {
        return res.status(404).json({ success: false, message: 'Utilisateur non trouvé' });
      }

      const hashedPassword = await bcrypt.hash(password, 12);
      const updated = await AgentModel.updatePassword(id, hashedPassword);

      const auteur = getAuteur(req);
      await HistoriqueUtilisateurModel.enregistrerAction({
        id_agent_auteur: auteur.id,
        nom_auteur: auteur.nom,
        id_agent_cible: agent.id_agent,
        cible_nom: `${agent.prenom} ${agent.nom}`.trim(),
        cible_email: agent.email,
        type_action: 'MDP_RESET',
        description: `Réinitialisation administrative du mot de passe pour ${agent.email}`,
      });

      return res.json({
        success: true,
        data: updated,
        message: 'Mot de passe réinitialisé. Communiquez-le à l’agent concerné.',
      });
    } catch (error) {
      console.error('Erreur réinitialisation mot de passe:', error);
      return res.status(500).json({
        success: false,
        message: 'Erreur lors de la réinitialisation du mot de passe',
      });
    }
  }

  // Supprimer un compte agent
  static async remove(req, res) {
    try {
      const { id } = req.params;

      if (isSelf(req, id)) {
        return res.status(400).json({
          success: false,
          message: 'Vous ne pouvez pas supprimer votre propre compte.',
        });
      }

      const agent = await AgentModel.findById(id);
      if (!agent) {
        return res.status(404).json({ success: false, message: 'Utilisateur non trouvé' });
      }

      if (agent.role === 'admin' && agent.statut === 'actif') {
        const autres = await AgentModel.countActiveAdmins({ excludeId: id });
        if (autres === 0) {
          return res.status(400).json({
            success: false,
            message: 'Impossible de supprimer le dernier administrateur actif.',
          });
        }
      }

      const deleted = await AgentModel.delete(id);

      const auteur = getAuteur(req);
      await HistoriqueUtilisateurModel.enregistrerAction({
        id_agent_auteur: auteur.id,
        nom_auteur: auteur.nom,
        id_agent_cible: agent.id_agent,
        cible_nom: `${agent.prenom} ${agent.nom}`.trim(),
        cible_email: agent.email,
        type_action: 'SUPPRESSION',
        description: `Suppression définitive du compte de ${agent.email}`,
        anciennes_valeurs: {
          id: agent.id_agent,
          email: agent.email,
          role: agent.role,
          statut: agent.statut,
        },
      });

      return res.json({
        success: true,
        data: deleted,
        message: 'Compte supprimé.',
      });
    } catch (error) {
      console.error('Erreur suppression agent:', error);
      return res.status(500).json({
        success: false,
        message: "Erreur lors de la suppression de l'utilisateur",
      });
    }
  }

  // Journal d'historique et d'audit des actions sur les utilisateurs
  static async getHistorique(req, res) {
    try {
      const { search, type_action, limit } = req.query;
      const data = await HistoriqueUtilisateurModel.findAll({ search, type_action, limit });
      return res.json({ success: true, data });
    } catch (error) {
      console.error('Erreur getHistorique:', error);
      return res.status(500).json({
        success: false,
        message: 'Erreur lors de la récupération du journal d’historique',
      });
    }
  }
}

module.exports = AgentController;
