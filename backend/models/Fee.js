const mongoose = require('mongoose');

const feeSchema = new mongoose.Schema(
  {
    student: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Student',
      required: true,
    },
    amount: {
      type: Number,
      required: true,
      min: 0,
    },
    type: {
      type: String,
      enum: ['tuition', 'transport', 'misc', 'combined'],
      required: true,
    },
    paidAmount: {
      type: Number,
      default: 0,
      min: 0,
    },
    dueDate: {
      type: Date,
      required: true,
    },
    status: {
      type: String,
      enum: ['pending', 'paid', 'partial'],
      default: 'pending',
    },
    receiptNumber: {
      type: String,
      unique: true,
      sparse: true,
    },
    paymentDate: {
      type: Date,
    },
    paymentMethod: {
      type: String,
      enum: ['cash', 'card', 'upi', 'bank_transfer', ''],
      default: '',
    },
    remarks: {
      type: String,
      trim: true,
    },
    academicYear: {
      type: String,
      required: true,
    },
    month: {
      type: String,
      required: true,
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
  },
  { timestamps: true }
);

feeSchema.pre('save', function (next) {
  if (this.paidAmount >= this.amount) {
    this.status = 'paid';
    this.paidAmount = this.amount;
  } else if (this.paidAmount > 0) {
    this.status = 'partial';
  } else {
    this.status = 'pending';
  }
  next();
});

module.exports = mongoose.model('Fee', feeSchema);
