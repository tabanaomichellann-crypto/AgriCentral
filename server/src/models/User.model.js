const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  fullName:     { type: String, required: true },
  username:     { type: String, required: true, unique: true },
  passwordHash: { type: String, required: true },
  email:        { type: String },
  role: {
    type: String,
    enum: [
      'Admin',
      'Program Coordinator',
      'Agriculture Extension Worker',
      'Head of the Office',
      'Farmer Association Representative',
      'Governor Assistant',
    ],
    required: true,
  },
  status: { type: String, enum: ['Active', 'Inactive'], default: 'Active' },
}, { timestamps: true });

module.exports = mongoose.model('User', userSchema);