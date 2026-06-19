const {
  getSubjects, getSubject, createSubject, updateSubject, deleteSubject, exportSubjectsCSV, exportSubjectsPDF,
} = require('../controllers/subjectController');
const { protect, authorize } = require('../middleware/auth');
const validate = require('../middleware/validate');
const { subjectValidation } = require('../validators');

const router = require('express').Router();

router.use(protect);

router.route('/')
  .get(getSubjects)
  .post(authorize('admin'), subjectValidation, validate, createSubject);

router.route('/:id')
  .get(getSubject)
  .put(authorize('admin'), validate, updateSubject)
  .delete(authorize('admin'), deleteSubject);

// Export endpoints
router.get('/export/csv', authorize('admin'), exportSubjectsCSV);
router.get('/export/pdf', authorize('admin'), exportSubjectsPDF);

module.exports = router;
