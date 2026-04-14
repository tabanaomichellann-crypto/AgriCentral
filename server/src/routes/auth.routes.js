const express = require('express');
const router = express.Router();
const { login, registerFarmerAssociation } = require('../controllers/auth.controller');

router.post('/login', login);
router.post('/register-farmer-association', registerFarmerAssociation);

module.exports = router;