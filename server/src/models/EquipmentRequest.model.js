const mongoose = require('mongoose');

const equipmentRequestSchema = new mongoose.Schema(
  {
    equipment_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Equipment',
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
    return_date: Date,
    createdAt: {
      type: Date,
      default: Date.now,
    },
  },
  { timestamps: true }
);

// Populate equipment on queries
equipmentRequestSchema.pre(/^find/, function () {
  this.populate('equipment_id').populate('farmer_id', 'fullName email').populate('association_id', 'name');
});

module.exports = mongoose.model('EquipmentRequest', equipmentRequestSchema);
