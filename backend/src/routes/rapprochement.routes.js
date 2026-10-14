const express = require('express');
const router = express.Router();
const RapprochementController = require('../controllers/rapprochement.controller');
const { validate, rapprochementValidators } = require('../middlewares/validation.middleware');

// Routes
router.get('/', RapprochementController.findAll);
router.get('/stats', RapprochementController.getStats);
router.post('/confronter', RapprochementController.confronter);
router.post('/auto/:id_contribuable', RapprochementController.autoRapprocher);
router.get('/:id', RapprochementController.findById);
router.post('/', validate(rapprochementValidators), RapprochementController.create);
router.patch('/:id/statut', RapprochementController.updateStatut);
router.put('/:id', validate(rapprochementValidators), RapprochementController.update);
router.delete('/:id', RapprochementController.delete);

module.exports = router;
