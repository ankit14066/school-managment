const mongoose = require('mongoose');

const noticeSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
      trim: true,
    },
    body: {
      type: String,
      required: true,
    },
    targetAudience: {
      type: String,
      enum: ['all', 'class', 'teachers', 'parents', 'students'],
      default: 'all',
    },
    targetClass: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Class',
    },
    postedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    expiryDate: {
      type: Date,
    },
    attachments: [{
      type: String,
    }],
    readBy: [{
      user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
      readAt: { type: Date, default: Date.now },
    }],
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Notice', noticeSchema);
