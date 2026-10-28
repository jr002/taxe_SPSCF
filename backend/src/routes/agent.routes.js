const express = require('express');
const AgentController = require('../controllers/agent.controller');
const { requireAdmin } = require('../middlewares/auth.middleware');

const router = express.Router();

// Gestion des comptes agents : réservée aux administrateurs.
// `authenticate` est déjà appliqué par `app.use('/api', authenticate)`.
router.use(requireAdmin);

router.get('/', AgentController.findAll);
router.get('/historique', AgentController.getHistorique);
router.patch('/:id/statut', AgentController.updateStatut);
router.patch('/:id/role', AgentController.updateRole);
router.patch('/:id/centre', AgentController.updateCentre);
router.patch('/:id/identite', AgentController.updateIdentite);
router.patch('/:id/password', AgentController.resetPassword);
router.delete('/:id', AgentController.remove);

module.exports = router;
