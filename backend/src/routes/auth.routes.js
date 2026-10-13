const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const prisma = require('../config/prisma');
const { authenticate, getJwtSecret } = require('../middlewares/auth.middleware');

const router = express.Router();
const cookieOptions = {
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production',
  sameSite: 'lax',
  maxAge: 8 * 60 * 60 * 1000,
  path: '/',
};

router.post('/login', async (req, res, next) => {
  try {
    const email = typeof req.body.email === 'string' ? req.body.email.trim().toLowerCase() : '';
    const password = typeof req.body.password === 'string' ? req.body.password : '';

    if (!email || !password) {
      return res.status(400).json({ success: false, message: 'Email et mot de passe requis' });
    }

    const agent = await prisma.agents.findUnique({ where: { email } });
    const validPassword = agent && await bcrypt.compare(password, agent.mot_de_passe);
    if (!validPassword || (agent.statut && agent.statut !== 'actif')) {
      return res.status(401).json({ success: false, message: 'Identifiants incorrects' });
    }

    const user = {
      id: agent.id_agent,
      email: agent.email,
      nom: agent.nom,
      prenom: agent.prenom,
      role: agent.role || 'agent',
    };
    const token = jwt.sign(user, getJwtSecret(), { expiresIn: '8h' });

    res.cookie('fiscal_session', token, cookieOptions);
    return res.json({ success: true, user });
  } catch (error) {
    return next(error);
  }
});

router.post('/register', async (req, res, next) => {
  try {
    const body = req.body || {};
    const nom = typeof body.nom === 'string' ? body.nom.trim() : '';
    const prenom = typeof body.prenom === 'string' ? body.prenom.trim() : '';
    const email = typeof body.email === 'string' ? body.email.trim().toLowerCase() : '';
    const password = typeof body.password === 'string' ? body.password : '';

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

router.get('/me', authenticate, (req, res) => {
  res.json({ success: true, user: req.user });
});

router.post('/logout', (req, res) => {
  res.clearCookie('fiscal_session', { ...cookieOptions, maxAge: undefined });
  res.json({ success: true });
});

module.exports = router;