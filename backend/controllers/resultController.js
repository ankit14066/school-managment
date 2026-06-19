const Exam = require('../models/Exam');
const Result = require('../models/Result');
const Student = require('../models/Student');
const { getPagination, paginatedResponse } = require('../utils/pagination');
const logActivity = require('../utils/activityLogger');

// --- Exams ---

const getExams = async (req, res, next) => {
  try {
    const { class: classId, subject, academicYear, page, limit } = req.query;
    const { page: pageNum, limit: limitNum, skip } = getPagination(page, limit);
    const query = {};

    if (classId) query.class = classId;
    if (subject) query.subject = subject;
    if (academicYear) query.academicYear = academicYear;

    const total = await Exam.countDocuments(query);
    const exams = await Exam.find(query)
      .populate('class', 'name section')
      .populate('subject', 'name code')
      .sort({ date: -1 })
      .skip(skip)
      .limit(limitNum);

    res.json(paginatedResponse(exams, total, pageNum, limitNum));
  } catch (error) {
    next(error);
  }
};

const createExam = async (req, res, next) => {
  try {
    const exam = await Exam.create({ ...req.body, createdBy: req.user._id });
    const populated = await Exam.findById(exam._id)
      .populate('class', 'name section')
      .populate('subject', 'name code');

    await logActivity('created', 'Exam', exam._id, req.user._id, `Exam ${req.body.name} created`);
    res.status(201).json({ success: true, message: 'Exam created', data: populated });
  } catch (error) {
    next(error);
  }
};

// --- Results ---

const getResults = async (req, res, next) => {
  try {
    const { student, exam, class: classId, page, limit } = req.query;
    const { page: pageNum, limit: limitNum, skip } = getPagination(page, limit);
    const query = {};

    if (student) query.student = student;
    if (exam) query.exam = exam;

    if (classId) {
      const students = await Student.find({ class: classId }).select('_id');
      query.student = { $in: students.map((s) => s._id) };
    }

    const total = await Result.countDocuments(query);
    const results = await Result.find(query)
      .populate({ path: 'student', populate: { path: 'user', select: 'name' } })
      .populate({ path: 'exam', populate: [{ path: 'subject', select: 'name code' }, { path: 'class', select: 'name section' }] })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limitNum);

    res.json(paginatedResponse(results, total, pageNum, limitNum));
  } catch (error) {
    next(error);
  }
};

const createResult = async (req, res, next) => {
  try {
    const { student, exam, marksObtained, remarks } = req.body;

    const examData = await Exam.findById(exam);
    if (!examData) {
      return res.status(404).json({ success: false, message: 'Exam not found' });
    }

    if (marksObtained > examData.maxMarks) {
      return res.status(400).json({ success: false, message: `Marks cannot exceed ${examData.maxMarks}` });
    }

    const result = await Result.findOneAndUpdate(
      { student, exam },
      { marksObtained, remarks, enteredBy: req.user._id },
      { upsert: true, new: true, runValidators: true }
    );

    const populated = await Result.findById(result._id)
      .populate({ path: 'student', populate: { path: 'user', select: 'name' } })
      .populate({ path: 'exam', populate: 'subject class' });

    await logActivity('entered', 'Result', result._id, req.user._id, 'Marks entered');
    res.status(201).json({ success: true, message: 'Result saved', data: populated });
  } catch (error) {
    next(error);
  }
};

// @desc    Bulk enter results for an exam
// @route   POST /api/results/bulk
const bulkEnterResults = async (req, res, next) => {
  try {
    const { exam, records } = req.body;
    const examData = await Exam.findById(exam);
    if (!examData) {
      return res.status(404).json({ success: false, message: 'Exam not found' });
    }

    const results = [];
    for (const record of records) {
      if (record.marksObtained > examData.maxMarks) continue;
      const result = await Result.findOneAndUpdate(
        { student: record.student, exam },
        { marksObtained: record.marksObtained, remarks: record.remarks || '', enteredBy: req.user._id },
        { upsert: true, new: true, runValidators: true }
      );
      results.push(result);
    }

    res.status(201).json({ success: true, message: `Results saved for ${results.length} students`, data: results });
  } catch (error) {
    next(error);
  }
};

// @desc    Get student result summary
// @route   GET /api/results/student/:studentId/summary
const getStudentResultSummary = async (req, res, next) => {
  try {
    const results = await Result.find({ student: req.params.studentId })
      .populate({ path: 'exam', populate: 'subject class' })
      .sort({ createdAt: -1 });

    const totalMarks = results.reduce((sum, r) => sum + r.marksObtained, 0);
    const maxMarks = results.reduce((sum, r) => sum + (r.exam?.maxMarks || 0), 0);
    const overallPercentage = maxMarks > 0 ? Math.round((totalMarks / maxMarks) * 100) : 0;

    res.json({
      success: true,
      data: { results, totalMarks, maxMarks, overallPercentage, subjectCount: results.length },
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getExams,
  createExam,
  getResults,
  createResult,
  bulkEnterResults,
  getStudentResultSummary,
};
