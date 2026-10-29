const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const prisma = require('../config/prisma');
const { authenticate, getJwtSecret } = require('../middlewares/auth.middleware');
const { rateLimit } = require('../middlewares/rate-limit.middleware');
const HistoriqueUtilisateurModel = require('../models/historique-utilisateur.model');
const { AgentModel, CENTRE_ADMINISTRATEURS } = require('../models/agent.model');

const router = express.Router();
const cookieOptions = {
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production',
  sameSite: 'lax',
  maxAge: 8 * 60 * 60 * 1000,
  path: '/',
};

/**
 * Hash d'un mot de passe fictif : comparé quand l'e-mail est inconnu, pour que
 * le temps de réponse ne révèle pas l'existence d'un compte.
 */
const DUMMY_HASH = bcrypt.hashSync('spcf-compte-inexistant', 12);

const readEmail = (req) =>
  typeof req.body?.email === 'string' ? req.body.email.trim().toLowerCase() : '';

const formatMinutes = (seconds) => Math.max(1, Math.round(seconds / 60));

const loginByEmailLimit = rateLimit({
  scope: 'login-email',
  max: 5,
  identity: readEmail,
  message: (seconds) =>
    `Trop de tentatives pour cette adresse. Réessayez dans ${formatMinutes(seconds)} minute(s).`,
});

const loginByIpLimit = rateLimit({
  scope: 'login-ip',
  max: 20,
  message: (seconds) =>
    `Trop de tentatives de connexion depuis cette adresse réseau. Réessayez dans ${formatMinutes(seconds)} minute(s).`,
});

const formByIpLimit = rateLimit({
  scope: 'auth-form-ip',
  max: 10,
  message: (seconds) =>
    `Trop d'envois depuis cette adresse réseau. Réessayez dans ${formatMinutes(seconds)} minute(s).`,
});

const changePasswordLimit = rateLimit({
  scope: 'change-password',
  max: 6,
  identity: (req) => String(req.user?.id ?? ''),
  message: (seconds) =>
    `Trop de tentatives de changement de mot de passe. Réessayez dans ${formatMinutes(seconds)} minute(s).`,
});

/**
 * Annuaire des centres proposé au formulaire d'inscription : la personne n'a pas
 * encore de session, elle ne peut donc pas interroger `/api/centres`. Le centre
 * des administrateurs (`SSIF`) est exclu — il n'accueille pas de demande d'agent.
 */
router.get('/centres', async (req, res, next) => {
  try {
    const centres = await prisma.centres.findMany({
      where: { nom_centre: { not: CENTRE_ADMINISTRATEURS } },
      select: { id_centre: true, nom_centre: true, type_centre: true },
      orderBy: { nom_centre: 'asc' },
    });
    return res.json({ success: true, data: centres });
  } catch (error) {
    return next(error);
  }
});

router.post('/login', loginByEmailLimit, loginByIpLimit, async (req, res, next) => {
  try {
    const email = readEmail(req);
    const password = typeof req.body.password === 'string' ? req.body.password : '';

    if (!email || !password) {
      return res.status(400).json({ success: false, message: 'Email et mot de passe requis' });
    }

    const agent = await prisma.agents.findUnique({
      where: { email },
      include: { centres: { select: { nom_centre: true } } },
    });
    const validPassword = await bcrypt.compare(password, agent?.mot_de_passe ?? DUMMY_HASH);

    if (!agent || !validPassword) {
      return res.status(401).json({ success: false, message: 'Identifiants incorrects' });
    }
    if (agent.statut === 'en_attente') {
      return res.status(403).json({
        success: false,
        code: 'COMPTE_EN_ATTENTE',
        message: 'Votre compte est en attente d\'activation par un administrateur.',
      });
    }
    if (agent.statut && agent.statut !== 'actif') {
      return res.status(403).json({
        success: false,
        code: 'COMPTE_BLOQUE',
        message: 'Ce compte a été bloqué. Contactez un administrateur du site.',
      });
    }

    req.rateLimit.reset();

    const user = {
      id: agent.id_agent,
      email: agent.email,
      nom: agent.nom,
      prenom: agent.prenom,
      role: agent.role || 'agent',
      id_centre: agent.id_centre ?? null,
      nom_centre: agent.centres?.nom_centre ?? null,
    };
    const token = jwt.sign(user, getJwtSecret(), { expiresIn: '8h' });

    res.cookie('fiscal_session', token, cookieOptions);
    return res.json({ success: true, user });
  } catch (error) {
    return next(error);
  }
});

