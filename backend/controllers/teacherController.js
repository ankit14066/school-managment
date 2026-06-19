const User = require('../models/User');
const Teacher = require('../models/Teacher');
const Subject = require('../models/Subject');
const { getPagination, paginatedResponse } = require('../utils/pagination');
const logActivity = require('../utils/activityLogger');

// @desc    Get all teachers
// @route   GET /api/teachers
const getTeachers = async (req, res, next) => {
  try {
    const { search, page, limit } = req.query;
    const { page: pageNum, limit: limitNum, skip } = getPagination(page, limit);
    const query = {};

    if (search) {
      const users = await User.find({
        role: 'teacher',
        $or: [
          { name: { $regex: search, $options: 'i' } },
          { email: { $regex: search, $options: 'i' } },
        ],
      }).select('_id');
      query.$or = [
        { user: { $in: users.map((u) => u._id) } },
        { employeeId: { $regex: search, $options: 'i' } },
      ];
    }

    const total = await Teacher.countDocuments(query);
    const teachers = await Teacher.find(query)
      .populate('user', 'name email profilePic isActive')
      .populate('subjects', 'name code class')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limitNum);

    res.json(paginatedResponse(teachers, total, pageNum, limitNum));
  } catch (error) {
    next(error);
  }
};

// @desc    Get single teacher
// @route   GET /api/teachers/:id
const getTeacher = async (req, res, next) => {
  try {
    const teacher = await Teacher.findById(req.params.id)
      .populate('user', 'name email profilePic isActive')
      .populate({ path: 'subjects', select: 'name code', populate: { path: 'class', select: 'name section' } });

    if (!teacher) {
      return res.status(404).json({ success: false, message: 'Teacher not found' });
    }
    res.json({ success: true, data: teacher });
  } catch (error) {
    next(error);
  }
};

// @desc    Create teacher
// @route   POST /api/teachers
const createTeacher = async (req, res, next) => {
  try {
    const { name, email, password, employeeId, phone, qualification, joiningDate, subjects } = req.body;

    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ success: false, message: 'Email already exists' });
    }

    const existingEmp = await Teacher.findOne({ employeeId: employeeId.toUpperCase() });
    if (existingEmp) {
      return res.status(400).json({ success: false, message: 'Employee ID already exists' });
    }

    const user = await User.create({
      name,
      email,
      password: password || 'teacher123',
      role: 'teacher',
    });

    const subjectIds = subjects ? (Array.isArray(subjects) ? subjects : JSON.parse(subjects)) : [];

    const teacher = await Teacher.create({
      user: user._id,
      employeeId: employeeId.toUpperCase(),
      phone,
      qualification,
      joiningDate: joiningDate || new Date(),
      subjects: subjectIds,
      createdBy: req.user._id,
    });

    if (subjectIds.length > 0) {
      await Subject.updateMany({ _id: { $in: subjectIds } }, { teacher: teacher._id });
    }

    const populated = await Teacher.findById(teacher._id)
      .populate('user', 'name email profilePic')
      .populate('subjects', 'name code');

    await logActivity('created', 'Teacher', teacher._id, req.user._id, `Teacher ${name} hired`);

    res.status(201).json({ success: true, message: 'Teacher created successfully', data: populated });
  } catch (error) {
    next(error);
  }
};

// @desc    Update teacher
// @route   PUT /api/teachers/:id
const updateTeacher = async (req, res, next) => {
  try {
    const teacher = await Teacher.findById(req.params.id).populate('user');
    if (!teacher) {
      return res.status(404).json({ success: false, message: 'Teacher not found' });
    }

    const { name, email, employeeId, phone, qualification, joiningDate, subjects, isActive } = req.body;

    if (name) teacher.user.name = name;
    if (email) teacher.user.email = email;
    if (employeeId) teacher.employeeId = employeeId.toUpperCase();
    if (phone) teacher.phone = phone;
    if (qualification !== undefined) teacher.qualification = qualification;
    if (joiningDate) teacher.joiningDate = joiningDate;
    if (isActive !== undefined) {
      teacher.isActive = isActive;
      teacher.user.isActive = isActive;
    }

    if (subjects !== undefined) {
      const subjectIds = Array.isArray(subjects) ? subjects : JSON.parse(subjects);
      await Subject.updateMany({ teacher: teacher._id }, { $unset: { teacher: 1 } });
      await Subject.updateMany({ _id: { $in: subjectIds } }, { teacher: teacher._id });
      teacher.subjects = subjectIds;
    }

    await teacher.user.save();
    await teacher.save();

    const populated = await Teacher.findById(teacher._id)
      .populate('user', 'name email profilePic isActive')
      .populate('subjects', 'name code');

    await logActivity('updated', 'Teacher', teacher._id, req.user._id, `Teacher ${teacher.user.name} updated`);

    res.json({ success: true, message: 'Teacher updated successfully', data: populated });
  } catch (error) {
    next(error);
  }
};

// @desc    Delete teacher
// @route   DELETE /api/teachers/:id
const deleteTeacher = async (req, res, next) => {
  try {
    const teacher = await Teacher.findById(req.params.id).populate('user');
    if (!teacher) {
      return res.status(404).json({ success: false, message: 'Teacher not found' });
    }

    await Subject.updateMany({ teacher: teacher._id }, { $unset: { teacher: 1 } });
    await User.findByIdAndDelete(teacher.user._id);
    await teacher.deleteOne();

    await logActivity('deleted', 'Teacher', teacher._id, req.user._id, 'Teacher deleted');

    res.json({ success: true, message: 'Teacher deleted successfully' });
  } catch (error) {
    next(error);
  }
};

module.exports = { getTeachers, getTeacher, createTeacher, updateTeacher, deleteTeacher };
