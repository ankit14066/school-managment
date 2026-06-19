const mongoose = require('mongoose');

const feeStructureSchema = new mongoose.Schema(
  {
    class: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Class',
      required: true,
      unique: true,
    },
    tuition: {
      type: Number,
      required: true,
      min: 0,
    },
    transport: {
      type: Number,
      default: 0,
      min: 0,
    },
    misc: {
      type: Number,
      default: 0,
      min: 0,
    },
    academicYear: {
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

feeStructureSchema.virtual('totalAmount').get(function () {
  return this.tuition + this.transport + this.misc;
});

module.exports = mongoose.model('FeeStructure', feeStructureSchema);