/**
 * Demande de réinitialisation du mot de passe : le projet ne dispose d'aucun
 * service d'envoi d'e-mails, la demande est donc tracée dans le journal
 * d'audit et un administrateur définit lui-même le nouveau mot de passe
 * depuis `PATCH /api/agents/:id/password`.
 *
 * La réponse est volontairement identique que le compte existe ou non.
 */
router.post('/reset-request', formByIpLimit, async (req, res, next) => {
  try {
    const email = readEmail(req);
    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return res.status(400).json({ success: false, message: 'Adresse e-mail invalide' });
    }

    const agent = await prisma.agents.findUnique({ where: { email } });
    if (agent) {
      await HistoriqueUtilisateurModel.enregistrerAction({
        id_agent_auteur: null,
        nom_auteur: 'Écran de connexion',
        id_agent_cible: agent.id_agent,
        cible_nom: `${agent.prenom} ${agent.nom}`.trim(),
        cible_email: agent.email,
        type_action: 'RESET_REQUEST',
        description: 'Demande de réinitialisation du mot de passe depuis l\'écran de connexion.',
      });
    }

    return res.json({
      success: true,
      message: 'Si un compte correspond à cette adresse, la demande a été transmise à un administrateur.',
    });
  } catch (error) {
    return next(error);
  }
});

router.post('/register', formByIpLimit, async (req, res, next) => {
  try {
    const body = req.body || {};
    const nom = typeof body.nom === 'string' ? body.nom.trim() : '';
    const prenom = typeof body.prenom === 'string' ? body.prenom.trim() : '';
    const email = typeof body.email === 'string' ? body.email.trim().toLowerCase() : '';
    const password = typeof body.password === 'string' ? body.password : '';
    const idCentre = Number(body.id_centre);

    if (!nom || !prenom || !email || !password) {
      return res.status(400).json({ success: false, message: 'Tous les champs sont obligatoires' });
    }
    if (nom.length > 100 || prenom.length > 100) {
      return res.status(400).json({ success: false, message: 'Le nom et le prénom doivent contenir au maximum 100 caractères' });
    }
    if (email.length > 255 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return res.status(400).json({ success: false, message: 'Adresse e-mail invalide' });
    }
    if (password.length < 4 || Buffer.byteLength(password, 'utf8') > 72) {
      return res.status(400).json({ success: false, message: 'Le mot de passe doit contenir au moins 4 caractères et au maximum 72 octets' });
    }
    if (!Number.isInteger(idCentre) || idCentre <= 0) {
      return res.status(400).json({ success: false, message: 'Sélectionnez votre centre de rattachement' });
    }

    const centre = await prisma.centres.findUnique({
      where: { id_centre: idCentre },
      select: { id_centre: true, nom_centre: true },
    });
    if (!centre) {
      return res.status(400).json({ success: false, message: 'Le centre de rattachement choisi est inconnu' });
    }
    if (centre.nom_centre === CENTRE_ADMINISTRATEURS) {
      return res.status(400).json({
        success: false,
        message: `Le centre ${CENTRE_ADMINISTRATEURS} est réservé aux administrateurs`,
      });
    }

    const existingAgent = await prisma.agents.findUnique({ where: { email } });
    if (existingAgent) {
      return res.status(409).json({ success: false, message: 'Un compte utilise déjà cette adresse e-mail' });
    }

    const hashedPassword = await bcrypt.hash(password, 12);
    await prisma.agents.create({
      data: {
        nom,
        prenom,
        email,
        mot_de_passe: hashedPassword,
        role: 'agent',
        statut: 'en_attente',
        id_centre: centre.id_centre,
      },
    });

    return res.status(201).json({
      success: true,
      message: 'Votre demande a été enregistrée. Attendez l’activation de votre compte par un administrateur.',
    });
  } catch (error) {
    if (error.code === 'P2002') {
      return res.status(409).json({ success: false, message: 'Un compte utilise déjà cette adresse e-mail' });
    }
    return next(error);
  }
});

