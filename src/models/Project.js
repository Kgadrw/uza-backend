const mongoose = require('mongoose');

const projectSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, 'Please provide a project title'],
      trim: true,
      maxlength: [200, 'Title cannot be more than 200 characters'],
    },
    description: {
      type: String,
      required: [true, 'Please provide a project description'],
    },
    beneficiary: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    category: {
      type: String,
      enum: ['Agriculture', 'Livestock', 'Aquaculture', 'Beekeeping', 'Other'],
      required: true,
    },
    location: {
      type: String,
      required: true,
    },
    fundingGoal: {
      type: Number,
      required: true,
      min: [0, 'Funding goal must be positive'],
    },
    totalFunded: {
      type: Number,
      default: 0,
    },
    totalDisbursed: {
      type: Number,
      default: 0,
    },
    status: {
      type: String,
      enum: ['pending', 'active', 'paused', 'completed', 'cancelled'],
      default: 'pending',
    },
    healthScore: {
      type: Number,
      default: 100,
      min: 0,
      max: 100,
    },
    riskLevel: {
      type: String,
      enum: ['low', 'medium', 'high'],
      default: 'low',
    },
    tags: [String],
    priority: {
      type: String,
      enum: ['low', 'medium', 'high'],
      default: 'medium',
    },
    performanceMetrics: {
      onTimeMilestones: { type: Number, default: 0 },
      totalMilestones: { type: Number, default: 0 },
      completionRate: { type: Number, default: 0 },
    },
  },
  {
    timestamps: true,
  }
);

// Indexes
projectSchema.index({ beneficiary: 1, status: 1 });
projectSchema.index({ status: 1 });
projectSchema.index({ category: 1 });
projectSchema.index({ createdAt: -1 });
projectSchema.index({ healthScore: -1 });

module.exports = mongoose.model('Project', projectSchema);

