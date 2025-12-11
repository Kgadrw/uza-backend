const mongoose = require('mongoose');

const kycSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    documents: [{
      type: {
        type: String,
        enum: ['id', 'business_license', 'tax_certificate', 'bank_statement', 'other'],
      },
      url: String,
      uploadedAt: Date,
    }],
    status: {
      type: String,
      enum: ['pending', 'approved', 'rejected'],
      default: 'pending',
    },
    reviewedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
    reviewedAt: {
      type: Date,
    },
    rejectionReason: {
      type: String,
    },
    expiresAt: {
      type: Date,
    },
  },
  {
    timestamps: true,
  }
);

// Indexes
kycSchema.index({ user: 1 });
kycSchema.index({ status: 1 });

module.exports = mongoose.model('KYC', kycSchema);

