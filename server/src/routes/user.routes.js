const express = require('express');
const router = express.Router();
const { verifyToken, requireRole } = require('../middleware/auth.middleware');
const { getUsers, createUser, updateUser, updateUserStatus, resetUserPassword, deleteUser, getUserStats } = require('../controllers/user.controller');

// All user management routes require authentication and admin role
const adminOnly = requireRole('Admin');

router.use(verifyToken, adminOnly);

router.get('/', getUsers);
router.get('/stats', getUserStats);
router.post('/', createUser);
router.put('/:id', updateUser);
router.patch('/:id/status', updateUserStatus);
router.patch('/:id/reset-password', resetUserPassword);
router.delete('/:id', deleteUser);

module.exports = router;