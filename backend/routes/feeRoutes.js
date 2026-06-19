const {
  getFees, createFee, recordPayment, getReceipt, getMonthlyReport,
  getFeeStructures, createFeeStructure,
} = require('../controllers/feeController');
const { protect, authorize } = require('../middleware/auth');
const validate = require('../middleware/validate');
const { feeValidation, feeStructureValidation } = require('../validators');

const router = require('express').Router();

router.use(protect);

router.get('/report/monthly', authorize('admin'), getMonthlyReport);
router.get('/structures', authorize('admin'), getFeeStructures);
router.post('/structures', authorize('admin'), feeStructureValidation, validate, createFeeStructure);

router.route('/')
  .get(authorize('admin'), getFees)
  .post(authorize('admin'), feeValidation, validate, createFee);

router.put('/:id/pay', authorize('admin'), recordPayment);
router.get('/:id/receipt', authorize('admin'), getReceipt);

module.exports = router;
