const express = require('express');
const router = express.Router();
const { getUsers, createUser, updateUserStatus, deleteUser } = require('../controllers/user.controller');

router.get('/', getUsers);
router.post('/', createUser);
router.patch('/:id/status', updateUserStatus);
router.delete('/:id', deleteUser);

module.exports = router;