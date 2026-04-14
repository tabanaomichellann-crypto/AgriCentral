const mongoose = require('mongoose');

const LivestockRequestSchema = new mongoose.Schema({
  livestock_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Livestock',
    required: true,
  },
  farmer_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  association_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Association',
  },
  quantity_requested: {
    type: Number,
    required: true,
    min: 1,
  },
  purpose: {
    type: String,
    required: true,
  },
  status: {
    type: String,
    enum: ['Pending', 'Gov_Approved', 'Head_Approved', 'Issued', 'Rejected'],
    default: 'Pending',
  },
  governor_remarks: String,
  head_remarks: String,
  issued_date: Date,
}, { timestamps: true });

LivestockRequestSchema.pre(/^find/, function () {
  this.populate('livestock_id')
      .populate('farmer_id', 'fullName email')
      .populate('association_id', 'name');
});

module.exports = mongoose.model('LivestockRequest', LivestockRequestSchema);
