const express = require('express');
const router = express.Router();
const livestockController = require('../controllers/livestock.controller');

router.get('/', livestockController.getLivestock);
router.get('/:id', livestockController.getLivestockById);
router.post('/', livestockController.createLivestock);
router.put('/:id', livestockController.updateLivestock);
router.delete('/:id', livestockController.deleteLivestock);

module.exports = router;