const Message = require('../models/Message');
const User = require('../models/User');
const Parent = require('../models/Parent');
const Student = require('../models/Student');
const Teacher = require('../models/Teacher');
const { getPagination, paginatedResponse } = require('../utils/pagination');

const getInbox = async (req, res, next) => {
  try {
    const { page, limit, folder } = req.query;
    const { page: pageNum, limit: limitNum, skip } = getPagination(page, limit);

    const query = folder === 'sent'
      ? { from: req.user._id }
      : { to: req.user._id };

    const total = await Message.countDocuments(query);
    const messages = await Message.find(query)
      .populate('from', 'name email role')
      .populate('to', 'name email role')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limitNum);

    const unreadCount = await Message.countDocuments({ to: req.user._id, isRead: false });

    res.json({ ...paginatedResponse(messages, total, pageNum, limitNum), unreadCount });
  } catch (error) {
    next(error);
  }
};

const sendMessage = async (req, res, next) => {
  try {
    const { to, subject, body, relatedStudent } = req.body;

    const message = await Message.create({
      from: req.user._id,
      to,
      subject,
      body,
      relatedStudent,
    });

    const populated = await Message.findById(message._id)
      .populate('from', 'name')
      .populate('to', 'name');

    res.status(201).json({ success: true, data: populated });
  } catch (error) {
    next(error);
  }
};

const broadcastMessage = async (req, res, next) => {
  try {
    const { targetRole, subject, body } = req.body;
    const users = await User.find({ role: targetRole, isActive: true });

    const messages = await Message.insertMany(
      users.map((u) => ({
        from: req.user._id,
        to: u._id,
        subject,
        body,
        isBroadcast: true,
      }))
    );

    res.status(201).json({ success: true, message: `Sent to ${messages.length} users` });
  } catch (error) {
    next(error);
  }
};

const markMessageRead = async (req, res, next) => {
  try {
    await Message.findOneAndUpdate(
      { _id: req.params.id, to: req.user._id },
      { isRead: true }
    );
    res.json({ success: true, message: 'Marked as read' });
  } catch (error) {
    next(error);
  }
};

// Teacher sends message to parent of a student
const sendToParent = async (req, res, next) => {
  try {
    const { studentId, subject, body } = req.body;
    const parent = await Parent.findOne({ linkedStudent: studentId });
    if (!parent) return res.status(404).json({ success: false, message: 'Parent not found for this student' });

    const message = await Message.create({
      from: req.user._id,
      to: parent.user,
      subject,
      body,
      relatedStudent: studentId,
    });

    res.status(201).json({ success: true, data: message });
  } catch (error) {
    next(error);
  }
};

module.exports = { getInbox, sendMessage, broadcastMessage, markMessageRead, sendToParent };
