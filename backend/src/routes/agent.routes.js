const express = require('express');
const AgentController = require('../controllers/agent.controller');
const { authorize, requireAdmin } = require('../middlewares/auth.middleware');

const router = express.Router();

// `authenticate` est déjà appliqué par `app.use('/api', authenticate)`.
//
// Deux routes sont ouvertes au chef de centre, uniquement sur les comptes de son
// centre (contrôle appliqué par `AgentController`) : la liste et le blocage /
// activation d'un statut. Le reste de la gestion des comptes — rôle, centre de
// rattachement, identité, mot de passe, suppression et journal d'audit — reste
// réservé aux administrateurs.
const manageOwnCentreAccounts = authorize('admin', 'chef_centre');

router.get('/', manageOwnCentreAccounts, AgentController.findAll);
router.patch('/:id/statut', manageOwnCentreAccounts, AgentController.updateStatut);

router.get('/historique', requireAdmin, AgentController.getHistorique);
router.patch('/:id/role', requireAdmin, AgentController.updateRole);
router.patch('/:id/centre', requireAdmin, AgentController.updateCentre);
router.patch('/:id/identite', requireAdmin, AgentController.updateIdentite);
router.patch('/:id/password', requireAdmin, AgentController.resetPassword);
router.delete('/:id', requireAdmin, AgentController.remove);

module.exports = router;
