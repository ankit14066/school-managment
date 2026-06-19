const Subject = require('../models/Subject');
const Class = require('../models/Class');
const Teacher = require('../models/Teacher');
const { getPagination, paginatedResponse } = require('../utils/pagination');
const logActivity = require('../utils/activityLogger');
const PDFDocument = require('pdfkit');
const { createObjectCsvWriter } = require('csv-writer');
const fs = require('fs');

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

// @desc    Export subjects to CSV
// @route   GET /api/subjects/export/csv
const exportSubjectsCSV = async (req, res, next) => {
  try {
    const subjects = await Subject.find({})
      .populate('class', 'name section')
      .populate({ path: 'teacher', populate: { path: 'user', select: 'name' } })
      .sort({ code: 1 });

    if (subjects.length === 0) {
      return res.status(400).json({ success: false, message: 'No subjects found to export' });
    }

    const csvData = subjects.map((subject) => ({
      'Code': subject.code,
      'Name': subject.name,
      'Class': subject.class ? `${subject.class.name}-${subject.class.section}` : 'N/A',
      'Teacher': subject.teacher?.user?.name || 'Unassigned',
      'Description': subject.description || '',
    }));

    const csvPath = `/uploads/temp/subjects-${Date.now()}.csv`;
    const csvFilePath = `${process.cwd()}${csvPath}`;

    const writer = createObjectCsvWriter({
      path: csvFilePath,
      header: [
        { id: 'Code', title: 'Code' },
        { id: 'Name', title: 'Name' },
        { id: 'Class', title: 'Class' },
        { id: 'Teacher', title: 'Teacher' },
        { id: 'Description', title: 'Description' },
      ],
    });

    await writer.writeRecords(csvData);

    await logActivity('export', 'Subject', null, req.user._id, `${subjects.length} subjects exported to CSV`);

    res.download(csvFilePath, `subjects-${Date.now()}.csv`, (err) => {
      if (err) console.error('Download error:', err);
      fs.unlink(csvFilePath, (error) => {
        if (error) console.error('File cleanup error:', error);
      });
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Export subjects to PDF
// @route   GET /api/subjects/export/pdf
const exportSubjectsPDF = async (req, res, next) => {
  try {
    const subjects = await Subject.find({})
      .populate('class', 'name section')
      .populate({ path: 'teacher', populate: { path: 'user', select: 'name' } })
      .sort({ code: 1 });

    if (subjects.length === 0) {
      return res.status(400).json({ success: false, message: 'No subjects found to export' });
    }

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="subjects-${Date.now()}.pdf"`);

    const doc = new PDFDocument({ margin: 30, size: 'A4' });
    doc.pipe(res);

    doc.fontSize(20).font('Helvetica-Bold').text('SCHOOL MANAGEMENT SYSTEM', { align: 'center' });
    doc.fontSize(14).text('Subjects Report', { align: 'center' });
    doc.fontSize(10).text(`Generated on: ${new Date().toLocaleDateString()}`, { align: 'center' });
    doc.moveDown();

    const tableTop = doc.y;
    const cols = {
      code: 50,
      name: 120,
      class: 110,
      teacher: 140,
    };

    doc.font('Helvetica-Bold').fontSize(9);
    doc.text('Code', cols.code, tableTop);
    doc.text('Name', cols.name, tableTop);
    doc.text('Class', cols.class, tableTop);
    doc.text('Teacher', cols.teacher, tableTop);

    doc.moveTo(30, tableTop + 15).lineTo(550, tableTop + 15).stroke();

    let y = tableTop + 20;
    const pageHeight = doc.page.height;
    const bottomMargin = 60;

    doc.font('Helvetica').fontSize(8);

    subjects.forEach((subject) => {
      if (y > pageHeight - bottomMargin) {
        doc.addPage();
        y = 30;
        doc.font('Helvetica-Bold').fontSize(9);
        doc.text('Code', cols.code, y);
        doc.text('Name', cols.name, y);
        doc.text('Class', cols.class, y);
        doc.text('Teacher', cols.teacher, y);
        doc.moveTo(30, y + 15).lineTo(550, y + 15).stroke();
        y += 20;
        doc.font('Helvetica').fontSize(8);
      }

      doc.text(subject.code, cols.code, y);
      doc.text(subject.name, cols.name, y, { width: 80, ellipsis: true });
      doc.text(subject.class ? `${subject.class.name}-${subject.class.section}` : 'N/A', cols.class, y);
      doc.text(subject.teacher?.user?.name || 'Unassigned', cols.teacher, y, { width: 100, ellipsis: true });

      y += 15;
    });

    doc.fontSize(8).text(`Total Subjects: ${subjects.length}`, 30, pageHeight - 30, { align: 'left' });

    await logActivity('export', 'Subject', null, req.user._id, `${subjects.length} subjects exported to PDF`);

    doc.end();
  } catch (error) {
    next(error);
  }
};

module.exports = { 
  getSubjects, 
  getSubject, 
  createSubject, 
  updateSubject, 
  deleteSubject,
  exportSubjectsCSV,
  exportSubjectsPDF,
};
