const {
  getMarksheet, getAttendanceReport, getFeeReceiptPdf,
} = require('../controllers/reportController');
const { protect, authorize } = require('../middleware/auth');

const router = require('express').Router();

router.use(protect);

router.get('/marksheet/:studentId', authorize('admin', 'teacher', 'student', 'parent'), getMarksheet);
router.get('/attendance/:studentId', authorize('admin', 'teacher', 'student', 'parent'), getAttendanceReport);
router.get('/fee-receipt/:feeId', authorize('admin'), getFeeReceiptPdf);

module.exports = router;
