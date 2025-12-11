const mongoose = require('mongoose');

const milestoneSchema = new mongoose.Schema(
  {
    project: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Project',
      required: true,
    },
    title: {
      type: String,
      required: true,
    },
    description: {
      type: String,
    },
    targetDate: {
      type: Date,
      required: true,
    },
    completedDate: {
      type: Date,
    },
    status: {
      type: String,
      enum: ['not_started', 'in_progress', 'evidence_submitted', 'approved', 'rejected'],
      default: 'not_started',
    },
    trancheAmount: {
      type: Number,
      required: true,
      min: [0, 'Tranche amount must be positive'],
    },
    evidence: [{
      type: {
        type: String,
        enum: ['image', 'document', 'video'],
      },
      url: String,
      uploadedAt: Date,
    }],
    number: {
      type: Number,
      required: true,
    },
    rejectionReason: {
      type: String,
    },
  },
  {
    timestamps: true,
  }
);

// Indexes
milestoneSchema.index({ project: 1, status: 1 });
milestoneSchema.index({ status: 1 });
milestoneSchema.index({ targetDate: 1 });

module.exports = mongoose.model('Milestone', milestoneSchema);

