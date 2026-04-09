const mongoose = require('mongoose');

const fieldSchema = new mongoose.Schema({
  farmerId:            { type: mongoose.Schema.Types.ObjectId, ref: 'Farmer', required: true },
  areaHectares:        { type: Number, required: true, min: 0.0001 },
  locationDescription: { type: String },
  tenancyType:         { type: String, enum: ['Owned', 'Tenanted', 'Leased'], required: true },
});

module.exports = mongoose.model('FarmerField', fieldSchema);