const Subject = require('../models/Subject');
const Class = require('../models/Class');
const Teacher = require('../models/Teacher');
const { getPagination, paginatedResponse } = require('../utils/pagination');
const logActivity = require('../utils/activityLogger');

const getSubjects = async (req, res, next) => {
  try {
    const { class: classId, search, page, limit } = req.query;
    const { page: pageNum, limit: limitNum, skip } = getPagination(page, limit);
    const query = {};

    if (classId) query.class = classId;
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { code: { $regex: search, $options: 'i' } },
      ];
    }

    const total = await Subject.countDocuments(query);
    const subjects = await Subject.find(query)
      .populate('class', 'name section academicYear')
      .populate({ path: 'teacher', populate: { path: 'user', select: 'name email' } })
      .sort({ name: 1 })
      .skip(skip)
      .limit(limitNum);

    res.json(paginatedResponse(subjects, total, pageNum, limitNum));
  } catch (error) {
    next(error);
  }
};

const getSubject = async (req, res, next) => {
  try {
    const subject = await Subject.findById(req.params.id)
      .populate('class', 'name section academicYear')
      .populate({ path: 'teacher', populate: { path: 'user', select: 'name email' } });

    if (!subject) {
      return res.status(404).json({ success: false, message: 'Subject not found' });
    }
    res.json({ success: true, data: subject });
  } catch (error) {
    next(error);
  }
};

const createSubject = async (req, res, next) => {
  try {
    const subject = await Subject.create({ ...req.body, createdBy: req.user._id });

    await Class.findByIdAndUpdate(req.body.class, { $addToSet: { subjects: subject._id } });

    if (req.body.teacher) {
      await Teacher.findByIdAndUpdate(req.body.teacher, { $addToSet: { subjects: subject._id } });
    }

    const populated = await Subject.findById(subject._id)
      .populate('class', 'name section')
      .populate({ path: 'teacher', populate: { path: 'user', select: 'name' } });

    await logActivity('created', 'Subject', subject._id, req.user._id, `Subject ${req.body.name} created`);
    res.status(201).json({ success: true, message: 'Subject created successfully', data: populated });
  } catch (error) {
    next(error);
  }
};

const updateSubject = async (req, res, next) => {
  try {
    const subject = await Subject.findById(req.params.id);
    if (!subject) {
      return res.status(404).json({ success: false, message: 'Subject not found' });
    }

    if (req.body.teacher && req.body.teacher !== subject.teacher?.toString()) {
      if (subject.teacher) {
        await Teacher.findByIdAndUpdate(subject.teacher, { $pull: { subjects: subject._id } });
      }
      await Teacher.findByIdAndUpdate(req.body.teacher, { $addToSet: { subjects: subject._id } });
    }

    Object.assign(subject, req.body);
    await subject.save();

    const populated = await Subject.findById(subject._id)
      .populate('class', 'name section')
      .populate({ path: 'teacher', populate: { path: 'user', select: 'name' } });

    res.json({ success: true, message: 'Subject updated successfully', data: populated });
  } catch (error) {
    next(error);
  }
};

const deleteSubject = async (req, res, next) => {
  try {
    const subject = await Subject.findById(req.params.id);
    if (!subject) {
      return res.status(404).json({ success: false, message: 'Subject not found' });
    }

    await Class.findByIdAndUpdate(subject.class, { $pull: { subjects: subject._id } });
    if (subject.teacher) {
      await Teacher.findByIdAndUpdate(subject.teacher, { $pull: { subjects: subject._id } });
    }

    await subject.deleteOne();
    res.json({ success: true, message: 'Subject deleted successfully' });
  } catch (error) {
    next(error);
  }
};

module.exports = { getSubjects, getSubject, createSubject, updateSubject, deleteSubject };
