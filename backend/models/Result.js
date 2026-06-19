const mongoose = require('mongoose');
const { calculateGrade } = require('../utils/gradeCalculator');

const resultSchema = new mongoose.Schema(
  {
    student: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Student',
      required: true,
    },
    exam: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Exam',
      required: true,
    },
    marksObtained: {
      type: Number,
      required: true,
      min: 0,
    },
    percentage: {
      type: Number,
    },
    grade: {
      type: String,
      enum: ['A', 'B', 'C', 'D', 'F'],
    },
    remarks: {
      type: String,
      trim: true,
    },
    enteredBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
  },
  { timestamps: true }
);

resultSchema.index({ student: 1, exam: 1 }, { unique: true });

resultSchema.pre('save', async function (next) {
  try {
    const Exam = mongoose.model('Exam');
    const exam = await Exam.findById(this.exam);
    if (exam) {
      this.percentage = Math.round((this.marksObtained / exam.maxMarks) * 100 * 100) / 100;
      this.grade = calculateGrade(this.percentage);
    }
    next();
  } catch (err) {
    next(err);
  }
});

module.exports = mongoose.model('Result', resultSchema);
