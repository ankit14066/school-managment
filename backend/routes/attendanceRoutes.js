const {
  markAttendance, getAttendance, getStudentReport, getTodaySummary, getClassStudentsForAttendance,
} = require('../controllers/attendanceController');
const { protect, authorize } = require('../middleware/auth');
const validate = require('../middleware/validate');
const { attendanceValidation } = require('../validators');

const router = require('express').Router();

router.use(protect);

router.route('/')
  .get(authorize('admin', 'teacher'), getAttendance)
  .post(authorize('admin', 'teacher'), attendanceValidation, validate, markAttendance);

router.get('/summary/today', authorize('admin'), getTodaySummary);
router.get('/report/:studentId', authorize('admin', 'teacher', 'student'), getStudentReport);
router.get('/class/:classId/students', authorize('admin', 'teacher'), getClassStudentsForAttendance);

module.exports = router;
