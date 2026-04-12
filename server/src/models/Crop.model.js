const mongoose = require('mongoose');

const cropSchema = new mongoose.Schema({
  name:              { type: String, required: true, unique: true },
  scientificName:    { type: String },
  description:       { type: String },
  growingSeasonDays: { type: Number },
  recommendedPHRange: { type: String }, // e.g., "6.0-7.0"
  waterRequirement:  { type: String }, // e.g., "500-750mm"
  tempRange:         { type: String }, // e.g., "20-30°C"
  image:             { type: String },
}, { timestamps: { createdAt: 'createdAt', updatedAt: 'updatedAt' } });

module.exports = mongoose.model('Crop', cropSchema);
