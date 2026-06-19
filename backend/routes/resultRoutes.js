const {
  getExams, createExam, getResults, createResult, bulkEnterResults, getStudentResultSummary,
} = require('../controllers/resultController');
const { protect, authorize } = require('../middleware/auth');
const validate = require('../middleware/validate');
const { examValidation, resultValidation } = require('../validators');

const router = require('express').Router();

router.use(protect);

router.get('/exams', authorize('admin', 'teacher'), getExams);
router.post('/exams', authorize('admin', 'teacher'), examValidation, validate, createExam);

router.get('/summary/:studentId', authorize('admin', 'teacher', 'student'), getStudentResultSummary);
router.post('/bulk', authorize('admin', 'teacher'), bulkEnterResults);

router.route('/')
  .get(authorize('admin', 'teacher', 'student'), getResults)
  .post(authorize('admin', 'teacher'), resultValidation, validate, createResult);

module.exports = router;
