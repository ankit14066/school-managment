const Fee = require('../models/Fee');
const FeeStructure = require('../models/FeeStructure');
const Student = require('../models/Student');
const { getPagination, paginatedResponse } = require('../utils/pagination');
const { generateReceiptNumber } = require('../utils/receiptGenerator');
const logActivity = require('../utils/activityLogger');

// @desc    Get all fees
// @route   GET /api/fees
const getFees = async (req, res, next) => {
  try {
    const { student, status, month, academicYear, page, limit } = req.query;
    const { page: pageNum, limit: limitNum, skip } = getPagination(page, limit);
    const query = {};

    if (student) query.student = student;
    if (status) query.status = status;
    if (month) query.month = month;
    if (academicYear) query.academicYear = academicYear;

    const total = await Fee.countDocuments(query);
    const fees = await Fee.find(query)
      .populate({ path: 'student', populate: [{ path: 'user', select: 'name email' }, { path: 'class', select: 'name section' }] })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limitNum);

    res.json(paginatedResponse(fees, total, pageNum, limitNum));
  } catch (error) {
    next(error);
  }
};

// @desc    Create fee record
// @route   POST /api/fees
const createFee = async (req, res, next) => {
  try {
    const fee = await Fee.create({ ...req.body, createdBy: req.user._id });
    const populated = await Fee.findById(fee._id)
      .populate({ path: 'student', populate: { path: 'user', select: 'name' } });

    await logActivity('created', 'Fee', fee._id, req.user._id, `Fee record created`);
    res.status(201).json({ success: true, message: 'Fee record created', data: populated });
  } catch (error) {
    next(error);
  }
};

// @desc    Record fee payment
// @route   PUT /api/fees/:id/pay
const recordPayment = async (req, res, next) => {
  try {
    const { paidAmount, paymentMethod, remarks } = req.body;
    const fee = await Fee.findById(req.params.id);

    if (!fee) {
      return res.status(404).json({ success: false, message: 'Fee record not found' });
    }

    fee.paidAmount = (fee.paidAmount || 0) + parseFloat(paidAmount);
    fee.paymentMethod = paymentMethod || fee.paymentMethod;
    fee.paymentDate = new Date();
    fee.remarks = remarks || fee.remarks;

    if (!fee.receiptNumber && fee.paidAmount > 0) {
      fee.receiptNumber = generateReceiptNumber();
    }

    await fee.save();

    const populated = await Fee.findById(fee._id)
      .populate({ path: 'student', populate: [{ path: 'user', select: 'name email' }, { path: 'class', select: 'name section' }] });

    await logActivity('paid', 'Fee', fee._id, req.user._id, `Payment of ${paidAmount} recorded`);

    res.json({ success: true, message: 'Payment recorded successfully', data: populated });
  } catch (error) {
    next(error);
  }
};

// @desc    Get fee receipt
// @route   GET /api/fees/:id/receipt
const getReceipt = async (req, res, next) => {
  try {
    const fee = await Fee.findById(req.params.id)
      .populate({ path: 'student', populate: [{ path: 'user', select: 'name email' }, { path: 'class', select: 'name section' }] });

    if (!fee) {
      return res.status(404).json({ success: false, message: 'Fee record not found' });
    }

    res.json({
      success: true,
      data: {
        receiptNumber: fee.receiptNumber,
        studentName: fee.student?.user?.name,
        rollNumber: fee.student?.rollNumber,
        class: fee.student?.class ? `Class ${fee.student.class.name}-${fee.student.class.section}` : '',
        amount: fee.amount,
        paidAmount: fee.paidAmount,
        dueAmount: fee.amount - fee.paidAmount,
        type: fee.type,
        month: fee.month,
        academicYear: fee.academicYear,
        paymentDate: fee.paymentDate,
        paymentMethod: fee.paymentMethod,
        status: fee.status,
      },
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Monthly collection report
// @route   GET /api/fees/report/monthly
const getMonthlyReport = async (req, res, next) => {
  try {
    const { month, academicYear } = req.query;
    const query = {};
    if (month) query.month = month;
    if (academicYear) query.academicYear = academicYear;

    const fees = await Fee.find(query);
    const totalDue = fees.reduce((sum, f) => sum + f.amount, 0);
    const totalCollected = fees.reduce((sum, f) => sum + f.paidAmount, 0);
    const pending = fees.filter((f) => f.status === 'pending').length;
    const paid = fees.filter((f) => f.status === 'paid').length;
    const partial = fees.filter((f) => f.status === 'partial').length;

    res.json({
      success: true,
      data: { totalDue, totalCollected, pendingAmount: totalDue - totalCollected, pending, paid, partial, totalRecords: fees.length },
    });
  } catch (error) {
    next(error);
  }
};

// --- Fee Structure ---

const getFeeStructures = async (req, res, next) => {
  try {
    const structures = await FeeStructure.find()
      .populate('class', 'name section academicYear');
    res.json({ success: true, data: structures });
  } catch (error) {
    next(error);
  }
};

const createFeeStructure = async (req, res, next) => {
  try {
    const structure = await FeeStructure.findOneAndUpdate(
      { class: req.body.class },
      { ...req.body, createdBy: req.user._id },
      { upsert: true, new: true, runValidators: true }
    );
    const populated = await FeeStructure.findById(structure._id).populate('class', 'name section');
    res.status(201).json({ success: true, message: 'Fee structure saved', data: populated });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getFees,
  createFee,
  recordPayment,
  getReceipt,
  getMonthlyReport,
  getFeeStructures,
  createFeeStructure,
};
