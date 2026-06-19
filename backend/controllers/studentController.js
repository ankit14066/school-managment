const User = require('../models/User');
const Student = require('../models/Student');
const Class = require('../models/Class');
const { getPagination, paginatedResponse } = require('../utils/pagination');
const logActivity = require('../utils/activityLogger');
const csv = require('csv-parser');
const fs = require('fs');

// @desc    Get all students
// @route   GET /api/students
const getStudents = async (req, res, next) => {
  try {
    const { search, class: classId, section, page, limit } = req.query;
    const { page: pageNum, limit: limitNum, skip } = getPagination(page, limit);
    const query = { isActive: true };

    if (classId) query.class = classId;
    if (search) {
      const users = await User.find({
        role: 'student',
        $or: [
          { name: { $regex: search, $options: 'i' } },
          { email: { $regex: search, $options: 'i' } },
        ],
      }).select('_id');
      query.$or = [
        { user: { $in: users.map((u) => u._id) } },
        { rollNumber: { $regex: search, $options: 'i' } },
        { parentName: { $regex: search, $options: 'i' } },
      ];
    }

    let students = await Student.find(query)
      .populate('user', 'name email profilePic isActive')
      .populate('class', 'name section academicYear')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limitNum);

    if (section) {
      students = students.filter((s) => s.class?.section === section.toUpperCase());
    }

    const total = await Student.countDocuments(query);
    res.json(paginatedResponse(students, total, pageNum, limitNum));
  } catch (error) {
    next(error);
  }
};

// @desc    Get single student
// @route   GET /api/students/:id
const getStudent = async (req, res, next) => {
  try {
    const student = await Student.findById(req.params.id)
      .populate('user', 'name email profilePic isActive')
      .populate('class', 'name section academicYear classTeacher');

    if (!student) {
      return res.status(404).json({ success: false, message: 'Student not found' });
    }
    res.json({ success: true, data: student });
  } catch (error) {
    next(error);
  }
};

// @desc    Create student
// @route   POST /api/students
const createStudent = async (req, res, next) => {
  try {
    const {
      name, email, password, rollNumber, class: classId, dateOfBirth,
      parentName, phone, address, parentEmail, parentPassword,
    } = req.body;

    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ success: false, message: 'Email already exists' });
    }

    const existingRoll = await Student.findOne({ rollNumber });
    if (existingRoll) {
      return res.status(400).json({ success: false, message: 'Roll number already exists' });
    }

    const classData = await Class.findById(classId);
    if (!classData) {
      return res.status(404).json({ success: false, message: 'Class not found' });
    }

    const user = await User.create({
      name,
      email,
      password: password || 'student123',
      role: 'student',
    });

    const student = await Student.create({
      user: user._id,
      rollNumber,
      class: classId,
      dateOfBirth,
      parentName,
      phone,
      address,
      photo: req.file ? `/uploads/students/${req.file.filename}` : '',
      createdBy: req.user._id,
    });

    await Class.findByIdAndUpdate(classId, { $addToSet: { students: student._id } });

    // Create linked parent account if parentEmail provided
    if (parentEmail) {
      const Parent = require('../models/Parent');
      const existingParent = await User.findOne({ email: parentEmail });
      if (!existingParent) {
        const parentUser = await User.create({
          name: parentName,
          email: parentEmail,
          password: parentPassword || 'parent123',
          role: 'parent',
        });
        await Parent.create({
          user: parentUser._id,
          linkedStudent: student._id,
          phone,
          createdBy: req.user._id,
        });
      }
    }

    const populated = await Student.findById(student._id)
      .populate('user', 'name email profilePic')
      .populate('class', 'name section academicYear');

    await logActivity('created', 'Student', student._id, req.user._id, `Student ${name} enrolled`);

    res.status(201).json({ success: true, message: 'Student created successfully', data: populated });
  } catch (error) {
    next(error);
  }
};

// @desc    Update student
// @route   PUT /api/students/:id
const updateStudent = async (req, res, next) => {
  try {
    const student = await Student.findById(req.params.id).populate('user');
    if (!student) {
      return res.status(404).json({ success: false, message: 'Student not found' });
    }

    const { name, email, rollNumber, class: classId, dateOfBirth, parentName, phone, address, isActive } = req.body;

    if (name) student.user.name = name;
    if (email) student.user.email = email;
    if (rollNumber) student.rollNumber = rollNumber;
    if (dateOfBirth) student.dateOfBirth = dateOfBirth;
    if (parentName) student.parentName = parentName;
    if (phone) student.phone = phone;
    if (address !== undefined) student.address = address;
    if (isActive !== undefined) {
      student.isActive = isActive;
      student.user.isActive = isActive;
    }
    if (req.file) student.photo = `/uploads/students/${req.file.filename}`;

    if (classId && classId !== student.class.toString()) {
      await Class.findByIdAndUpdate(student.class, { $pull: { students: student._id } });
      await Class.findByIdAndUpdate(classId, { $addToSet: { students: student._id } });
      student.class = classId;
    }

    await student.user.save();
    await student.save();

    const populated = await Student.findById(student._id)
      .populate('user', 'name email profilePic isActive')
      .populate('class', 'name section academicYear');

    await logActivity('updated', 'Student', student._id, req.user._id, `Student ${student.user.name} updated`);

    res.json({ success: true, message: 'Student updated successfully', data: populated });
  } catch (error) {
    next(error);
  }
};

