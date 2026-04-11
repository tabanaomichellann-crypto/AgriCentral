const express = require('express');
const router = express.Router();
const { verifyToken, requireRole } = require('../middleware/auth.middleware');
const c = require('../controllers/conditionLog.controller');

// Get all condition logs (coordinators)
router.get(
  '/',
  verifyToken,
  requireRole('Program Coordinator'),
  c.getAllConditionLogs
);

// Create condition log (AEW)
router.post(
  '/',
  verifyToken,
  requireRole('Agriculture Extension Worker'),
  // upload.single('proof_image'),
  c.createConditionLog
);

// Validate condition log (coordinators)
router.patch(
  '/:logId/validate',
  verifyToken,
  requireRole('Program Coordinator'),
  c.validateConditionLog
);

module.exports = router;