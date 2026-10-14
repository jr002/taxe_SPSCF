const express = require('express');
const router = express.Router();
const ContribuableController = require('../controllers/contribuable.controller');
const EtatContribuableController = require('../controllers/etat-contribuable.controller');
const RapprochementController = require('../controllers/rapprochement.controller');
const RelanceController = require('../controllers/relance.controller');
const {
  validate,
  contribuableValidators,
  centreFiscalRefValidator,
  centreFiscalRefQueryValidator,
  etatContribuableValidators,
} = require('../middlewares/validation.middleware');

// Routes protégées
router.get('/', validate(centreFiscalRefQueryValidator), ContribuableController.findAll);
router.get('/:id', ContribuableController.findById);

// Sous-ressources d'un contribuable
router.get('/:id/etat', EtatContribuableController.findByContribuable);
router.post('/:id/etat', validate(etatContribuableValidators), EtatContribuableController.create);
router.get('/:id/rapprochements', (req, res) => {
  req.query.id_contribuable = req.params.id;
  return RapprochementController.findAll(req, res);
});
router.get('/:id/relances', RelanceController.findByContribuable);

// Routes admin
router.post('/', validate(contribuableValidators), ContribuableController.create);
router.put('/:id', validate(centreFiscalRefValidator), ContribuableController.update);

module.exports = router;