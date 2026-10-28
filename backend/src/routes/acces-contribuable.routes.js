const express = require('express');
const AccesContribuableController = require('../controllers/acces-contribuable.controller');
const { rateLimit } = require('../middlewares/rate-limit.middleware');

const router = express.Router();
const minutes = (seconds) => Math.max(1, Math.ceil(seconds / 60));

const statutLimit = rateLimit({
  scope: 'acces-contribuable-statut',
  max: 60,
  message: (seconds) => `Trop de consultations depuis cette adresse réseau. Réessayez dans ${minutes(seconds)} minute(s).`,
});

/** Compteur par lien et par réseau : il freine la recherche d'un couple NIF/e-mail. */
const ouvertureTokenLimit = rateLimit({
  scope: 'acces-contribuable-ouverture',
  max: 8,
  identity: (req) => String(req.params.token || '').slice(-12),
  message: (seconds) => `Trop de tentatives de vérification pour ce lien. Réessayez dans ${minutes(seconds)} minute(s).`,
});

const ouvertureIpLimit = rateLimit({
  scope: 'acces-contribuable-ip',
  max: 20,
  message: (seconds) => `Trop de tentatives depuis cette adresse réseau. Réessayez dans ${minutes(seconds)} minute(s).`,
});

router.get('/:token', statutLimit, AccesContribuableController.statut);
router.post('/:token/ouvrir', ouvertureTokenLimit, ouvertureIpLimit, AccesContribuableController.ouvrir);

module.exports = router;
