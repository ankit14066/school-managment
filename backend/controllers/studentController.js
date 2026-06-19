const User = require('../models/User');
const Student = require('../models/Student');
const Class = require('../models/Class');
const Attendance = require('../models/Attendance');
const Fee = require('../models/Fee');
const { getPagination, paginatedResponse } = require('../utils/pagination');
const logActivity = require('../utils/activityLogger');
const csv = require('csv-parser');
const fs = require('fs');
const PDFDocument = require('pdfkit');
const { createObjectCsvWriter } = require('csv-writer');

// @desc    Get all students
// @route   GET /api/students
const getStudents = async (req, res, next) => {
  try {
    const { search, class: classId, section, gender, ageMin, ageMax, feeStatus, page, limit } = req.query;
    const { page: pageNum, limit: limitNum, skip } = getPagination(page, limit);
    const query = { isActive: true };

    if (classId) query.class = classId;
    if (gender) query.gender = gender;
    if (ageMin || ageMax) {
      const now = new Date();
      query.dateOfBirth = {};
      if (ageMin) {
        query.dateOfBirth.$lte = new Date(now.getFullYear() - Number(ageMin), now.getMonth(), now.getDate());
      }
      if (ageMax) {
        query.dateOfBirth.$gte = new Date(now.getFullYear() - Number(ageMax) - 1, now.getMonth(), now.getDate() + 1);
      }
    }
    if (feeStatus) {
      const studentIds = await Fee.distinct('student', { status: feeStatus });
      query._id = { $in: studentIds };
    }
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
      name, email, password, rollNumber, class: classId, dateOfBirth, gender, bloodGroup,
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
      gender: gender || '',
      bloodGroup: bloodGroup || '',
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

    const { name, email, rollNumber, class: classId, dateOfBirth, gender, bloodGroup, parentName, phone, address, isActive } = req.body;

    if (name) student.user.name = name;
    if (email) student.user.email = email;
    if (rollNumber) student.rollNumber = rollNumber;
    if (dateOfBirth) student.dateOfBirth = dateOfBirth;
    if (gender !== undefined) student.gender = gender;
    if (bloodGroup !== undefined) student.bloodGroup = bloodGroup;
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

// @desc    Bulk delete students
// @route   POST /api/students/bulk-delete
const bulkDeleteStudents = async (req, res, next) => {
  try {
    const { ids } = req.body;
    if (!Array.isArray(ids) || ids.length === 0) {
      return res.status(400).json({ success: false, message: 'Student ids are required' });
    }

    const Parent = require('../models/Parent');
    const students = await Student.find({ _id: { $in: ids } }).populate('user');

    for (const student of students) {
      await Class.findByIdAndUpdate(student.class, { $pull: { students: student._id } });
      const parent = await Parent.findOne({ linkedStudent: student._id });
      if (parent) {
        await User.findByIdAndDelete(parent.user);
        await parent.deleteOne();
      }
      await User.findByIdAndDelete(student.user._id);
      await student.deleteOne();
    }

    await logActivity('bulk_delete', 'Student', null, req.user._id, `${students.length} students deleted`);
    res.json({ success: true, message: `${students.length} students deleted successfully`, data: { deletedCount: students.length } });
  } catch (error) {
    next(error);
  }
};

// @desc    Suggest next roll number for a class
// @route   GET /api/students/next-roll?class=classId
const getNextRollNumber = async (req, res, next) => {
  try {
    const { class: classId } = req.query;
    if (!classId) return res.status(400).json({ success: false, message: 'Class is required' });

    const students = await Student.find({ class: classId }).select('rollNumber');
    const numericRolls = students
      .map((s) => parseInt(String(s.rollNumber).match(/\d+$/)?.[0] || '', 10))
      .filter((n) => Number.isFinite(n));

    const nextRollNumber = String(numericRolls.length ? Math.max(...numericRolls) + 1 : 1).padStart(3, '0');
    res.json({ success: true, data: { nextRollNumber } });
  } catch (error) {
    next(error);
  }
};

// @desc    Student profile summary with attendance and fees
// @route   GET /api/students/:id/profile-summary
const getStudentProfileSummary = async (req, res, next) => {
  try {
    const student = await Student.findById(req.params.id)
      .populate('user', 'name email profilePic isActive')
      .populate('class', 'name section academicYear');

    if (!student) return res.status(404).json({ success: false, message: 'Student not found' });

    const [attendanceRecords, fees] = await Promise.all([
      Attendance.find({ student: student._id }).sort({ date: -1 }),
      Fee.find({ student: student._id }).sort({ dueDate: -1 }),
    ]);

    const totalAttendance = attendanceRecords.length;
    const present = attendanceRecords.filter((r) => r.status === 'present').length;
    const late = attendanceRecords.filter((r) => r.status === 'late').length;
    const absent = attendanceRecords.filter((r) => r.status === 'absent').length;
    const attendancePercentage = totalAttendance ? Math.round(((present + late) / totalAttendance) * 100) : 0;
    const totalDue = fees.reduce((sum, fee) => sum + Math.max((fee.amount || 0) - (fee.paidAmount || 0), 0), 0);
    const totalPaid = fees.reduce((sum, fee) => sum + (fee.paidAmount || 0), 0);

    res.json({
      success: true,
      data: {
        student,
        attendance: { total: totalAttendance, present, late, absent, percentage: attendancePercentage },
        fees: {
          totalDue,
          totalPaid,
          history: fees.map((fee) => ({
            _id: fee._id,
            type: fee.type,
            month: fee.month,
            academicYear: fee.academicYear,
            amount: fee.amount,
            paidAmount: fee.paidAmount,
            dueAmount: Math.max((fee.amount || 0) - (fee.paidAmount || 0), 0),
            status: fee.status,
            dueDate: fee.dueDate,
            paymentDate: fee.paymentDate,
            receiptNumber: fee.receiptNumber,
          })),
        },
      },
    });
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
      fs.createReadStream(filePath, { encoding: 'utf8' })
        .pipe(csv({
          mapHeaders: ({ header }) => header.trim(),
          mapValues: ({ value }) => value.trim()
        }))
        .on('data', (data) => {
          // Trim all values in the row
          const trimmedRow = {};
          for (const [key, value] of Object.entries(data)) {
            trimmedRow[key.trim()] = value ? value.trim() : value;
          }
          results.push(trimmedRow);
        })
        .on('error', (error) => reject(error))
        .on('end', () => resolve());
    });

    // Validate and process each row
    for (let i = 0; i < results.length; i++) {
      try {
        const row = results[i];
        const rowNum = i + 2; // Row numbers start from 2 (after header)

        // Validate required fields
        const rowErrors = [];

        if (!row.name || !row.email || !row.rollNumber || !row.classId || !row.dateOfBirth || !row.parentName || !row.phone) {
          rowErrors.push('Missing required fields: name, email, rollNumber, classId, dateOfBirth, parentName, phone');
        }
        if (row.email && !/^\S+@\S+\.\S+$/.test(row.email)) rowErrors.push(`Invalid email: ${row.email}`);
        if (row.dateOfBirth && Number.isNaN(new Date(row.dateOfBirth).getTime())) rowErrors.push(`Invalid dateOfBirth: ${row.dateOfBirth}`);
        if (row.gender && !['male', 'female', 'other'].includes(row.gender.toLowerCase())) rowErrors.push(`Invalid gender: ${row.gender}`);
        if (row.bloodGroup && !['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'].includes(row.bloodGroup.toUpperCase())) rowErrors.push(`Invalid bloodGroup: ${row.bloodGroup}`);

        if (rowErrors.length > 0) {
          errors.push({ row: rowNum, error: rowErrors.join('; '), data: row });
          continue;
        }

        // Check if email already exists
        const existingUser = await User.findOne({ email: row.email });
        if (existingUser) {
          errors.push({ row: rowNum, error: `Email ${row.email} already exists`, data: row });
          continue;
        }

        // Check if roll number already exists
        const existingRoll = await Student.findOne({ rollNumber: row.rollNumber });
        if (existingRoll) {
          errors.push({ row: rowNum, error: `Roll number ${row.rollNumber} already exists`, data: row });
          continue;
        }

        // Verify class exists
        const classData = await Class.findById(row.classId);
        if (!classData) {
          errors.push({ row: rowNum, error: `Class with ID ${row.classId} not found`, data: row });
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
          gender: row.gender ? row.gender.toLowerCase() : '',
          bloodGroup: row.bloodGroup ? row.bloodGroup.toUpperCase() : '',
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
        errors.push({ row: i + 2, error: error.message, data: results[i] });
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

// @desc    Export students to CSV
// @route   GET /api/students/export/csv
const exportStudentsCSV = async (req, res, next) => {
  try {
    const { class: classId, section } = req.query;
    const query = { isActive: true };

    if (classId) query.class = classId;

    let students = await Student.find(query)
      .populate('user', 'name email')
      .populate('class', 'name section academicYear')
      .sort({ rollNumber: 1 });

    if (section) {
      students = students.filter((s) => s.class?.section === section.toUpperCase());
    }

    if (students.length === 0) {
      return res.status(400).json({ success: false, message: 'No students found to export' });
    }

    const csvData = students.map((student) => ({
      'Roll Number': student.rollNumber,
      'Name': student.user?.name || 'N/A',
      'Email': student.user?.email || 'N/A',
      'Class': student.class?.name || 'N/A',
      'Section': student.class?.section || 'N/A',
      'Date of Birth': student.dateOfBirth ? new Date(student.dateOfBirth).toLocaleDateString() : 'N/A',
      'Parent Name': student.parentName || 'N/A',
      'Phone': student.phone || 'N/A',
      'Address': student.address || 'N/A',
      'Status': student.isActive ? 'Active' : 'Inactive',
    }));

    const csvPath = `/uploads/temp/students-${Date.now()}.csv`;
    const csvFilePath = `${process.cwd()}${csvPath}`;

    const writer = createObjectCsvWriter({
      path: csvFilePath,
      header: [
        { id: 'Roll Number', title: 'Roll Number' },
        { id: 'Name', title: 'Name' },
        { id: 'Email', title: 'Email' },
        { id: 'Class', title: 'Class' },
        { id: 'Section', title: 'Section' },
        { id: 'Date of Birth', title: 'Date of Birth' },
        { id: 'Parent Name', title: 'Parent Name' },
        { id: 'Phone', title: 'Phone' },
        { id: 'Address', title: 'Address' },
        { id: 'Status', title: 'Status' },
      ],
    });

    await writer.writeRecords(csvData);

    await logActivity('export', 'Student', null, req.user._id, `${students.length} students exported to CSV`);

    res.download(csvFilePath, `students-${Date.now()}.csv`, (err) => {
      if (err) console.error('Download error:', err);
      // Clean up file after download
      fs.unlink(csvFilePath, (error) => {
        if (error) console.error('File cleanup error:', error);
      });
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Export students to PDF
// @route   GET /api/students/export/pdf
const exportStudentsPDF = async (req, res, next) => {
  try {
    const { class: classId, section } = req.query;
    const query = { isActive: true };

    if (classId) query.class = classId;

    let students = await Student.find(query)
      .populate('user', 'name email')
      .populate('class', 'name section academicYear')
      .sort({ rollNumber: 1 });

    if (section) {
      students = students.filter((s) => s.class?.section === section.toUpperCase());
    }

    if (students.length === 0) {
      return res.status(400).json({ success: false, message: 'No students found to export' });
    }

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="students-${Date.now()}.pdf"`);

    const doc = new PDFDocument({ margin: 30, size: 'A4' });
    doc.pipe(res);

    // Title
    doc.fontSize(20).font('Helvetica-Bold').text('SCHOOL MANAGEMENT SYSTEM', { align: 'center' });
    doc.fontSize(14).text('Student Report', { align: 'center' });
    doc.fontSize(10).text(`Generated on: ${new Date().toLocaleDateString()}`, { align: 'center' });
    doc.moveDown();

    // Filter info
    if (classId || section) {
      doc.fontSize(10).font('Helvetica').text('Filter:', { underline: true });
      if (classId) {
        const classData = await Class.findById(classId);
        doc.text(`Class: ${classData?.name || 'N/A'}`);
      }
      if (section) doc.text(`Section: ${section.toUpperCase()}`);
      doc.moveDown();
    }

    // Table headers
    const tableTop = doc.y;
    const colWidth = 75;
    const cols = {
      rollNumber: 30,
      name: 110,
      email: 130,
      class: 80,
      phone: 80,
      parent: 100,
    };

    doc.font('Helvetica-Bold').fontSize(9);
    doc.text('Roll No', cols.rollNumber, tableTop);
    doc.text('Name', cols.name, tableTop);
    doc.text('Email', cols.email, tableTop);
    doc.text('Class', cols.class, tableTop);
    doc.text('Phone', cols.phone, tableTop);

    // Draw horizontal line
    doc.moveTo(30, tableTop + 15).lineTo(550, tableTop + 15).stroke();

    let y = tableTop + 20;
    const pageHeight = doc.page.height;
    const bottomMargin = 60;

    doc.font('Helvetica').fontSize(8);

    students.forEach((student, index) => {
      // Check if we need a new page
      if (y > pageHeight - bottomMargin) {
        doc.addPage();
        y = 30;
        // Repeat header on new page
        doc.font('Helvetica-Bold').fontSize(9);
        doc.text('Roll No', cols.rollNumber, y);
        doc.text('Name', cols.name, y);
        doc.text('Email', cols.email, y);
        doc.text('Class', cols.class, y);
        doc.text('Phone', cols.phone, y);
        doc.moveTo(30, y + 15).lineTo(550, y + 15).stroke();
        y += 20;
        doc.font('Helvetica').fontSize(8);
      }

      doc.text(student.rollNumber || 'N/A', cols.rollNumber, y);
      doc.text(student.user?.name || 'N/A', cols.name, y, { width: 80, ellipsis: true });
      doc.text(student.user?.email || 'N/A', cols.email, y, { width: 120, ellipsis: true });
      doc.text(student.class?.name || 'N/A', cols.class, y);
      doc.text(student.phone || 'N/A', cols.phone, y);

      y += 15;
    });

    // Footer
    doc.fontSize(8).text(`Total Students: ${students.length}`, 30, pageHeight - 30, { align: 'left' });

    await logActivity('export', 'Student', null, req.user._id, `${students.length} students exported to PDF`);

    doc.end();
  } catch (error) {
    next(error);
  }
};

module.exports = { 
  getStudents, 
  getStudent, 
  getStudentProfileSummary,
  createStudent, 
  updateStudent, 
  deleteStudent, 
  bulkDeleteStudents,
  getNextRollNumber,
  bulkImportStudents,
  exportStudentsCSV,
  exportStudentsPDF,
};
