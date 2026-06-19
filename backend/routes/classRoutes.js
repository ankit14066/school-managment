const {
  getClasses, getClass, createClass, updateClass, deleteClass,
} = require('../controllers/classController');
const { protect, authorize } = require('../middleware/auth');
const validate = require('../middleware/validate');
const { classValidation } = require('../validators');

const router = require('express').Router();

router.use(protect);

router.route('/')
  .get(getClasses)
  .post(authorize('admin'), classValidation, validate, createClass);

router.route('/:id')
  .get(getClass)
  .put(authorize('admin'), validate, updateClass)
  .delete(authorize('admin'), deleteClass);

module.exports = router;
