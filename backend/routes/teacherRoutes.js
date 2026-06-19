const {
  getTeachers, getTeacher, createTeacher, updateTeacher, deleteTeacher, exportTeachersCSV, exportTeachersPDF,
} = require('../controllers/teacherController');
const { protect, authorize } = require('../middleware/auth');
const validate = require('../middleware/validate');
const { teacherValidation } = require('../validators');

const router = require('express').Router();

router.use(protect);

router.route('/')
  .get(authorize('admin'), getTeachers)
  .post(authorize('admin'), teacherValidation, validate, createTeacher);

router.route('/:id')
  .get(authorize('admin'), getTeacher)
  .put(authorize('admin'), validate, updateTeacher)
  .delete(authorize('admin'), deleteTeacher);

// Export endpoints
router.get('/export/csv', authorize('admin'), exportTeachersCSV);
router.get('/export/pdf', authorize('admin'), exportTeachersPDF);

module.exports = router;
