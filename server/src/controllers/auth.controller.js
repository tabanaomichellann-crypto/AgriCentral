const User = require('../models/User.model');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const mongoose = require('mongoose');

const FARMER_ASSOCIATION_ROLE = 'Farmer Association Representative';

exports.login = async (req, res) => {
  try {
    const { username, password } = req.body;

    const user = await User.findOne({ username });
    if (!user) return res.status(400).json({ message: 'Invalid username or password.' });

    if (user.status === 'Inactive')
      return res.status(403).json({ message: 'Account is inactive. Contact administrator.' });

    const match = await bcrypt.compare(password, user.passwordHash);
    if (!match) return res.status(400).json({ message: 'Invalid username or password.' });

    const token = jwt.sign(
      { id: user._id, role: user.role.trim() }, // trim role to prevent extra spaces
      process.env.JWT_SECRET,
      { expiresIn: '1d' }
    );

    res.json({
      token,
      role: user.role.trim(), 
      fullName: user.fullName
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: err.message });
  }
};

exports.registerFarmerAssociation = async (req, res) => {
  try {
    if (mongoose.connection.readyState !== 1) {
      return res.status(503).json({
        message: 'Database is not connected. Please try again later.'
      });
    }

    const { fullName, username, password, email } = req.body;

    if (!fullName || !username || !password) {
      return res.status(400).json({
        message: 'Full name, username, and password are required.'
      });
    }

    if (password.length < 6) {
      return res.status(400).json({
        message: 'Password must be at least 6 characters long.'
      });
    }

    const existingUser = await User.findOne({ username: username.trim() });
    if (existingUser) {
      return res.status(400).json({ message: 'Username already exists.' });
    }

    const passwordHash = await bcrypt.hash(password, 10);
    const user = await User.create({
      fullName: fullName.trim(),
      username: username.trim(),
      passwordHash,
      email: email?.trim() || undefined,
      role: FARMER_ASSOCIATION_ROLE,
      status: 'Active'
    });

    const userResponse = user.toObject();
    delete userResponse.passwordHash;

    return res.status(201).json({
      message: 'Farmer association account registered successfully.',
      user: userResponse
    });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: err.message });
  }
};
