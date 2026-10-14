const express = require('express');
const router = express.Router();
const RelanceController = require('../controllers/relance.controller');

// Routes
router.get('/', RelanceController.findAll);
router.get('/stats', RelanceController.getStats);
router.get('/contribuable/:id_contribuable', RelanceController.findByContribuable);
router.get('/:id', RelanceController.findById);
router.post('/', RelanceController.create);
router.put('/:id', RelanceController.update);
router.delete('/:id', RelanceController.delete);

module.exports = router;