/**
 * Changement du mot de passe par l'agent connecté, depuis son profil. Le mot de
 * passe actuel est exigé : une session détournée (cookie volé, poste laissé
 * déverrouillé) ne permet donc pas de reprendre le compte définitivement.
 *
 * Le JWT restant valable jusqu'à son expiration, les sessions déjà ouvertes ne
 * sont pas révoquées : seule la prochaine connexion utilise le nouveau mot de passe.
 */
router.post('/change-password', authenticate, changePasswordLimit, async (req, res, next) => {
  try {
    const body = req.body || {};
    const passwordActuel = typeof body.password_actuel === 'string' ? body.password_actuel : '';
    const passwordNouveau = typeof body.password_nouveau === 'string' ? body.password_nouveau : '';
    const confirmation = typeof body.password_confirmation === 'string' ? body.password_confirmation : '';

    if (!passwordActuel || !passwordNouveau || !confirmation) {
      return res.status(400).json({
        success: false,
        message: 'Le mot de passe actuel, le nouveau mot de passe et sa confirmation sont obligatoires.',
      });
    }
    if (passwordNouveau !== confirmation) {
      return res.status(400).json({ success: false, message: 'Les nouveaux mots de passe ne correspondent pas.' });
    }
    if (passwordNouveau.length < 4 || Buffer.byteLength(passwordNouveau, 'utf8') > 72) {
      return res.status(400).json({
        success: false,
        message: 'Le nouveau mot de passe doit contenir au moins 4 caractères et au maximum 72 octets.',
      });
    }
    if (passwordNouveau === passwordActuel) {
      return res.status(400).json({
        success: false,
        message: 'Le nouveau mot de passe doit être différent de l\'actuel.',
      });
    }

    const agent = await prisma.agents.findUnique({ where: { id_agent: req.user.id } });
    if (!agent) {
      return res.status(401).json({ success: false, message: 'Compte introuvable, reconnectez-vous' });
    }

    const valide = await bcrypt.compare(passwordActuel, agent.mot_de_passe);
    if (!valide) {
      return res.status(400).json({ success: false, message: 'Mot de passe actuel incorrect.' });
    }

    const hashedPassword = await bcrypt.hash(passwordNouveau, 12);
    await AgentModel.updatePassword(agent.id_agent, hashedPassword);
    req.rateLimit.reset();

    await HistoriqueUtilisateurModel.enregistrerAction({
      id_agent_auteur: agent.id_agent,
      nom_auteur: [agent.prenom, agent.nom].filter(Boolean).join(' ') || agent.email,
      id_agent_cible: agent.id_agent,
      cible_nom: `${agent.prenom} ${agent.nom}`.trim(),
      cible_email: agent.email,
      type_action: 'MDP_CHANGEMENT',
      description: 'Mot de passe modifié par l\'agent lui-même depuis son profil.',
    });

    return res.json({
      success: true,
      message: 'Mot de passe modifié. Utilisez-le dès votre prochaine connexion.',
    });
  } catch (error) {
    return next(error);
  }
});

router.get('/me', authenticate, (req, res) => {
  res.json({ success: true, user: req.user });
});

router.post('/logout', (req, res) => {
  res.clearCookie('fiscal_session', { ...cookieOptions, maxAge: undefined });
  res.json({ success: true });
});

module.exports = router;