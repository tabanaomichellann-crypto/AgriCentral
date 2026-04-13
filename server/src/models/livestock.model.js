const mongoose = require('mongoose');

const LivestockSchema = new mongoose.Schema({
  name: { type: String, required: true },
  type: { type: String, required: true },
  quantity_total: { type: Number, required: true, default: 0 },
  quantity_available: { type: Number, required: true, default: 0 },
  status: { type: String, required: true, default: 'Ready_For_Dispersal' },
  notes: { type: String, default: '' },
  imageId: { type: String, default: null },
}, { timestamps: true });

module.exports = mongoose.model('Livestock', LivestockSchema);