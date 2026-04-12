const express = require('express');
const router = express.Router();
const { verifyToken, requireRole } = require('../middleware/auth.middleware');
const fc = require('../controllers/farmerCrop.controller');

const coord = requireRole('Program Coordinator');

// All farmer-crop endpoints require authentication and coordinator role
router.use(verifyToken, coord);

// Get all farmer-crop relationships
router.get('/', fc.getFarmerCrops);

// Get farmers for a specific crop
router.get('/crop/:cropId', fc.getFarmersByCrop);

// Get crops for a specific farmer
router.get('/farmer/:farmerId', fc.getCropsByFarmer);

// Assign crop to farmer
router.post('/', fc.assignCropToFarmer);

// Update farmer-crop relationship
router.put('/:id', fc.updateFarmerCrop);

// Remove crop from farmer
router.delete('/:id', fc.removeCropFromFarmer);

module.exports = router;