// @desc    Delete student
// @route   DELETE /api/students/:id
const deleteStudent = async (req, res, next) => {
  try {
    const student = await Student.findById(req.params.id).populate('user');
    if (!student) {
      return res.status(404).json({ success: false, message: 'Student not found' });
    }

    await Class.findByIdAndUpdate(student.class, { $pull: { students: student._id } });
    const Parent = require('../models/Parent');
    const parent = await Parent.findOne({ linkedStudent: student._id });
    if (parent) {
      await User.findByIdAndDelete(parent.user);
      await parent.deleteOne();
    }
    await User.findByIdAndDelete(student.user._id);
    await student.deleteOne();

    await logActivity('deleted', 'Student', student._id, req.user._id, `Student deleted`);

    res.json({ success: true, message: 'Student deleted successfully' });
  } catch (error) {
    next(error);
  }
};

// @desc    Bulk import students from CSV
// @route   POST /api/students/import/bulk
const bulkImportStudents = async (req, res, next) => {
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, message: 'CSV file is required' });
    }

    const filePath = req.file.path;
    const results = [];
    const errors = [];
    let successCount = 0;

    await new Promise((resolve, reject) => {
      fs.createReadStream(filePath)
        .pipe(csv())
        .on('data', (data) => results.push(data))
        .on('error', (error) => reject(error))
        .on('end', () => resolve());
    });

    // Validate and process each row
    for (let i = 0; i < results.length; i++) {
      try {
        const row = results[i];
        const rowNum = i + 2; // Row numbers start from 2 (after header)

        // Validate required fields
        if (!row.name || !row.email || !row.rollNumber || !row.classId || !row.dateOfBirth || !row.parentName || !row.phone) {
          errors.push({ row: rowNum, error: 'Missing required fields: name, email, rollNumber, classId, dateOfBirth, parentName, phone' });
          continue;
        }

        // Check if email already exists
        const existingUser = await User.findOne({ email: row.email });
        if (existingUser) {
          errors.push({ row: rowNum, error: `Email ${row.email} already exists` });
          continue;
        }

        // Check if roll number already exists
        const existingRoll = await Student.findOne({ rollNumber: row.rollNumber });
        if (existingRoll) {
          errors.push({ row: rowNum, error: `Roll number ${row.rollNumber} already exists` });
          continue;
        }

        // Verify class exists
        const classData = await Class.findById(row.classId);
        if (!classData) {
          errors.push({ row: rowNum, error: `Class with ID ${row.classId} not found` });
          continue;
        }

        // Create user
        const user = await User.create({
          name: row.name,
          email: row.email,
          password: row.password || 'student123',
          role: 'student',
        });

        // Create student
        const student = await Student.create({
          user: user._id,
          rollNumber: row.rollNumber,
          class: row.classId,
          dateOfBirth: new Date(row.dateOfBirth),
          parentName: row.parentName,
          phone: row.phone,
          address: row.address || '',
          createdBy: req.user._id,
        });

        // Add student to class
        await Class.findByIdAndUpdate(row.classId, { $addToSet: { students: student._id } });

        // Create parent account if parentEmail provided
        if (row.parentEmail) {
          const Parent = require('../models/Parent');
          const existingParent = await User.findOne({ email: row.parentEmail });
          if (!existingParent) {
            const parentUser = await User.create({
              name: row.parentName,
              email: row.parentEmail,
              password: row.parentPassword || 'parent123',
              role: 'parent',
            });
            await Parent.create({
              user: parentUser._id,
              linkedStudent: student._id,
              phone: row.phone,
              createdBy: req.user._id,
            });
          }
        }

        successCount++;
      } catch (error) {
        errors.push({ row: i + 2, error: error.message });
      }
    }

    // Clean up uploaded file
    fs.unlinkSync(filePath);

    // Log activity
    if (successCount > 0) {
      await logActivity('bulk_import', 'Student', null, req.user._id, `${successCount} students imported from CSV`);
    }

    res.json({
      success: true,
      message: `Import completed: ${successCount} successful, ${errors.length} failed`,
      data: {
        successCount,
        errors,
        totalProcessed: results.length,
      },
    });
  } catch (error) {
    // Clean up file if exists
    if (req.file && fs.existsSync(req.file.path)) {
      fs.unlinkSync(req.file.path);
    }
    next(error);
  }
};

module.exports = { getStudents, getStudent, createStudent, updateStudent, deleteStudent, bulkImportStudents };
