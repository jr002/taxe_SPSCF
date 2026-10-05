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

router.get('/me', authenticate, (req, res) => {
  res.json({ success: true, user: req.user });
});

router.post('/logout', (req, res) => {
  res.clearCookie('fiscal_session', { ...cookieOptions, maxAge: undefined });
  res.json({ success: true });
});

module.exports = router;