const express = require('express');
const router = express.Router();
const ControleController = require('../controllers/controle.controller');

router.get('/stats', ControleController.getStats);
router.post('/:id_declaration/effectuer', ControleController.effectuerControle);
router.get('/:id_declaration/historique', ControleController.getControles);

module.exports = router;