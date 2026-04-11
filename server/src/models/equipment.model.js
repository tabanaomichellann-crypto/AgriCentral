const mongoose = require('mongoose');

const equipmentSchema = new mongoose.Schema({
  equipment_id: {
    type: String,
    required: true,
    unique: true,
    default: () => require('crypto').randomUUID()
  },
  equipment_name: {
    type: String,
    required: true,
    maxlength: 150
  },
  category: {
    type: String,
    maxlength: 100
  },
  quantity_total: {
    type: Number,
    required: true,
    min: 0
  },
  quantity_available: {
    type: Number,
    required: true,
    min: 0
  },
  quantity_in_use: {
    type: Number,
    default: 0,
    min: 0
  },
  imageId: {
    type: String,
  },
  status: {
    type: String,
    enum: ['Available', 'In_Use', 'Under_Repair', 'Retired'],
    default: 'Available',
    required: true
  }
}, { timestamps: true });

module.exports = mongoose.model('Equipment', equipmentSchema);