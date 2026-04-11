const express = require('express');
const router = express.Router();
const equipmentController = require('../controllers/equipment.controller');

// Equipment routes
router.get('/', equipmentController.getEquipment);
router.post('/', equipmentController.createEquipment);
router.put('/:id', equipmentController.updateEquipment);
router.delete('/:id', equipmentController.deleteEquipment);

module.exports = router;