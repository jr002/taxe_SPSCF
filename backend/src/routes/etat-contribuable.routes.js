const express = require('express');
const router = express.Router();
const EtatContribuableController = require('../controllers/etat-contribuable.controller');
const { validate, etatContribuableValidators } = require('../middlewares/validation.middleware');

// Routes
router.get('/', EtatContribuableController.findAll);
router.get('/stats', EtatContribuableController.getStats);
router.get('/contribuable/:id_contribuable', EtatContribuableController.findByContribuable);
router.get('/contribuable/:id_contribuable/latest', EtatContribuableController.findLatestByContribuable);
router.get('/:id', EtatContribuableController.findById);
router.post('/', validate(etatContribuableValidators), EtatContribuableController.create);
router.post('/contribuable/:id_contribuable', validate(etatContribuableValidators), EtatContribuableController.create);
router.put('/:id', validate(etatContribuableValidators), EtatContribuableController.update);
router.delete('/:id', EtatContribuableController.delete);

module.exports = router;
