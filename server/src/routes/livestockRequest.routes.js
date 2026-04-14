const express = require('express');
const router = express.Router();
const livestockRequestController = require('../controllers/livestockRequest.controller');
const { verifyToken } = require('../middleware/auth.middleware');

router.get('/livestock-requests', verifyToken, livestockRequestController.getAllRequests);
router.get('/livestock-requests/my', verifyToken, livestockRequestController.getMyRequests);
router.post('/livestock-requests', verifyToken, livestockRequestController.createRequest);
router.patch('/livestock-requests/:requestId/governor-decision', verifyToken, livestockRequestController.governorDecision);
router.patch('/livestock-requests/:requestId/head-decision', verifyToken, livestockRequestController.headDecision);

module.exports = router;
