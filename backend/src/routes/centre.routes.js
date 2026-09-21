const express = require('express');
const CentreController = require('../controllers/centre.controller');

const router = express.Router();

router.get('/', CentreController.findAll);
router.get('/:id', CentreController.findById);
router.post('/', CentreController.create);
router.put('/:id', CentreController.update);
router.delete('/:id', CentreController.delete);

module.exports = router;
