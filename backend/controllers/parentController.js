const Parent = require('../models/Parent');
const Student = require('../models/Student');
const Attendance = require('../models/Attendance');
const Fee = require('../models/Fee');
const Result = require('../models/Result');
const Homework = require('../models/Homework');
const Notice = require('../models/Notice');

const getLinkedStudent = async (userId) => {
  const parent = await Parent.findOne({ user: userId }).populate({
    path: 'linkedStudent',
    populate: [{ path: 'user', select: 'name email' }, { path: 'class', select: 'name section academicYear' }],
  });
  return parent;
};

// @desc    Get parent's child dashboard data
// @route   GET /api/parents/dashboard
const getParentDashboard = async (req, res, next) => {
  try {
    const parent = await getLinkedStudent(req.user._id);
    if (!parent) {
      return res.status(404).json({ success: false, message: 'Parent profile not found' });
    }

    const student = parent.linkedStudent;
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);

    const [monthAttendance, pendingFees, results, homework, notices] = await Promise.all([
      Attendance.find({ student: student._id, date: { $gte: startOfMonth } }),
      Fee.find({ student: student._id, status: { $in: ['pending', 'partial'] } }),
      Result.find({ student: student._id }).populate({ path: 'exam', populate: 'subject' }).limit(10),
      Homework.find({ class: student.class, isActive: true, dueDate: { $gte: today } })
        .populate('subject', 'name code').sort({ dueDate: 1 }).limit(5),
      Notice.find({
        isActive: true,
        $and: [
          { $or: [{ expiryDate: { $gte: today } }, { expiryDate: null }] },
          { $or: [
            { targetAudience: 'all' },
            { targetAudience: 'parents' },
            { targetAudience: 'class', targetClass: student.class },
          ]},
        ],
      }).sort({ createdAt: -1 }).limit(5),
    ]);

    const monthPresent = monthAttendance.filter((a) => ['present', 'late'].includes(a.status)).length;
    const monthPercentage = monthAttendance.length > 0
      ? Math.round((monthPresent / monthAttendance.length) * 100) : 0;

    res.json({
      success: true,
      data: {
        parent,
        child: student,
        monthAttendancePercentage: monthPercentage,
        attendanceRecords: monthAttendance,
        pendingFees: pendingFees.reduce((s, f) => s + (f.amount - f.paidAmount), 0),
        feeRecords: pendingFees,
        results,
        homework,
        notices,
      },
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get child attendance report
// @route   GET /api/parents/attendance
const getChildAttendance = async (req, res, next) => {
  try {
    const parent = await getLinkedStudent(req.user._id);
    if (!parent) return res.status(404).json({ success: false, message: 'Parent not found' });

    const { month, year } = req.query;
    const startDate = new Date(year || new Date().getFullYear(), (month || new Date().getMonth() + 1) - 1, 1);
    const endDate = new Date(startDate);
    endDate.setMonth(endDate.getMonth() + 1);

    const records = await Attendance.find({
      student: parent.linkedStudent._id,
      date: { $gte: startDate, $lt: endDate },
    }).sort({ date: 1 });

    const total = records.length;
    const present = records.filter((r) => r.status === 'present').length;
    const absent = records.filter((r) => r.status === 'absent').length;
    const late = records.filter((r) => r.status === 'late').length;

    res.json({
      success: true,
      data: {
        month: startDate.toLocaleString('default', { month: 'long', year: 'numeric' }),
        total, present, absent, late,
        percentage: total > 0 ? Math.round(((present + late) / total) * 100) : 0,
        records,
      },
    });
  } catch (error) {
    next(error);
  }
};

module.exports = { getParentDashboard, getChildAttendance, getLinkedStudent };
