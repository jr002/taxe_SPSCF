const express = require('express');
const router = express.Router();
const RecoupementController = require('../controllers/recoupement.controller');

// Routes protégées
router.post('/', RecoupementController.create);
router.get('/:id_contribuable/analyser', RecoupementController.analyser);
router.get('/stats/sources', RecoupementController.getSourceStats);

module.exports = router;