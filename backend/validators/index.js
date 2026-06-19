const { body } = require('express-validator');

const loginValidation = [
  body('email').isEmail().withMessage('Valid email is required'),
  body('password').notEmpty().withMessage('Password is required'),
];

const studentValidation = [
  body('name').trim().notEmpty().withMessage('Name is required'),
  body('email').isEmail().withMessage('Valid email is required'),
  body('rollNumber').trim().notEmpty().withMessage('Roll number is required'),
  body('class').notEmpty().withMessage('Class is required'),
  body('dateOfBirth').isISO8601().withMessage('Valid date of birth is required'),
  body('parentName').trim().notEmpty().withMessage('Parent name is required'),
  body('phone').trim().notEmpty().withMessage('Phone is required'),
];

const teacherValidation = [
  body('name').trim().notEmpty().withMessage('Name is required'),
  body('email').isEmail().withMessage('Valid email is required'),
  body('employeeId').trim().notEmpty().withMessage('Employee ID is required'),
  body('phone').trim().notEmpty().withMessage('Phone is required'),
];

const classValidation = [
  body('name').isIn(['1', '2', '3', '4', '5', '6', '7', '8', '9', '10', '11', '12']).withMessage('Class must be 1-12'),
  body('section').isIn(['A', 'B', 'C']).withMessage('Section must be A, B, or C'),
  body('academicYear').trim().notEmpty().withMessage('Academic year is required'),
];

const subjectValidation = [
  body('name').trim().notEmpty().withMessage('Subject name is required'),
  body('code').trim().notEmpty().withMessage('Subject code is required'),
  body('class').notEmpty().withMessage('Class is required'),
];

const attendanceValidation = [
  body('class').notEmpty().withMessage('Class is required'),
  body('date').isISO8601().withMessage('Valid date is required'),
  body('records').isArray({ min: 1 }).withMessage('Attendance records are required'),
  body('records.*.student').notEmpty().withMessage('Student ID is required'),
  body('records.*.status').isIn(['present', 'absent', 'late']).withMessage('Invalid status'),
];

const feeValidation = [
  body('student').notEmpty().withMessage('Student is required'),
  body('amount').isFloat({ min: 0 }).withMessage('Valid amount is required'),
  body('type').isIn(['tuition', 'transport', 'misc', 'combined']).withMessage('Invalid fee type'),
  body('dueDate').isISO8601().withMessage('Valid due date is required'),
  body('academicYear').trim().notEmpty().withMessage('Academic year is required'),
  body('month').trim().notEmpty().withMessage('Month is required'),
];

const feeStructureValidation = [
  body('class').notEmpty().withMessage('Class is required'),
  body('tuition').isFloat({ min: 0 }).withMessage('Valid tuition amount is required'),
  body('academicYear').trim().notEmpty().withMessage('Academic year is required'),
];

const examValidation = [
  body('name').isIn(['Mid-term', 'Final', 'Unit Test', 'Quarterly']).withMessage('Invalid exam name'),
  body('class').notEmpty().withMessage('Class is required'),
  body('subject').notEmpty().withMessage('Subject is required'),
  body('maxMarks').isInt({ min: 1 }).withMessage('Max marks must be at least 1'),
  body('date').isISO8601().withMessage('Valid date is required'),
  body('academicYear').trim().notEmpty().withMessage('Academic year is required'),
];

const resultValidation = [
  body('student').notEmpty().withMessage('Student is required'),
  body('exam').notEmpty().withMessage('Exam is required'),
  body('marksObtained').isFloat({ min: 0 }).withMessage('Valid marks are required'),
];

module.exports = {
  loginValidation,
  studentValidation,
  teacherValidation,
  classValidation,
  subjectValidation,
  attendanceValidation,
  feeValidation,
  feeStructureValidation,
  examValidation,
  resultValidation,
};
