const express = require('express');
const router = express.Router();
const RapprochementController = require('../controllers/rapprochement.controller');
const { validate, rapprochementValidators, rapprochementStatutValidators } = require('../middlewares/validation.middleware');
const {
  requireContribuableAccess,
  requireRapprochementAccess,
  requireRapprochementLinks,
} = require('../middlewares/data-scope.middleware');

const rapprochementInScope = requireRapprochementAccess('id');
const linksInScope = requireRapprochementLinks();

const contribuableEnQuery = requireContribuableAccess('id_contribuable', { source: 'query' });

// Routes
router.get('/', RapprochementController.findAll);
router.get('/stats', contribuableEnQuery, RapprochementController.getStats);
router.get('/export/pdf', contribuableEnQuery, RapprochementController.exportPdf);
router.get('/apercu/:id_contribuable', requireContribuableAccess('id_contribuable'), RapprochementController.getApercu);
router.post('/confronter', linksInScope, RapprochementController.confronter);
router.post('/auto/:id_contribuable', requireContribuableAccess('id_contribuable'), RapprochementController.autoRapprocher);
router.get('/:id', rapprochementInScope, RapprochementController.findById);
router.post('/', linksInScope, validate(rapprochementValidators), RapprochementController.create);
router.patch('/:id/statut', rapprochementInScope, validate(rapprochementStatutValidators), RapprochementController.updateStatut);
router.put('/:id', rapprochementInScope, validate(rapprochementValidators), RapprochementController.update);
router.delete('/:id', rapprochementInScope, RapprochementController.delete);

module.exports = router;
