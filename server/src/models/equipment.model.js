const mongoose = require('mongoose');

const equipmentSchema = new mongoose.Schema({
  name:          { type: String, required: true },
  equipmentType: { type: String, enum: ['Hand Tractor', 'Grass Cutter', 'Other'], required: true },
  serialNumber:  { type: String },
  condition:     { type: String, enum: ['Available', 'In Use', 'Under Maintenance', 'Retired'], default: 'Available' },
  notes:         { type: String },
}, { timestamps: true });

module.exports = mongoose.model('Equipment', equipmentSchema);