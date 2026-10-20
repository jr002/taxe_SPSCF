const bcrypt = require('bcryptjs');
const { AgentModel, AGENT_STATUTS, AGENT_ROLES } = require('../models/agent.model');
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

  // Changer le rôle (agent / admin)
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

      const updated = await AgentModel.updateRole(id, role);

      const auteur = getAuteur(req);
      await HistoriqueUtilisateurModel.enregistrerAction({
        id_agent_auteur: auteur.id,
        nom_auteur: auteur.nom,
        id_agent_cible: agent.id_agent,
        cible_nom: `${agent.prenom} ${agent.nom}`.trim(),
        cible_email: agent.email,
        type_action: 'ROLE_CHANGE',
        description: `Modification du rôle de ${agent.email} : ${agent.role} ➔ ${role}`,
        anciennes_valeurs: { role: agent.role },
        nouvelles_valeurs: { role },
      });

      return res.json({
        success: true,
        data: updated,
        message: `Rôle mis à jour : ${role}.`,
      });
    } catch (error) {
      console.error('Erreur changement de rôle:', error);
      return res.status(500).json({
        success: false,
        message: 'Erreur lors de la mise à jour du rôle',
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
