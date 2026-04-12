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
    const { fullName, username, password, email, role } = req.body;

    // Validate required fields
    if (!fullName || !username || !password || !role) {
      return res.status(400).json({ message: 'Full name, username, password, and role are required.' });
    }

    const existing = await User.findOne({ username });
    if (existing) return res.status(400).json({ message: 'Username already exists.' });

    const passwordHash = await bcrypt.hash(password, 10);
    const user = await User.create({
      fullName,
      username,
      passwordHash,
      email,
      role,
      status: 'Active'
    });

    const userResponse = user.toObject();
    delete userResponse.passwordHash;

    res.status(201).json({
      message: 'User created successfully.',
      user: userResponse
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.updateUserStatus = async (req, res) => {
  try {
    const { status } = req.body;
    if (!['Active', 'Inactive'].includes(status)) {
      return res.status(400).json({ message: 'Invalid status. Must be Active or Inactive.' });
    }

    const user = await User.findByIdAndUpdate(req.params.id, { status }, { new: true }).select('-passwordHash');
    if (!user) {
      return res.status(404).json({ message: 'User not found.' });
    }

    res.json({
      message: 'User status updated successfully.',
      user
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.deleteUser = async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) {
      return res.status(404).json({ message: 'User not found.' });
    }

    // Prevent deleting the last admin
    if (user.role === 'Admin') {
      const adminCount = await User.countDocuments({ role: 'Admin' });
      if (adminCount <= 1) {
        return res.status(400).json({ message: 'Cannot delete the last admin user.' });
      }
    }

    await User.findByIdAndDelete(req.params.id);
    res.json({ message: 'User deleted successfully.' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.updateUser = async (req, res) => {
  try {
    const { fullName, username, email, role, status } = req.body;
    const userId = req.params.id;

    // Check if username is taken by another user
    if (username) {
      const existing = await User.findOne({ username, _id: { $ne: userId } });
      if (existing) return res.status(400).json({ message: 'Username already exists.' });
    }

    const updateData = {};
    if (fullName) updateData.fullName = fullName;
    if (username) updateData.username = username;
    if (email !== undefined) updateData.email = email;
    if (role) updateData.role = role;
    if (status) updateData.status = status;

    const user = await User.findByIdAndUpdate(userId, updateData, { new: true }).select('-passwordHash');
    if (!user) {
      return res.status(404).json({ message: 'User not found.' });
    }

    res.json({
      message: 'User updated successfully.',
      user
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.resetUserPassword = async (req, res) => {
  try {
    const { newPassword } = req.body;
    if (!newPassword || newPassword.length < 6) {
      return res.status(400).json({ message: 'Password must be at least 6 characters long.' });
    }

    const passwordHash = await bcrypt.hash(newPassword, 10);
    const user = await User.findByIdAndUpdate(req.params.id, { passwordHash }, { new: true }).select('-passwordHash');

    if (!user) {
      return res.status(404).json({ message: 'User not found.' });
    }

    res.json({ message: 'Password reset successfully.' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.getUserStats = async (req, res) => {
  try {
    const totalUsers = await User.countDocuments();
    const activeUsers = await User.countDocuments({ status: 'Active' });
    const inactiveUsers = await User.countDocuments({ status: 'Inactive' });

    const roleStats = await User.aggregate([
      { $group: { _id: '$role', count: { $sum: 1 } } }
    ]);

    res.json({
      total: totalUsers,
      active: activeUsers,
      inactive: inactiveUsers,
      byRole: roleStats
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};