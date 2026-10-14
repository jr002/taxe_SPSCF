const express = require('express');
const router = express.Router();
const RecoupementController = require('../controllers/recoupement.controller');
const { validate, recoupementValidators } = require('../middlewares/validation.middleware');

// Routes
router.get('/', RecoupementController.findAll);
router.get('/stats/sources', RecoupementController.getSourceStats);
router.get('/contribuable/:id_contribuable/analyser', RecoupementController.analyser);
router.get('/:id_contribuable/analyser', RecoupementController.analyser);
router.get('/:id', RecoupementController.findById);
router.post('/', validate(recoupementValidators), RecoupementController.create);
router.put('/:id', validate(recoupementValidators), RecoupementController.update);
router.delete('/:id', RecoupementController.delete);

module.exports = router;