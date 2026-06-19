const {
  getTeachers, getTeacher, createTeacher, updateTeacher, deleteTeacher,
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

module.exports = router;
