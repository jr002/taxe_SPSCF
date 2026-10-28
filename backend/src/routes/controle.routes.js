const express = require('express');
const router = express.Router();
const ControleController = require('../controllers/controle.controller');
const { requireDeclarationAccess } = require('../middlewares/data-scope.middleware');

const declarationInScope = requireDeclarationAccess('id_declaration');

router.get('/stats', ControleController.getStats);
router.post('/:id_declaration/effectuer', declarationInScope, ControleController.effectuerControle);
router.get('/:id_declaration/historique', declarationInScope, ControleController.getControles);

module.exports = router;