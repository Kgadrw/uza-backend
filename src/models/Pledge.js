const mongoose = require('mongoose');

const pledgeSchema = new mongoose.Schema(
  {
    donor: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    project: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Project',
      required: true,
    },
    amount: {
      type: Number,
      required: true,
      min: [0, 'Amount must be positive'],
    },
    status: {
      type: String,
      enum: ['pending', 'confirmed', 'cancelled'],
      default: 'pending',
    },
  },
  {
    timestamps: true,
  }
);

// Indexes
pledgeSchema.index({ donor: 1 });
pledgeSchema.index({ project: 1 });
pledgeSchema.index({ donor: 1, project: 1 });

module.exports = mongoose.model('Pledge', pledgeSchema);

