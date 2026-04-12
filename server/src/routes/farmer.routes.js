const express = require('express');
const router  = express.Router();
const { verifyToken, requireRole } = require('../middleware/auth.middleware');
const c = require('../controllers/farmer.controller');

const coord = requireRole('Program Coordinator');

// Demo seeding (no auth required for development)
router.post  ('/seed-demo',                        c.seedDemo);

router.get   ('/farmers',                          verifyToken, coord, c.getFarmers);
router.post  ('/farmers',                          verifyToken, coord, c.createFarmer);
router.delete('/farmers/:id',                      verifyToken, coord, c.deleteFarmer);

router.get   ('/associations',                     verifyToken, coord, c.getAssociations);
router.post  ('/associations',                     verifyToken, coord, c.createAssociation);
router.delete('/associations/:id',                 verifyToken, coord, c.deleteAssociation);

router.get   ('/associations/:id/members',         verifyToken, coord, c.getMembers);
router.post  ('/associations/:id/members',         verifyToken, coord, c.addMember);
router.delete('/associations/:id/members/:memberId', verifyToken, coord, c.removeMember);

router.get   ('/far-users',                        verifyToken, coord, c.getFARUsers);

module.exports = router;