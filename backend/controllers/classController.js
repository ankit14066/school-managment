const Class = require('../models/Class');
const Student = require('../models/Student');
const { getPagination, paginatedResponse } = require('../utils/pagination');
const logActivity = require('../utils/activityLogger');

const getClasses = async (req, res, next) => {
  try {
    const { search, academicYear, page, limit } = req.query;
    const { page: pageNum, limit: limitNum, skip } = getPagination(page, limit);
    const query = {};

    if (academicYear) query.academicYear = academicYear;
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { section: { $regex: search, $options: 'i' } },
      ];
    }

    const total = await Class.countDocuments(query);
    const classes = await Class.find(query)
      .populate('classTeacher', 'employeeId')
      .populate({ path: 'classTeacher', populate: { path: 'user', select: 'name email' } })
      .populate('subjects', 'name code')
      .sort({ name: 1, section: 1 })
      .skip(skip)
      .limit(limitNum);

    res.json(paginatedResponse(classes, total, pageNum, limitNum));
  } catch (error) {
    next(error);
  }
};

const getClass = async (req, res, next) => {
  try {
    const classData = await Class.findById(req.params.id)
      .populate({ path: 'classTeacher', populate: { path: 'user', select: 'name email phone' } })
      .populate('subjects', 'name code teacher')
      .populate({ path: 'students', populate: { path: 'user', select: 'name email' } });

    if (!classData) {
      return res.status(404).json({ success: false, message: 'Class not found' });
    }
    res.json({ success: true, data: classData });
  } catch (error) {
    next(error);
  }
};

const createClass = async (req, res, next) => {
  try {
    const classData = await Class.create({ ...req.body, createdBy: req.user._id });
    const populated = await Class.findById(classData._id)
      .populate({ path: 'classTeacher', populate: { path: 'user', select: 'name' } });

    await logActivity('created', 'Class', classData._id, req.user._id, `Class ${req.body.name}-${req.body.section} created`);
    res.status(201).json({ success: true, message: 'Class created successfully', data: populated });
  } catch (error) {
    next(error);
  }
};

const updateClass = async (req, res, next) => {
  try {
    const classData = await Class.findById(req.params.id);
    if (!classData) {
      return res.status(404).json({ success: false, message: 'Class not found' });
    }

    Object.assign(classData, req.body);
    await classData.save();

    const populated = await Class.findById(classData._id)
      .populate({ path: 'classTeacher', populate: { path: 'user', select: 'name' } })
      .populate('subjects', 'name code');

    await logActivity('updated', 'Class', classData._id, req.user._id, 'Class updated');
    res.json({ success: true, message: 'Class updated successfully', data: populated });
  } catch (error) {
    next(error);
  }
};

const deleteClass = async (req, res, next) => {
  try {
    const classData = await Class.findById(req.params.id);
    if (!classData) {
      return res.status(404).json({ success: false, message: 'Class not found' });
    }

    const studentCount = await Student.countDocuments({ class: classData._id });
    if (studentCount > 0) {
      return res.status(400).json({ success: false, message: 'Cannot delete class with enrolled students' });
    }

    await classData.deleteOne();
    await logActivity('deleted', 'Class', classData._id, req.user._id, 'Class deleted');
    res.json({ success: true, message: 'Class deleted successfully' });
  } catch (error) {
    next(error);
  }
};

module.exports = { getClasses, getClass, createClass, updateClass, deleteClass };
