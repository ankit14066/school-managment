const User = require('../models/User');
const Teacher = require('../models/Teacher');
const Subject = require('../models/Subject');
const { getPagination, paginatedResponse } = require('../utils/pagination');
const logActivity = require('../utils/activityLogger');
const PDFDocument = require('pdfkit');
const { createObjectCsvWriter } = require('csv-writer');
const fs = require('fs');

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

// @desc    Export teachers to CSV
// @route   GET /api/teachers/export/csv
const exportTeachersCSV = async (req, res, next) => {
  try {
    const teachers = await Teacher.find({})
      .populate('user', 'name email')
      .populate('subjects', 'name code')
      .sort({ employeeId: 1 });

    if (teachers.length === 0) {
      return res.status(400).json({ success: false, message: 'No teachers found to export' });
    }

    const csvData = teachers.map((teacher) => ({
      'Employee ID': teacher.employeeId,
      'Name': teacher.user?.name || 'N/A',
      'Email': teacher.user?.email || 'N/A',
      'Phone': teacher.phone || 'N/A',
      'Qualification': teacher.qualification || 'N/A',
      'Joining Date': teacher.joiningDate ? new Date(teacher.joiningDate).toLocaleDateString() : 'N/A',
      'Subjects': teacher.subjects?.map((s) => s.name).join(', ') || 'None',
    }));

    const csvPath = `/uploads/temp/teachers-${Date.now()}.csv`;
    const csvFilePath = `${process.cwd()}${csvPath}`;

    const writer = createObjectCsvWriter({
      path: csvFilePath,
      header: [
        { id: 'Employee ID', title: 'Employee ID' },
        { id: 'Name', title: 'Name' },
        { id: 'Email', title: 'Email' },
        { id: 'Phone', title: 'Phone' },
        { id: 'Qualification', title: 'Qualification' },
        { id: 'Joining Date', title: 'Joining Date' },
        { id: 'Subjects', title: 'Subjects' },
      ],
    });

    await writer.writeRecords(csvData);

    await logActivity('export', 'Teacher', null, req.user._id, `${teachers.length} teachers exported to CSV`);

    res.download(csvFilePath, `teachers-${Date.now()}.csv`, (err) => {
      if (err) console.error('Download error:', err);
      fs.unlink(csvFilePath, (error) => {
        if (error) console.error('File cleanup error:', error);
      });
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Export teachers to PDF
// @route   GET /api/teachers/export/pdf
const exportTeachersPDF = async (req, res, next) => {
  try {
    const teachers = await Teacher.find({})
      .populate('user', 'name email')
      .populate('subjects', 'name code')
      .sort({ employeeId: 1 });

    if (teachers.length === 0) {
      return res.status(400).json({ success: false, message: 'No teachers found to export' });
    }

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="teachers-${Date.now()}.pdf"`);

    const doc = new PDFDocument({ margin: 30, size: 'A4' });
    doc.pipe(res);

    doc.fontSize(20).font('Helvetica-Bold').text('SCHOOL MANAGEMENT SYSTEM', { align: 'center' });
    doc.fontSize(14).text('Teachers Report', { align: 'center' });
    doc.fontSize(10).text(`Generated on: ${new Date().toLocaleDateString()}`, { align: 'center' });
    doc.moveDown();

    const tableTop = doc.y;
    const cols = {
      employeeId: 50,
      name: 110,
      email: 140,
      phone: 100,
      qualification: 120,
    };

    doc.font('Helvetica-Bold').fontSize(9);
    doc.text('Emp ID', cols.employeeId, tableTop);
    doc.text('Name', cols.name, tableTop);
    doc.text('Email', cols.email, tableTop);
    doc.text('Phone', cols.phone, tableTop);
    doc.text('Qualification', cols.qualification, tableTop);

    doc.moveTo(30, tableTop + 15).lineTo(550, tableTop + 15).stroke();

    let y = tableTop + 20;
    const pageHeight = doc.page.height;
    const bottomMargin = 60;

    doc.font('Helvetica').fontSize(8);

    teachers.forEach((teacher) => {
      if (y > pageHeight - bottomMargin) {
        doc.addPage();
        y = 30;
        doc.font('Helvetica-Bold').fontSize(9);
        doc.text('Emp ID', cols.employeeId, y);
        doc.text('Name', cols.name, y);
        doc.text('Email', cols.email, y);
        doc.text('Phone', cols.phone, y);
        doc.text('Qualification', cols.qualification, y);
        doc.moveTo(30, y + 15).lineTo(550, y + 15).stroke();
        y += 20;
        doc.font('Helvetica').fontSize(8);
      }

      doc.text(teacher.employeeId || 'N/A', cols.employeeId, y);
      doc.text(teacher.user?.name || 'N/A', cols.name, y, { width: 80, ellipsis: true });
      doc.text(teacher.user?.email || 'N/A', cols.email, y, { width: 100, ellipsis: true });
      doc.text(teacher.phone || 'N/A', cols.phone, y);
      doc.text(teacher.qualification || 'N/A', cols.qualification, y);

      y += 15;
    });

    doc.fontSize(8).text(`Total Teachers: ${teachers.length}`, 30, pageHeight - 30, { align: 'left' });

    await logActivity('export', 'Teacher', null, req.user._id, `${teachers.length} teachers exported to PDF`);

    doc.end();
  } catch (error) {
    next(error);
  }
};

module.exports = { 
  getTeachers, 
  getTeacher, 
  createTeacher, 
  updateTeacher, 
  deleteTeacher,
  exportTeachersCSV,
  exportTeachersPDF,
};
