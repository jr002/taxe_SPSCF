const express = require('express');
const router = express.Router();
const ContribuableController = require('../controllers/contribuable.controller');
const EtatContribuableController = require('../controllers/etat-contribuable.controller');
const RapprochementController = require('../controllers/rapprochement.controller');
const RelanceController = require('../controllers/relance.controller');
const AccesContribuableController = require('../controllers/acces-contribuable.controller');
const {
  validate,
  contribuableValidators,
  contribuableUpdateValidators,
  centreFiscalRefQueryValidator,
  etatContribuableValidators,
} = require('../middlewares/validation.middleware');
const { requireContribuableAccess } = require('../middlewares/data-scope.middleware');

/** Le contribuable visé par `/:id` doit appartenir au centre de l'agent. */
const contribuableInScope = requireContribuableAccess('id');

// Routes protégées
router.get('/', validate(centreFiscalRefQueryValidator), ContribuableController.findAll);
router.get('/:id', contribuableInScope, ContribuableController.findById);

// Sous-ressources d'un contribuable
router.get('/:id/etat', contribuableInScope, EtatContribuableController.findByContribuable);
router.post('/:id/etat', contribuableInScope, validate(etatContribuableValidators), EtatContribuableController.create);
router.get('/:id/rapprochements', contribuableInScope, (req, res) => {
  req.query.id_contribuable = req.params.id;
  return RapprochementController.findAll(req, res);
});
router.get('/:id/relances', contribuableInScope, RelanceController.findByContribuable);

// Lien de consultation du contribuable (révoque les liens actifs précédents)
router.post('/:id/acces-contribuable', contribuableInScope, AccesContribuableController.generer);

// Routes admin
router.post('/', validate(contribuableValidators), ContribuableController.create);
router.put('/:id', contribuableInScope, validate(contribuableUpdateValidators), ContribuableController.update);

module.exports = router;