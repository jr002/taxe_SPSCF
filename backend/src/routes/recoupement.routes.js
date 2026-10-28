const express = require('express');
const router = express.Router();
const RecoupementController = require('../controllers/recoupement.controller');
const { validate, recoupementValidators } = require('../middlewares/validation.middleware');
const {
  requireContribuableAccess,
  requireRowContribuableAccess,
} = require('../middlewares/data-scope.middleware');

const recoupementInScope = requireRowContribuableAccess({
  delegate: 'recoupements',
  primaryKey: 'id_recoupement',
});

// Routes
router.get('/', RecoupementController.findAll);
router.get('/stats/sources', RecoupementController.getSourceStats);
router.get('/contribuable/:id_contribuable/analyser', requireContribuableAccess('id_contribuable'), RecoupementController.analyser);
router.get('/:id_contribuable/analyser', requireContribuableAccess('id_contribuable'), RecoupementController.analyser);
router.get('/:id', recoupementInScope, RecoupementController.findById);
router.post('/', requireContribuableAccess('id_contribuable', { source: 'body' }), validate(recoupementValidators), RecoupementController.create);
router.put('/:id', recoupementInScope, validate(recoupementValidators), RecoupementController.update);
router.delete('/:id', recoupementInScope, RecoupementController.delete);

module.exports = router;