const { getParentDashboard, getChildAttendance } = require('../controllers/parentController');
const { protect, authorize } = require('../middleware/auth');

const router = require('express').Router();

router.use(protect);
router.use(authorize('parent'));

router.get('/dashboard', getParentDashboard);
router.get('/attendance', getChildAttendance);

module.exports = router;
