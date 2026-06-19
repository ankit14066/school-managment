const Timetable = require('../models/Timetable');
const Teacher = require('../models/Teacher');
const Student = require('../models/Student');
const Parent = require('../models/Parent');
const { getPagination, paginatedResponse } = require('../utils/pagination');
const logActivity = require('../utils/activityLogger');
const PDFDocument = require('pdfkit');
const { createObjectCsvWriter } = require('csv-writer');
const fs = require('fs');

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

    // If admin with no class selected, show all timetables
    if (req.user.role === 'admin' && !targetClass) {
      const entries = await Timetable.find({ academicYear: academicYear || '2025-2026' })
        .populate('class', 'name section')
        .populate('subject', 'name code')
        .populate({ path: 'teacher', populate: { path: 'user', select: 'name' } })
        .sort({ class: 1, day: 1, period: 1 });
      return res.json({ success: true, data: groupByDay(entries) });
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

// @desc    Export timetable to CSV
// @route   GET /api/timetable/export/csv
const exportTimetableCSV = async (req, res, next) => {
  try {
    const { class: classId, academicYear } = req.query;

    const query = { academicYear: academicYear || '2025-2026' };
    if (classId) query.class = classId;

    const entries = await Timetable.find(query)
      .populate('class', 'name section')
      .populate('subject', 'name code')
      .populate({ path: 'teacher', populate: { path: 'user', select: 'name' } })
      .sort({ class: 1, day: 1, period: 1 });

    if (entries.length === 0) {
      return res.status(400).json({ success: false, message: 'No timetable entries found' });
    }

    const csvData = entries.map((entry) => ({
      'Day': entry.day,
      'Period': entry.period,
      'Subject': entry.subject?.name || 'N/A',
      'Subject Code': entry.subject?.code || 'N/A',
      'Teacher': entry.teacher?.user?.name || 'TBA',
      'Start Time': entry.startTime,
      'End Time': entry.endTime,
      'Class': `${entry.class?.name}-${entry.class?.section}`,
    }));

    const csvPath = `/uploads/temp/timetable-${Date.now()}.csv`;
    const csvFilePath = `${process.cwd()}${csvPath}`;

    const writer = createObjectCsvWriter({
      path: csvFilePath,
      header: [
        { id: 'Day', title: 'Day' },
        { id: 'Period', title: 'Period' },
        { id: 'Subject', title: 'Subject' },
        { id: 'Subject Code', title: 'Subject Code' },
        { id: 'Teacher', title: 'Teacher' },
        { id: 'Start Time', title: 'Start Time' },
        { id: 'End Time', title: 'End Time' },
        { id: 'Class', title: 'Class' },
      ],
    });

    await writer.writeRecords(csvData);

    res.download(csvFilePath, `timetable-${Date.now()}.csv`, (err) => {
      if (err) console.error('Download error:', err);
      fs.unlink(csvFilePath, (error) => {
        if (error) console.error('File cleanup error:', error);
      });
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Export timetable to PDF
// @route   GET /api/timetable/export/pdf
const exportTimetablePDF = async (req, res, next) => {
  try {
    const { class: classId, academicYear } = req.query;

    const query = { academicYear: academicYear || '2025-2026' };
    if (classId) query.class = classId;

    const entries = await Timetable.find(query)
      .populate('class', 'name section')
      .populate('subject', 'name code')
      .populate({ path: 'teacher', populate: { path: 'user', select: 'name' } })
      .sort({ class: 1, day: 1, period: 1 });

    if (entries.length === 0) {
      return res.status(400).json({ success: false, message: 'No timetable entries found' });
    }

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="timetable-${Date.now()}.pdf"`);

    const doc = new PDFDocument({ margin: 20, size: 'A4', landscape: true });
    doc.pipe(res);

    doc.fontSize(18).font('Helvetica-Bold').text('SCHOOL MANAGEMENT SYSTEM', { align: 'center' });
    if (classId) {
      const classInfo = entries[0].class;
      doc.fontSize(14).text(`Class Timetable - ${classInfo.name}-${classInfo.section}`, { align: 'center' });
    } else {
      doc.fontSize(14).text('All Classes Timetable', { align: 'center' });
    }
    doc.fontSize(10).text(`Academic Year: ${academicYear || '2025-2026'}`, { align: 'center' });
    doc.fontSize(9).text(`Generated on: ${new Date().toLocaleDateString()}`, { align: 'center' });
    doc.moveDown();

    const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    
    if (classId) {
      // Single class timetable - grouped by day
      const groupedByDay = {};
      DAYS.forEach((d) => { groupedByDay[d] = []; });
      entries.forEach((e) => {
        if (groupedByDay[e.day]) groupedByDay[e.day].push(e);
      });

      DAYS.forEach((day) => {
        if (groupedByDay[day].length === 0) return;

        if (doc.y > 400) doc.addPage();

        doc.fontSize(11).font('Helvetica-Bold').text(day, 20, doc.y);
        doc.moveDown(0.5);

        const tableTop = doc.y;
        const cols = { period: 50, subject: 130, teacher: 140, time: 140 };

        doc.fontSize(9).font('Helvetica-Bold');
        doc.text('Period', cols.period, tableTop);
        doc.text('Subject', cols.subject, tableTop);
        doc.text('Teacher', cols.teacher, tableTop);
        doc.text('Time', cols.time, tableTop);

        doc.moveTo(20, tableTop + 15).lineTo(760, tableTop + 15).stroke();

        let y = tableTop + 20;
        doc.font('Helvetica').fontSize(8);

        groupedByDay[day].forEach((entry) => {
          doc.text(entry.period.toString(), cols.period, y);
          doc.text(entry.subject?.name || 'N/A', cols.subject, y, { width: 100, ellipsis: true });
          doc.text(entry.teacher?.user?.name || 'TBA', cols.teacher, y, { width: 100, ellipsis: true });
          doc.text(`${entry.startTime} - ${entry.endTime}`, cols.time, y, { width: 80, ellipsis: true });
          y += 15;
        });

        doc.moveDown(1);
      });
    } else {
      // All classes timetable - grouped by class then day
      const groupedByClass = {};
      entries.forEach((e) => {
        const classKey = `${e.class.name}-${e.class.section}`;
        if (!groupedByClass[classKey]) groupedByClass[classKey] = {};
        DAYS.forEach((d) => {
          if (!groupedByClass[classKey][d]) groupedByClass[classKey][d] = [];
        });
        if (groupedByClass[classKey][e.day]) groupedByClass[classKey][e.day].push(e);
      });

      Object.keys(groupedByClass).sort().forEach((className) => {
        if (doc.y > 350) doc.addPage();

        doc.fontSize(12).font('Helvetica-Bold').text(`${className}`, 20, doc.y);
        doc.moveDown(0.5);

        const daysToShow = DAYS.filter((d) => groupedByClass[className][d].length > 0);

        daysToShow.forEach((day) => {
          if (doc.y > 400) doc.addPage();

          doc.fontSize(10).font('Helvetica-Bold').text(day, 20, doc.y);
          doc.moveDown(0.3);

          const tableTop = doc.y;
          const cols = { period: 60, subject: 140, teacher: 140, time: 130 };

          doc.fontSize(8).font('Helvetica-Bold');
          doc.text('Period', cols.period, tableTop);
          doc.text('Subject', cols.subject, tableTop);
          doc.text('Teacher', cols.teacher, tableTop);
          doc.text('Time', cols.time, tableTop);

          doc.moveTo(20, tableTop + 12).lineTo(760, tableTop + 12).stroke();

          let y = tableTop + 15;
          doc.font('Helvetica').fontSize(7);

          groupedByClass[className][day].forEach((entry) => {
            doc.text(entry.period.toString(), cols.period, y);
            doc.text(entry.subject?.name || 'N/A', cols.subject, y, { width: 90, ellipsis: true });
            doc.text(entry.teacher?.user?.name || 'TBA', cols.teacher, y, { width: 90, ellipsis: true });
            doc.text(`${entry.startTime}-${entry.endTime}`, cols.time, y, { width: 70, ellipsis: true });
            y += 12;
          });

          doc.moveDown(0.8);
        });

        doc.moveDown(0.5);
      });
    }

    doc.fontSize(8).text(`Total Entries: ${entries.length}`, 20, doc.page.height - 30, { align: 'left' });

    doc.end();
  } catch (error) {
    next(error);
  }
};

module.exports = { 
  getTimetable, 
  createTimetableEntry, 
  bulkCreateTimetable, 
  deleteTimetableEntry,
  exportTimetableCSV,
  exportTimetablePDF,
};
