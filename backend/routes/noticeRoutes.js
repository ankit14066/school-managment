const { getNotices, createNotice, markAsRead, deleteNotice } = require('../controllers/noticeController');
const { protect, authorize } = require('../middleware/auth');
const { noticeUpload } = require('../middleware/upload');

const router = require('express').Router();

router.use(protect);

router.route('/')
  .get(getNotices)
  .post(authorize('admin'), noticeUpload.array('attachments', 5), createNotice);

router.put('/:id/read', markAsRead);
router.delete('/:id', authorize('admin'), deleteNotice);

module.exports = router;
