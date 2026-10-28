const express = require('express');
const router = express.Router();
const DeclarationController = require('../controllers/declaration.controller');
const {
  validate,
  declarationValidators,
  declarationUpdateValidators,
  notificationPrimitiveValidators,
  notificationDefinitiveValidators,
  imputationCreditValidators,
} = require('../middlewares/validation.middleware');
const {
  requireContribuableAccess,
  requireDeclarationAccess,
} = require('../middlewares/data-scope.middleware');

const declarationInScope = requireDeclarationAccess('id');
const targetContribuableInScope = requireContribuableAccess('id_contribuable', { source: 'body' });

router.get('/', DeclarationController.findAll);
router.get('/stats', DeclarationController.getStats);
router.get('/:id', declarationInScope, DeclarationController.findById);
router.post('/', targetContribuableInScope, validate(declarationValidators), DeclarationController.create);
router.put('/:id', declarationInScope, validate(declarationUpdateValidators), DeclarationController.update);

// Procédure contradictoire & Redressements (CGI LFI 2026)
router.post('/:id/notification-primitive', declarationInScope, validate(notificationPrimitiveValidators), DeclarationController.emettreNotificationPrimitive);
router.post('/:id/notification-definitive', declarationInScope, validate(notificationDefinitiveValidators), DeclarationController.emettreNotificationDefinitive);
router.post('/:id/imputer-credit', declarationInScope, validate(imputationCreditValidators), DeclarationController.imputerCreditImpot);

module.exports = router;