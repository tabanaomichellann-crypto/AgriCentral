const mongoose = require('mongoose');

const memberSchema = new mongoose.Schema({
  associationId: { type: mongoose.Schema.Types.ObjectId, ref: 'Association', required: true },
  farmerId:      { type: mongoose.Schema.Types.ObjectId, ref: 'Farmer', required: true },
}, { timestamps: { createdAt: 'joinedAt' } });

memberSchema.index({ associationId: 1, farmerId: 1 }, { unique: true });

module.exports = mongoose.model('AssociationMember', memberSchema);