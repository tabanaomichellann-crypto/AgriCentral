const mongoose = require('mongoose');

const farmerSchema = new mongoose.Schema({
  rsbaNumber:           { type: String, required: true, unique: true },
  firstName:            { type: String, required: true },
  lastName:             { type: String, required: true },
  contactNumber:        { type: String },
  address:              { type: String },
  proofOfOwnershipType: { type: String, enum: ['Ownership', 'Tenancy', 'Agreement'], required: true },
  validIdRef:           { type: String },
}, { timestamps: { createdAt: 'registeredAt' } });

module.exports = mongoose.model('Farmer', farmerSchema);