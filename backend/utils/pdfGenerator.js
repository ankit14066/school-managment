const PDFDocument = require('pdfkit');

const sendPdf = (res, filename) => {
  res.setHeader('Content-Type', 'application/pdf');
  res.setHeader('Content-Disposition', `inline; filename="${filename}"`);
  const doc = new PDFDocument({ margin: 50 });
  doc.pipe(res);
  return doc;
};

const generateMarksheetPdf = (res, data) => {
  const doc = sendPdf(res, `marksheet-${data.rollNumber}.pdf`);

  doc.fontSize(20).text('SCHOOL MANAGEMENT SYSTEM', { align: 'center' });
  doc.fontSize(14).text('Student Marksheet', { align: 'center' });
  doc.moveDown();

  doc.fontSize(11);
  doc.text(`Name: ${data.name}`);
  doc.text(`Roll Number: ${data.rollNumber}`);
  doc.text(`Class: ${data.className}`);
  doc.text(`Academic Year: ${data.academicYear || 'N/A'}`);
  doc.moveDown();

  const tableTop = doc.y;
  doc.font('Helvetica-Bold');
  doc.text('Subject', 50, tableTop);
  doc.text('Exam', 200, tableTop);
  doc.text('Marks', 320, tableTop);
  doc.text('Grade', 420, tableTop);
  doc.font('Helvetica');

  let y = tableTop + 20;
  data.results.forEach((r) => {
    doc.text(r.subject, 50, y);
    doc.text(r.exam, 200, y);
    doc.text(`${r.marksObtained}/${r.maxMarks}`, 320, y);
    doc.text(r.grade, 420, y);
    y += 18;
  });

  doc.moveDown(2);
  doc.font('Helvetica-Bold');
  doc.text(`Total: ${data.totalMarks}/${data.maxMarks}`);
  doc.text(`Percentage: ${data.percentage}%`);
  doc.text(`Overall Grade: ${data.overallGrade}`);
  if (data.remarks) doc.text(`Remarks: ${data.remarks}`);

  doc.end();
};

const generateAttendancePdf = (res, data) => {
  const doc = sendPdf(res, `attendance-${data.rollNumber}.pdf`);

  doc.fontSize(18).text('Attendance Report', { align: 'center' });
  doc.moveDown();
  doc.fontSize(11);
  doc.text(`Student: ${data.name}`);
  doc.text(`Roll Number: ${data.rollNumber}`);
  doc.text(`Class: ${data.className}`);
  doc.text(`Month: ${data.month}`);
  doc.moveDown();

  doc.text(`Total Days: ${data.total} | Present: ${data.present} | Absent: ${data.absent} | Late: ${data.late}`);
  doc.text(`Attendance Percentage: ${data.percentage}%`);
  doc.moveDown();

  data.records.forEach((r) => {
    doc.text(`${new Date(r.date).toLocaleDateString()} — ${r.status}`);
  });

  doc.end();
};

const generateFeeReceiptPdf = (res, data) => {
  const doc = sendPdf(res, `receipt-${data.receiptNumber}.pdf`);

  doc.fontSize(20).text('FEE RECEIPT', { align: 'center' });
  doc.moveDown();
  doc.fontSize(11);
  doc.text(`Receipt No: ${data.receiptNumber}`);
  doc.text(`Date: ${data.paymentDate ? new Date(data.paymentDate).toLocaleDateString() : 'N/A'}`);
  doc.moveDown();
  doc.text(`Student: ${data.studentName}`);
  doc.text(`Class: ${data.class}`);
  doc.text(`Fee Type: ${data.type}`);
  doc.text(`Month: ${data.month} (${data.academicYear})`);
  doc.moveDown();
  doc.font('Helvetica-Bold');
  doc.text(`Amount: Rs. ${data.amount}`);
  doc.text(`Paid: Rs. ${data.paidAmount}`);
  doc.text(`Due: Rs. ${data.dueAmount}`);
  doc.font('Helvetica');
  doc.text(`Payment Method: ${data.paymentMethod || 'N/A'}`);
  doc.text(`Status: ${data.status}`);

  doc.end();
};

module.exports = { generateMarksheetPdf, generateAttendancePdf, generateFeeReceiptPdf };
