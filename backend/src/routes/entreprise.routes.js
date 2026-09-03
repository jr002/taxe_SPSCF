const express = require('express');
const router = express.Router();
const EntrepriseController = require('../controllers/entreprise.controller');
const { validate, entrepriseValidators } = require('../middlewares/validation.middleware');

// Routes protégées
router.get('/', EntrepriseController.findAll);
router.get('/:id', EntrepriseController.findById);

// Routes admin
router.post('/', validate(entrepriseValidators), EntrepriseController.create);
router.put('/:id', EntrepriseController.update);

module.exports = router;