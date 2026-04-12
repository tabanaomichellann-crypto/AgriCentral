const express = require('express');
const router = express.Router();
const { verifyToken, requireRole } = require('../middleware/auth.middleware');
const cd = require('../controllers/cropDamage.controller');

const coord = requireRole('Program Coordinator');

// All crop damage endpoints require authentication and coordinator role
router.use(verifyToken, coord);

// Get all crop damage records
router.get('/', cd.getAllCropDamages);

// Get damages by farmer
router.get('/farmer/:farmerId', cd.getDamagesByFarmer);

// Get damages by crop
router.get('/crop/:cropId', cd.getDamagesByCrop);

// Get damages by status
router.get('/status/:status', cd.getDamagesByStatus);

// Get damage statistics
router.get('/stats', cd.getDamageStats);

// Report new crop damage
router.post('/', cd.reportCropDamage);

// Update crop damage record
router.put('/:id', cd.updateCropDamage);

// Delete crop damage record
router.delete('/:id', cd.deleteCropDamage);

module.exports = router;
