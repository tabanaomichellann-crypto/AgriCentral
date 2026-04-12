const mongoose = require('mongoose');

const cropDamageSchema = new mongoose.Schema({
  farmerId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Farmer',
    required: true
  },
  cropId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Crop',
    required: true
  },
  damageType: {
    type: String,
    enum: ['Pest', 'Disease', 'Weather', 'Nutrient', 'Other'],
    required: true
  },
  severity: {
    type: String,
    enum: ['Low', 'Medium', 'High', 'Critical'],
    required: true
  },
  affectedArea: {
    type: Number, // in hectares
  },
  description: {
    type: String,
    required: true
  },
  reportedDate: {
    type: Date,
    default: Date.now
  },
  status: {
    type: String,
    enum: ['Reported', 'In Progress', 'Resolved', 'Closed'],
    default: 'Reported'
  },
  actionTaken: {
    type: String
  },
  resolvedDate: {
    type: Date
  },
  photos: [
    {
      url: String,
      uploadedAt: { type: Date, default: Date.now }
    }
  ],
  notes: {
    type: String
  }
}, { timestamps: true });

module.exports = mongoose.model('CropDamage', cropDamageSchema);
