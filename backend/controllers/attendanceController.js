const Attendance = require('../models/Attendance');
const Student = require('../models/Student');
const Class = require('../models/Class');
const { getPagination, paginatedResponse } = require('../utils/pagination');
const logActivity = require('../utils/activityLogger');
const { isHoliday } = require('../utils/holidayHelper');

// @desc    Mark attendance (bulk)
// @route   POST /api/attendance
const markAttendance = async (req, res, next) => {
  try {
    const { class: classId, date, records } = req.body;
    const attendanceDate = new Date(date);
    attendanceDate.setHours(0, 0, 0, 0);

    if (await isHoliday(attendanceDate)) {
      return res.status(400).json({ success: false, message: 'Cannot mark attendance on a holiday' });
    }

    const results = [];
    for (const record of records) {
      const attendance = await Attendance.findOneAndUpdate(
        { student: record.student, date: attendanceDate },
        {
          class: classId,
          status: record.status,
          markedBy: req.user._id,
          remarks: record.remarks || '',
        },
        { upsert: true, new: true, runValidators: true }
      );
      results.push(attendance);
    }

    await logActivity('marked', 'Attendance', classId, req.user._id, `Attendance marked for ${records.length} students`);

    res.status(201).json({
      success: true,
      message: `Attendance marked for ${results.length} students`,
      data: results,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get attendance by class and date
// @route   GET /api/attendance
const getAttendance = async (req, res, next) => {
  try {
    const { class: classId, date, student: studentId, startDate, endDate, page, limit } = req.query;
    const { page: pageNum, limit: limitNum, skip } = getPagination(page, limit);
    const query = {};

    if (classId) query.class = classId;
    if (studentId) query.student = studentId;

    if (date) {
      const d = new Date(date);
      d.setHours(0, 0, 0, 0);
      const nextDay = new Date(d);
      nextDay.setDate(nextDay.getDate() + 1);
      query.date = { $gte: d, $lt: nextDay };
    } else if (startDate && endDate) {
      query.date = { $gte: new Date(startDate), $lte: new Date(endDate) };
    }

    const total = await Attendance.countDocuments(query);
    const attendance = await Attendance.find(query)
      .populate({ path: 'student', populate: { path: 'user', select: 'name' } })
      .populate('class', 'name section')
      .populate({ path: 'markedBy', select: 'name' })
      .sort({ date: -1 })
      .skip(skip)
      .limit(limitNum);

    res.json(paginatedResponse(attendance, total, pageNum, limitNum));
  } catch (error) {
    next(error);
  }
};

// @desc    Get monthly attendance report for a student
// @route   GET /api/attendance/report/:studentId
const getStudentReport = async (req, res, next) => {
  try {
    const { month, year } = req.query;
    const studentId = req.params.studentId;

    const startDate = new Date(year || new Date().getFullYear(), (month || new Date().getMonth() + 1) - 1, 1);
    const endDate = new Date(startDate);
    endDate.setMonth(endDate.getMonth() + 1);

    const records = await Attendance.find({
      student: studentId,
      date: { $gte: startDate, $lt: endDate },
    }).sort({ date: 1 });

    const total = records.length;
    const present = records.filter((r) => r.status === 'present').length;
    const absent = records.filter((r) => r.status === 'absent').length;
    const late = records.filter((r) => r.status === 'late').length;
    const percentage = total > 0 ? Math.round(((present + late) / total) * 100) : 0;

    res.json({
      success: true,
      data: {
        student: studentId,
        month: startDate.toLocaleString('default', { month: 'long', year: 'numeric' }),
        total,
        present,
        absent,
        late,
        percentage,
        records,
      },
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get today's attendance summary
// @route   GET /api/attendance/summary/today
const getTodaySummary = async (req, res, next) => {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const records = await Attendance.find({ date: { $gte: today, $lt: tomorrow } });
    const totalStudents = await Student.countDocuments({ isActive: true });

    res.json({
      success: true,
      data: {
        totalMarked: records.length,
        present: records.filter((r) => r.status === 'present').length,
        absent: records.filter((r) => r.status === 'absent').length,
        late: records.filter((r) => r.status === 'late').length,
        totalStudents,
        percentage: totalStudents > 0 ? Math.round((records.filter((r) => r.status === 'present').length / totalStudents) * 100) : 0,
      },
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get students for attendance marking
// @route   GET /api/attendance/class/:classId/students
const getClassStudentsForAttendance = async (req, res, next) => {
  try {
    const { date } = req.query;
    const classId = req.params.classId;

    const students = await Student.find({ class: classId, isActive: true })
      .populate('user', 'name')
      .sort({ rollNumber: 1 });

    let existingAttendance = [];
    if (date) {
      const d = new Date(date);
      d.setHours(0, 0, 0, 0);
      const nextDay = new Date(d);
      nextDay.setDate(nextDay.getDate() + 1);
      existingAttendance = await Attendance.find({
        class: classId,
        date: { $gte: d, $lt: nextDay },
      });
    }

    const data = students.map((student) => {
      const att = existingAttendance.find((a) => a.student.toString() === student._id.toString());
      return {
        student: student._id,
        rollNumber: student.rollNumber,
        name: student.user.name,
        status: att?.status || '',
        remarks: att?.remarks || '',
      };
    });

    res.json({ success: true, data });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  markAttendance,
  getAttendance,
  getStudentReport,
  getTodaySummary,
  getClassStudentsForAttendance,
};
