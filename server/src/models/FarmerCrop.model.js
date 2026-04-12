const mongoose = require('mongoose');

const farmerCropSchema = new mongoose.Schema({
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
  plantingDate: {
    type: Date,
    default: Date.now
  },
  expectedHarvestDate: {
    type: Date
  },
  areaPlanted: {
    type: Number, // in hectares
  },
  status: {
    type: String,
    enum: ['Planted', 'Growing', 'Harvested', 'Failed'],
    default: 'Planted'
  },
  notes: {
    type: String
  }
}, { timestamps: true });

// Compound index to prevent duplicate farmer-crop combinations
farmerCropSchema.index({ farmerId: 1, cropId: 1 }, { unique: true });

module.exports = mongoose.model('FarmerCrop', farmerCropSchema);
