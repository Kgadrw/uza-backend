const mongoose = require('mongoose');

const reportSchema = new mongoose.Schema(
  {
    beneficiary: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    project: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Project',
      required: true,
    },
    title: {
      type: String,
      required: true,
    },
    startDate: {
      type: Date,
    },
    endDate: {
      type: Date,
    },
    executiveSummary: {
      type: String,
    },
    keyAchievements: {
      type: String,
    },
    financialSummary: {
      totalSpent: Number,
      remainingBudget: Number,
    },
    impactMetrics: {
      type: String,
    },
    challenges: {
      type: String,
    },
    nextSteps: {
      type: String,
    },
    media: [{
      url: String,
      type: {
        type: String,
        enum: ['image', 'video'],
      },
      fileName: String,
    }],
    status: {
      type: String,
      enum: ['draft', 'submitted', 'published'],
      default: 'draft',
    },
  },
  {
    timestamps: true,
  }
);

// Indexes
reportSchema.index({ beneficiary: 1, project: 1 });
reportSchema.index({ status: 1 });
reportSchema.index({ createdAt: -1 });

module.exports = mongoose.model('Report', reportSchema);

