const {
  getTimetable, createTimetableEntry, bulkCreateTimetable, deleteTimetableEntry, exportTimetableCSV, exportTimetablePDF,
} = require('../controllers/timetableController');
const { protect, authorize } = require('../middleware/auth');

const router = require('express').Router();

router.use(protect);

router.get('/', getTimetable);
router.post('/', authorize('admin'), createTimetableEntry);
router.post('/bulk', authorize('admin'), bulkCreateTimetable);
router.delete('/:id', authorize('admin'), deleteTimetableEntry);

// Export endpoints
router.get('/export/csv', authorize('admin'), exportTimetableCSV);
router.get('/export/pdf', authorize('admin'), exportTimetablePDF);

module.exports = router;
