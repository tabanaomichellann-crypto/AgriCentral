const mongoose = require('mongoose');

const conditionLogSchema = new mongoose.Schema(
  {
    equipment_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Equipment',
      required: true,
    },
    submitted_by: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    condition_status: {
      type: String,
      enum: ['Good', 'Fair', 'Poor', 'Damaged'],
      required: true,
    },
    remarks: {
      type: String,
      required: true,
    },
    proof_image: {
      type: String, // filename/path of uploaded image
    },
    validated: {
      type: Boolean,
      default: false,
    },
    validated_by: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
    validated_at: {
      type: Date,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model('ConditionLog', conditionLogSchema);