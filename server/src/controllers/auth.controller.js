const User = require('../models/User.model');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

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
