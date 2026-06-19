const {
  getDashboardStats, getTeacherDashboard, getStudentDashboard,
} = require('../controllers/dashboardController');
const { protect, authorize } = require('../middleware/auth');

const router = require('express').Router();

router.use(protect);

router.get('/stats', authorize('admin'), getDashboardStats);
router.get('/teacher', authorize('teacher'), getTeacherDashboard);
router.get('/student', authorize('student'), getStudentDashboard);

module.exports = router;
