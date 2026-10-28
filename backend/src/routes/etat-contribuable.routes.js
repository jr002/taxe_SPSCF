const express = require('express');
const router = express.Router();
const EtatContribuableController = require('../controllers/etat-contribuable.controller');
const { validate, etatContribuableValidators } = require('../middlewares/validation.middleware');
const {
  requireContribuableAccess,
  requireRowContribuableAccess,
} = require('../middlewares/data-scope.middleware');

const etatInScope = requireRowContribuableAccess({
  delegate: 'etat_contribuable',
  primaryKey: 'id_etat',
});

// Routes
router.get('/', EtatContribuableController.findAll);
router.get('/stats', EtatContribuableController.getStats);
router.get('/contribuable/:id_contribuable', requireContribuableAccess('id_contribuable'), EtatContribuableController.findByContribuable);
router.get('/contribuable/:id_contribuable/latest', requireContribuableAccess('id_contribuable'), EtatContribuableController.findLatestByContribuable);
router.get('/:id', etatInScope, EtatContribuableController.findById);
router.post('/', requireContribuableAccess('id_contribuable', { source: 'body' }), validate(etatContribuableValidators), EtatContribuableController.create);
router.post('/contribuable/:id_contribuable', requireContribuableAccess('id_contribuable'), validate(etatContribuableValidators), EtatContribuableController.create);
router.put('/:id', etatInScope, validate(etatContribuableValidators), EtatContribuableController.update);
router.delete('/:id', etatInScope, EtatContribuableController.delete);

module.exports = router;
