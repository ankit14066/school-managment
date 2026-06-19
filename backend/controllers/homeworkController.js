const Homework = require('../models/Homework');
const Student = require('../models/Student');
const Parent = require('../models/Parent');
const Teacher = require('../models/Teacher');
const { getPagination, paginatedResponse } = require('../utils/pagination');
const logActivity = require('../utils/activityLogger');

const getHomework = async (req, res, next) => {
  try {
    const { class: classId, page, limit } = req.query;
    const { page: pageNum, limit: limitNum, skip } = getPagination(page, limit);
    const query = { isActive: true };

    if (classId) query.class = classId;

    if (req.user.role === 'student') {
      const student = await Student.findOne({ user: req.user._id });
      if (student) query.class = student.class;
    } else if (req.user.role === 'parent') {
      const parent = await Parent.findOne({ user: req.user._id });
      if (parent) {
        const student = await Student.findById(parent.linkedStudent);
        if (student) query.class = student.class;
      }
    } else if (req.user.role === 'teacher') {
      const teacher = await Teacher.findOne({ user: req.user._id });
      if (teacher) query.createdBy = req.user._id;
    }

    const total = await Homework.countDocuments(query);
    const homework = await Homework.find(query)
      .populate('subject', 'name code')
      .populate('class', 'name section')
      .populate('createdBy', 'name')
      .sort({ dueDate: 1 })
      .skip(skip)
      .limit(limitNum);

    const today = new Date();
    const data = homework.map((hw) => {
      const obj = hw.toObject();
      const isOverdue = new Date(hw.dueDate) < today;
      if (req.user.role === 'student') {
        const student = hw.submissions?.find((s) => s.student?.toString());
        obj.myStatus = student?.status || (isOverdue ? 'overdue' : 'pending');
      }
      obj.isOverdue = isOverdue;
      return obj;
    });

    res.json(paginatedResponse(data, total, pageNum, limitNum));
  } catch (error) {
    next(error);
  }
};

const createHomework = async (req, res, next) => {
  try {
    const students = await Student.find({ class: req.body.class, isActive: true });
    const submissions = students.map((s) => ({ student: s._id, status: 'pending' }));

    const homework = await Homework.create({
      ...req.body,
      title: req.body.title || req.body.description?.slice(0, 50),
      attachment: req.file ? `/uploads/homework/${req.file.filename}` : '',
      createdBy: req.user._id,
      submissions,
    });

    const populated = await Homework.findById(homework._id)
      .populate('subject', 'name')
      .populate('class', 'name section');

    await logActivity('assigned', 'Homework', homework._id, req.user._id, homework.title);
    res.status(201).json({ success: true, data: populated });
  } catch (error) {
    next(error);
  }
};

const submitHomework = async (req, res, next) => {
  try {
    let studentId;
    if (req.user.role === 'student') {
      const student = await Student.findOne({ user: req.user._id });
      studentId = student?._id;
    } else if (req.user.role === 'parent') {
      const parent = await Parent.findOne({ user: req.user._id });
      studentId = parent?.linkedStudent;
    }

    if (!studentId) return res.status(400).json({ success: false, message: 'Student not found' });

    const homework = await Homework.findById(req.params.id);
    if (!homework) return res.status(404).json({ success: false, message: 'Homework not found' });

    const subIndex = homework.submissions.findIndex((s) => s.student.toString() === studentId.toString());
    if (subIndex >= 0) {
      homework.submissions[subIndex].status = 'submitted';
      homework.submissions[subIndex].submittedAt = new Date();
    } else {
      homework.submissions.push({ student: studentId, status: 'submitted', submittedAt: new Date() });
    }

    await homework.save();
    res.json({ success: true, message: 'Homework marked as submitted' });
  } catch (error) {
    next(error);
  }
};

const getSubmissions = async (req, res, next) => {
  try {
    const homework = await Homework.findById(req.params.id)
      .populate({ path: 'submissions.student', populate: { path: 'user', select: 'name' } });
    if (!homework) return res.status(404).json({ success: false, message: 'Not found' });

    const today = new Date();
    const submissions = homework.submissions.map((s) => ({
      ...s.toObject(),
      status: s.status === 'pending' && new Date(homework.dueDate) < today ? 'overdue' : s.status,
    }));

    res.json({ success: true, data: submissions });
  } catch (error) {
    next(error);
  }
};

module.exports = { getHomework, createHomework, submitHomework, getSubmissions };
