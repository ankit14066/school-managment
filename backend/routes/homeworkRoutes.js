const { getHomework, createHomework, submitHomework, getSubmissions } = require('../controllers/homeworkController');
const { protect, authorize } = require('../middleware/auth');
const { homeworkUpload } = require('../middleware/upload');

const router = require('express').Router();

router.use(protect);

router.route('/')
  .get(getHomework)
  .post(authorize('admin', 'teacher'), homeworkUpload.single('attachment'), createHomework);

router.put('/:id/submit', authorize('student', 'parent'), submitHomework);
router.get('/:id/submissions', authorize('admin', 'teacher'), getSubmissions);

module.exports = router;
