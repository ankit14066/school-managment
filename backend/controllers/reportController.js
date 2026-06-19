const Student = require('../models/Student');
const Result = require('../models/Result');
const Attendance = require('../models/Attendance');
const Fee = require('../models/Fee');
const { calculateGrade } = require('../utils/gradeCalculator');
const { generateMarksheetPdf, generateAttendancePdf, generateFeeReceiptPdf } = require('../utils/pdfGenerator');

const getMarksheet = async (req, res, next) => {
  try {
    const student = await Student.findById(req.params.studentId)
      .populate('user', 'name')
      .populate('class', 'name section academicYear');

    if (!student) return res.status(404).json({ success: false, message: 'Student not found' });

    const results = await Result.find({ student: student._id })
      .populate({ path: 'exam', populate: 'subject' });

    const reportData = results.map((r) => ({
      subject: r.exam?.subject?.name || 'N/A',
      exam: r.exam?.name || 'N/A',
      marksObtained: r.marksObtained,
      maxMarks: r.exam?.maxMarks || 0,
      grade: r.grade,
    }));

    const totalMarks = results.reduce((s, r) => s + r.marksObtained, 0);
    const maxMarks = results.reduce((s, r) => s + (r.exam?.maxMarks || 0), 0);
    const percentage = maxMarks > 0 ? Math.round((totalMarks / maxMarks) * 100) : 0;

    generateMarksheetPdf(res, {
      name: student.user.name,
      rollNumber: student.rollNumber,
      className: `Class ${student.class.name}-${student.class.section}`,
      academicYear: student.class.academicYear,
      results: reportData,
      totalMarks,
      maxMarks,
      percentage,
      overallGrade: calculateGrade(percentage),
    });
  } catch (error) {
    next(error);
  }
};

const getAttendanceReport = async (req, res, next) => {
  try {
    const { month, year } = req.query;
    const student = await Student.findById(req.params.studentId)
      .populate('user', 'name')
      .populate('class', 'name section');

    if (!student) return res.status(404).json({ success: false, message: 'Student not found' });

    const startDate = new Date(year || new Date().getFullYear(), (month || new Date().getMonth() + 1) - 1, 1);
    const endDate = new Date(startDate);
    endDate.setMonth(endDate.getMonth() + 1);

    const records = await Attendance.find({
      student: student._id,
      date: { $gte: startDate, $lt: endDate },
    }).sort({ date: 1 });

    const total = records.length;
    const present = records.filter((r) => r.status === 'present').length;
    const absent = records.filter((r) => r.status === 'absent').length;
    const late = records.filter((r) => r.status === 'late').length;

    generateAttendancePdf(res, {
      name: student.user.name,
      rollNumber: student.rollNumber,
      className: `Class ${student.class.name}-${student.class.section}`,
      month: startDate.toLocaleString('default', { month: 'long', year: 'numeric' }),
      total, present, absent, late,
      percentage: total > 0 ? Math.round(((present + late) / total) * 100) : 0,
      records,
    });
  } catch (error) {
    next(error);
  }
};

const getFeeReceiptPdf = async (req, res, next) => {
  try {
    const fee = await Fee.findById(req.params.feeId)
      .populate({ path: 'student', populate: [{ path: 'user', select: 'name' }, { path: 'class', select: 'name section' }] });

    if (!fee) return res.status(404).json({ success: false, message: 'Fee not found' });

    generateFeeReceiptPdf(res, {
      receiptNumber: fee.receiptNumber,
      studentName: fee.student?.user?.name,
      class: fee.student?.class ? `Class ${fee.student.class.name}-${fee.student.class.section}` : '',
      amount: fee.amount,
      paidAmount: fee.paidAmount,
      dueAmount: fee.amount - fee.paidAmount,
      type: fee.type,
      month: fee.month,
      academicYear: fee.academicYear,
      paymentDate: fee.paymentDate,
      paymentMethod: fee.paymentMethod,
      status: fee.status,
    });
  } catch (error) {
    next(error);
  }
};

module.exports = { getMarksheet, getAttendanceReport, getFeeReceiptPdf };
