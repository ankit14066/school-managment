const {
  getInbox, sendMessage, broadcastMessage, markMessageRead, sendToParent,
} = require('../controllers/messageController');
const { protect, authorize } = require('../middleware/auth');

const router = require('express').Router();

router.use(protect);

router.get('/', getInbox);
router.post('/', sendMessage);
router.post('/broadcast', authorize('admin'), broadcastMessage);
router.post('/to-parent', authorize('teacher'), sendToParent);
router.put('/:id/read', markMessageRead);

module.exports = router;
