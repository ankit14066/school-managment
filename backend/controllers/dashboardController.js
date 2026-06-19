const Student = require('../models/Student');
const Teacher = require('../models/Teacher');
const Class = require('../models/Class');
const Attendance = require('../models/Attendance');
const Fee = require('../models/Fee');
const ActivityLog = require('../models/ActivityLog');

// @desc    Get dashboard stats
// @route   GET /api/dashboard/stats
const getDashboardStats = async (req, res, next) => {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const currentMonth = today.toLocaleString('default', { month: 'long' });
    const currentYear = new Date().getFullYear().toString();

    const [
      totalStudents,
      totalTeachers,
      totalClasses,
      todayAttendance,
      monthlyFees,
      recentActivity,
    ] = await Promise.all([
      Student.countDocuments({ isActive: true }),
      Teacher.countDocuments({ isActive: true }),
      Class.countDocuments({ isActive: true }),
      Attendance.find({ date: { $gte: today, $lt: tomorrow } }),
      Fee.find({ month: currentMonth, academicYear: { $regex: currentYear } }),
      ActivityLog.find()
        .populate('performedBy', 'name role')
        .sort({ createdAt: -1 })
        .limit(10),
    ]);

    const feeCollected = monthlyFees.reduce((sum, f) => sum + f.paidAmount, 0);
    const feeDue = monthlyFees.reduce((sum, f) => sum + f.amount, 0);

    res.json({
      success: true,
      data: {
        totalStudents,
        totalTeachers,
        totalClasses,
        todayAttendance: {
          total: todayAttendance.length,
          present: todayAttendance.filter((a) => a.status === 'present').length,
          absent: todayAttendance.filter((a) => a.status === 'absent').length,
          late: todayAttendance.filter((a) => a.status === 'late').length,
        },
        feeCollection: {
          collected: feeCollected,
          due: feeDue - feeCollected,
          total: feeDue,
        },
        recentActivity,
      },
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Teacher dashboard stats
// @route   GET /api/dashboard/teacher
const getTeacherDashboard = async (req, res, next) => {
  try {
    const Teacher = require('../models/Teacher');
    const Subject = require('../models/Subject');

    const teacher = await Teacher.findOne({ user: req.user._id }).populate('subjects');
    if (!teacher) {
      return res.json({ success: true, data: { subjects: [], classes: [] } });
    }

    const subjects = await Subject.find({ teacher: teacher._id }).populate('class', 'name section');
    const classIds = [...new Set(subjects.map((s) => s.class?._id?.toString()).filter(Boolean))];

    res.json({
      success: true,
      data: {
        teacher,
        subjects,
        classCount: classIds.length,
        subjectCount: subjects.length,
      },
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Student dashboard stats
// @route   GET /api/dashboard/student
const getStudentDashboard = async (req, res, next) => {
  try {
    const student = await Student.findOne({ user: req.user._id })
      .populate('class', 'name section academicYear');

    if (!student) {
      return res.json({ success: true, data: {} });
    }

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);

    const [todayAtt, monthAttendance, pendingFees, results] = await Promise.all([
      Attendance.findOne({ student: student._id, date: { $gte: today } }),
      Attendance.find({ student: student._id, date: { $gte: startOfMonth } }),
      Fee.find({ student: student._id, status: { $in: ['pending', 'partial'] } }),
      require('../models/Result').find({ student: student._id })
        .populate({ path: 'exam', populate: 'subject' })
        .limit(5),
    ]);

    const monthPresent = monthAttendance.filter((a) => a.status === 'present' || a.status === 'late').length;
    const monthPercentage = monthAttendance.length > 0
      ? Math.round((monthPresent / monthAttendance.length) * 100)
      : 0;

    res.json({
      success: true,
      data: {
        student,
        todayAttendance: todayAtt?.status || 'not_marked',
        monthAttendancePercentage: monthPercentage,
        pendingFees: pendingFees.reduce((sum, f) => sum + (f.amount - f.paidAmount), 0),
        recentResults: results,
      },
    });
  } catch (error) {
    next(error);
  }
};

module.exports = { getDashboardStats, getTeacherDashboard, getStudentDashboard };
