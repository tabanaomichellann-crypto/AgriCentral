const User = require('../models/User.model');
const bcrypt = require('bcryptjs');

exports.getUsers = async (req, res) => {
  try {
    const users = await User.find().select('-passwordHash');
    res.json(users);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.createUser = async (req, res) => {
  try {
    const { fullName, username, password, role } = req.body;
    const existing = await User.findOne({ username });
    if (existing) return res.status(400).json({ message: 'Username already exists.' });
    const passwordHash = await bcrypt.hash(password, 10);
    const user = await User.create({ fullName, username, passwordHash, role, status: 'Active' });
    res.status(201).json({ message: 'User created successfully.', user });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.updateUserStatus = async (req, res) => {
  try {
    const { status } = req.body;
    await User.findByIdAndUpdate(req.params.id, { status });
    res.json({ message: 'Status updated.' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.deleteUser = async (req, res) => {
  try {
    await User.findByIdAndDelete(req.params.id);
    res.json({ message: 'User deleted.' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};