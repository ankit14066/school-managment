const router = require('express').Router();
const { protect, authorize } = require('../middleware/auth');
const { ticketUpload } = require('../middleware/upload');
const {
  createTicket,
  getTickets,
  getTicketById,
  updateTicket,
} = require('../controllers/ticketController');

router.use(protect);

router.route('/')
  .post(ticketUpload.single('screenshot'), createTicket)
  .get(authorize('developer'), getTickets);

router.route('/:id')
  .get(getTicketById)
  .put(authorize('developer'), updateTicket);

module.exports = router;
