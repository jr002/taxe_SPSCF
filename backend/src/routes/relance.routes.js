const express = require('express');
const router = express.Router();
const RelanceController = require('../controllers/relance.controller');
const { validate, relanceValidators, relanceUpdateValidators } = require('../middlewares/validation.middleware');
const {
  requireContribuableAccess,
  requireRowContribuableAccess,
} = require('../middlewares/data-scope.middleware');

const relanceInScope = requireRowContribuableAccess({
  delegate: 'relances',
  primaryKey: 'id_relance',
});

// Routes
router.get('/', RelanceController.findAll);
router.get('/stats', RelanceController.getStats);
router.get('/contribuable/:id_contribuable', requireContribuableAccess('id_contribuable'), RelanceController.findByContribuable);
router.get('/:id', relanceInScope, RelanceController.findById);
router.post('/', requireContribuableAccess('id_contribuable', { source: 'body' }), validate(relanceValidators), RelanceController.create);
router.put('/:id', relanceInScope, validate(relanceUpdateValidators), RelanceController.update);
router.delete('/:id', relanceInScope, RelanceController.delete);

module.exports = router;
