const Timetable = require('../models/Timetable');
const Teacher = require('../models/Teacher');
const Student = require('../models/Student');
const Parent = require('../models/Parent');
const { getPagination, paginatedResponse } = require('../utils/pagination');
const logActivity = require('../utils/activityLogger');

const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

const getTimetable = async (req, res, next) => {
  try {
    const { class: classId, academicYear } = req.query;
    let targetClass = classId;

    if (req.user.role === 'student') {
      const student = await Student.findOne({ user: req.user._id });
      targetClass = student?.class;
    } else if (req.user.role === 'parent') {
      const parent = await Parent.findOne({ user: req.user._id });
      const student = parent ? await Student.findById(parent.linkedStudent) : null;
      targetClass = student?.class;
    } else if (req.user.role === 'teacher') {
      const teacher = await Teacher.findOne({ user: req.user._id });
      if (!classId && teacher) {
        const entries = await Timetable.find({ teacher: teacher._id, academicYear: academicYear || '2025-2026' })
          .populate('class', 'name section')
          .populate('subject', 'name code')
          .populate({ path: 'teacher', populate: { path: 'user', select: 'name' } })
          .sort({ day: 1, period: 1 });
        return res.json({ success: true, data: groupByDay(entries) });
      }
    }

    if (!targetClass) {
      return res.status(400).json({ success: false, message: 'Class is required' });
    }

    const entries = await Timetable.find({
      class: targetClass,
      academicYear: academicYear || '2025-2026',
    })
      .populate('class', 'name section')
      .populate('subject', 'name code')
      .populate({ path: 'teacher', populate: { path: 'user', select: 'name' } })
      .sort({ day: 1, period: 1 });

    res.json({ success: true, data: groupByDay(entries) });
  } catch (error) {
    next(error);
  }
};

const groupByDay = (entries) => {
  const grouped = {};
  DAYS.forEach((d) => { grouped[d] = []; });
  entries.forEach((e) => {
    if (grouped[e.day]) grouped[e.day].push(e);
  });
  return grouped;
};

const createTimetableEntry = async (req, res, next) => {
  try {
    const entry = await Timetable.create({ ...req.body, createdBy: req.user._id });
    const populated = await Timetable.findById(entry._id)
      .populate('class', 'name section')
      .populate('subject', 'name code')
      .populate({ path: 'teacher', populate: { path: 'user', select: 'name' } });

    await logActivity('created', 'Timetable', entry._id, req.user._id, 'Timetable entry added');
    res.status(201).json({ success: true, data: populated });
  } catch (error) {
    next(error);
  }
};

const bulkCreateTimetable = async (req, res, next) => {
  try {
    const { entries, class: classId, academicYear } = req.body;
    await Timetable.deleteMany({ class: classId, academicYear });

    const created = await Timetable.insertMany(
      entries.map((e) => ({ ...e, class: classId, academicYear, createdBy: req.user._id }))
    );

    res.status(201).json({ success: true, message: `${created.length} entries created`, data: created });
  } catch (error) {
    next(error);
  }
};

const deleteTimetableEntry = async (req, res, next) => {
  try {
    await Timetable.findByIdAndDelete(req.params.id);
    res.json({ success: true, message: 'Entry deleted' });
  } catch (error) {
    next(error);
  }
};

module.exports = { getTimetable, createTimetableEntry, bulkCreateTimetable, deleteTimetableEntry };
