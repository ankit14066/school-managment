const {
  getStudents, getStudent, getStudentProfileSummary, createStudent, updateStudent, deleteStudent,
  bulkDeleteStudents, getNextRollNumber, bulkImportStudents, exportStudentsCSV, exportStudentsPDF,
} = require('../controllers/studentController');
const { protect, authorize } = require('../middleware/auth');
const validate = require('../middleware/validate');
const { studentUpload, csvUpload } = require('../middleware/upload');
const { studentValidation } = require('../validators');

const router = require('express').Router();

router.use(protect);

router.route('/')
  .get(authorize('admin', 'teacher'), getStudents)
  .post(authorize('admin'), studentUpload.single('photo'), studentValidation, validate, createStudent);

router.post('/bulk-delete', authorize('admin'), bulkDeleteStudents);
router.get('/next-roll', authorize('admin'), getNextRollNumber);
router.get('/:id/profile-summary', authorize('admin', 'teacher'), getStudentProfileSummary);

router.route('/:id')
  .get(authorize('admin', 'teacher'), getStudent)
  .put(authorize('admin'), studentUpload.single('photo'), validate, updateStudent)
  .delete(authorize('admin'), deleteStudent);

// Bulk import endpoint
router.post('/import/bulk', authorize('admin'), csvUpload.single('csv'), bulkImportStudents);

// Export endpoints
router.get('/export/csv', authorize('admin', 'teacher'), exportStudentsCSV);
router.get('/export/pdf', authorize('admin', 'teacher'), exportStudentsPDF);

module.exports = router;
