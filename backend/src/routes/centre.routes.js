const express = require('express');
const CentreController = require('../controllers/centre.controller');
const { requireAdmin } = require('../middlewares/auth.middleware');
const { requireCentreAccess } = require('../middlewares/data-scope.middleware');

const router = express.Router();

// Les centres se consultent selon le périmètre de l'agent mais ne se
// manipulent que depuis le back-office administrateur.
router.get('/', CentreController.findAll);
router.get('/:id', requireCentreAccess('id'), CentreController.findById);
router.post('/', requireAdmin, CentreController.create);
router.put('/:id', requireAdmin, CentreController.update);
router.delete('/:id', requireAdmin, CentreController.delete);

module.exports = router;
