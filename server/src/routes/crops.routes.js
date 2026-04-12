const express = require('express');
const router = express.Router();
const { verifyToken, requireRole } = require('../middleware/auth.middleware');
const c = require('../controllers/crop.controller');

const coord = requireRole('Program Coordinator');

// Seed endpoint (no auth required for development)
router.post('/seed-crops', c.seedCrops);

// Protected endpoints
router.get('/crops', verifyToken, c.getCrops);
router.post('/crops', verifyToken, coord, c.createCrop);
router.put('/crops/:id', verifyToken, coord, c.updateCrop);
router.delete('/crops/:id', verifyToken, coord, c.deleteCrop);

module.exports = router;
