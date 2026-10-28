const jwt = require('jsonwebtoken');
const { AgentModel } = require('../models/agent.model');
const { resolveScope } = require('../utils/data-scope');

const getJwtSecret = () => {
  if (process.env.JWT_SECRET) return process.env.JWT_SECRET;
  if (process.env.NODE_ENV === 'production') {
    throw new Error('JWT_SECRET doit être défini en production');
  }
  return 'development-only-change-this-secret';
};

/**
 * Vérifie le cookie de session puis relit le compte en base : un agent bloqué
 * (`statut` différent de `actif`) ou supprimé perd immédiatement l'accès, même
 * si son JWT de 8 h est encore valide. Le rôle est également relu, donc un
 * changement de rôle est effectif sans reconnexion.
 */
const authenticate = async (req, res, next) => {
  const token = req.cookies?.fiscal_session;
  if (!token) {
    return res.status(401).json({ success: false, message: 'Authentification requise' });
  }

  let payload;
  try {
    payload = jwt.verify(token, getJwtSecret());
  } catch {
    return res.status(401).json({ success: false, message: 'Session invalide ou expirée' });
  }

  try {
    const agent = await AgentModel.findById(payload.id);

    if (!agent) {
      return res.status(401).json({ success: false, message: 'Compte introuvable, reconnectez-vous' });
    }
    if (agent.statut && agent.statut !== 'actif') {
      return res.status(401).json({ success: false, message: 'Votre compte n\'est plus actif, reconnectez-vous' });
    }

    req.user = {
      id: agent.id_agent,
      email: agent.email,
      nom: agent.nom,
      prenom: agent.prenom,
      role: agent.role || 'agent',
      id_centre: agent.id_centre ?? null,
      nom_centre: agent.nom_centre ?? null,
    };
    req.dataScope = resolveScope(req.user);
    return next();
  } catch (error) {
    return next(error);
  }
};

/**
 * Restreint une route aux agents dont le rôle figure dans `roles`.
 * À utiliser après `authenticate`, qui renseigne `req.user`.
 */
const authorize = (...roles) => (req, res, next) => {
  if (!req.user || !roles.includes(req.user.role)) {
    return res.status(403).json({
      success: false,
      message: 'Accès réservé aux administrateurs',
    });
  }

  return next();
};

const requireAdmin = authorize('admin');

module.exports = { authenticate, authorize, getJwtSecret, requireAdmin };