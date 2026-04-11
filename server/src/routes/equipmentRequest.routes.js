const express = require('express');
const router = express.Router();
const { verifyToken, requireRole } = require('../middleware/auth.middleware');
const c = require('../controllers/equipmentRequest.controller');

// Get all requests (coordinator, governor, head)
router.get(
  '/',
  verifyToken,
  requireRole('Program Coordinator', 'Governor Assistant', 'Head of the Office'),
  c.getAllRequests
);

// Get my requests (farmers)
router.get(
  '/my',
  verifyToken,
  requireRole('Farmer Association Representative'),
  c.getMyRequests
);

// Create equipment request (farmers/association reps)
router.post(
  '/',
  verifyToken,
  requireRole('Farmer Association Representative'),
  c.createRequest
);

// Get single request details
router.get(
  '/:requestId',
  verifyToken,
  c.getRequest
);

// Governor approves/rejects
router.patch(
  '/:requestId/governor-decision',
  verifyToken,
  requireRole('Governor Assistant'),
  c.governorDecision
);

// Head approves/rejects/issues
router.patch(
  '/:requestId/head-decision',
  verifyToken,
  requireRole('Head of the Office'),
  c.headDecision
);

module.exports = router;
