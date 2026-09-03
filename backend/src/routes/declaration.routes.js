const express = require('express');
const router = express.Router();
const DeclarationController = require('../controllers/declaration.controller');
const { validate, declarationValidators } = require('../middlewares/validation.middleware');

router.get('/', DeclarationController.findAll);
router.get('/stats', DeclarationController.getStats);
router.get('/:id', DeclarationController.findById);
router.post('/', validate(declarationValidators), DeclarationController.create);

module.exports = router;