const mongoose = require('mongoose');

const catalogueSchema = new mongoose.Schema({
  title: {
    type: String,
    required: [true, 'Catalogue title is required'],
    trim: true,
  },
  category: {
    type: String,
    required: [true, 'Catalogue category is required'],
    trim: true,
  },
  description: {
    type: String,
    required: [true, 'Catalogue description is required'],
    trim: true,
  },
  image: {
    type: String,
    required: [true, 'Catalogue image is required'],
  },
  file: {
    type: String,
    required: [true, 'Catalogue file is required'],
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null,
  },
  isActive: {
    type: Boolean,
    default: true,
  },
}, {
  timestamps: true,
});

// Index for faster queries
catalogueSchema.index({ category: 1, isActive: 1 });
catalogueSchema.index({ title: 'text', description: 'text' });

module.exports = mongoose.model('Catalogue', catalogueSchema);

