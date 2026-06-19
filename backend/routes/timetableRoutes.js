const {
  getTimetable, createTimetableEntry, bulkCreateTimetable, deleteTimetableEntry,
} = require('../controllers/timetableController');
const { protect, authorize } = require('../middleware/auth');

const router = require('express').Router();

router.use(protect);

router.get('/', getTimetable);
router.post('/', authorize('admin'), createTimetableEntry);
router.post('/bulk', authorize('admin'), bulkCreateTimetable);
router.delete('/:id', authorize('admin'), deleteTimetableEntry);

module.exports = router;
