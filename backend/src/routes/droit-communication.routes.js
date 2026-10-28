const express = require('express');
const router = express.Router();
const DroitCommunicationController = require('../controllers/droit-communication.controller');
const { validate, droitCommunicationValidators, droitCommunicationUpdateValidators } = require('../middlewares/validation.middleware');
const {
  requireContribuableAccess,
  requireRowContribuableAccess,
} = require('../middlewares/data-scope.middleware');

const droitInScope = requireRowContribuableAccess({
  delegate: 'droits_communication',
  primaryKey: 'id_droit',
});

// Routes
router.get('/', DroitCommunicationController.findAll);
router.get('/stats/statuts', requireContribuableAccess('id_contribuable', { source: 'query' }), DroitCommunicationController.getStatutStats);
router.get('/:id', droitInScope, DroitCommunicationController.findById);
router.post('/', requireContribuableAccess('id_contribuable', { source: 'body' }), validate(droitCommunicationValidators), DroitCommunicationController.create);
router.put('/:id', droitInScope, validate(droitCommunicationUpdateValidators), DroitCommunicationController.update);
router.delete('/:id', droitInScope, DroitCommunicationController.delete);

module.exports = router;
