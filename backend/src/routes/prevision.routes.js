const express = require('express');
const router = express.Router();
const PrevisionController = require('../controllers/prevision.controller');
const { authorize } = require('../middlewares/auth.middleware');
const { validate, previsionValidators, previsionUpdateValidators } = require('../middlewares/validation.middleware');

// Les prévisions de recette n'existent que pour le chef de centre : aucun autre
// rôle n'y lit ni n'y écrit quoi que ce soit.
router.use(authorize('chef_centre'));

router.get('/', PrevisionController.findAll);
router.post('/', validate(previsionValidators), PrevisionController.create);
router.put('/:id', validate(previsionUpdateValidators), PrevisionController.update);
router.delete('/:id', PrevisionController.delete);

module.exports = router;