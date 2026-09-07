const express = require('express');
const router = express.Router();
const ContribuableController = require('../controllers/contribuable.controller');
const { validate, contribuableValidators } = require('../middlewares/validation.middleware');

// Routes protégées
router.get('/', ContribuableController.findAll);
router.get('/:id', ContribuableController.findById);

// Routes admin
router.post('/', validate(contribuableValidators), ContribuableController.create);
router.put('/:id', ContribuableController.update);

module.exports = router;