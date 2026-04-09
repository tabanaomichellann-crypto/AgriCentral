const mongoose = require('mongoose');

const associationSchema = new mongoose.Schema({
  associationName: { type: String, required: true, unique: true },
  address:         { type: String },
  presidentUserId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
}, { timestamps: { createdAt: 'registeredAt' } });

module.exports = mongoose.model('Association', associationSchema);