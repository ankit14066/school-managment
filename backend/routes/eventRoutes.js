const { getEvents, createEvent, deleteEvent } = require('../controllers/eventController');
const { protect, authorize } = require('../middleware/auth');

const router = require('express').Router();

router.use(protect);

router.route('/')
  .get(getEvents)
  .post(authorize('admin'), createEvent);

router.delete('/:id', authorize('admin'), deleteEvent);

module.exports = router;
