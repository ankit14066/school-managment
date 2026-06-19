const Notice = require('../models/Notice');
const Student = require('../models/Student');
const Parent = require('../models/Parent');
const { getPagination, paginatedResponse } = require('../utils/pagination');
const logActivity = require('../utils/activityLogger');

const getAudienceFilter = async (user) => {
  const today = new Date();
  const base = {
    isActive: true,
    $or: [{ expiryDate: { $gte: today } }, { expiryDate: null }],
  };

  if (user.role === 'admin') return base;

  const audienceMap = {
    teacher: ['all', 'teachers'],
    student: ['all', 'students'],
    parent: ['all', 'parents'],
  };

  const audiences = audienceMap[user.role] || ['all'];
  const filter = { ...base, targetAudience: { $in: audiences } };

  if (user.role === 'student') {
    const student = await Student.findOne({ user: user._id });
    if (student) {
      return {
        isActive: true,
        $and: [
          { $or: [{ expiryDate: { $gte: today } }, { expiryDate: null }] },
          { $or: [
            { targetAudience: { $in: audiences } },
            { targetAudience: 'class', targetClass: student.class },
          ]},
        ],
      };
    }
  }

  if (user.role === 'parent') {
    const parent = await Parent.findOne({ user: user._id });
    if (parent) {
      const student = await Student.findById(parent.linkedStudent);
      if (student) {
        return {
          isActive: true,
          $and: [
            { $or: [{ expiryDate: { $gte: today } }, { expiryDate: null }] },
            { $or: [
              { targetAudience: { $in: audiences } },
              { targetAudience: 'class', targetClass: student.class },
            ]},
          ],
        };
      }
    }
  }

  return filter;
};

const getNotices = async (req, res, next) => {
  try {
    const { page, limit } = req.query;
    const { page: pageNum, limit: limitNum, skip } = getPagination(page, limit);
    const filter = await getAudienceFilter(req.user);

    const total = await Notice.countDocuments(filter);
    const notices = await Notice.find(filter)
      .populate('postedBy', 'name role')
      .populate('targetClass', 'name section')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limitNum);

    const data = notices.map((n) => ({
      ...n.toObject(),
      isRead: n.readBy.some((r) => r.user.toString() === req.user._id.toString()),
    }));

    res.json(paginatedResponse(data, total, pageNum, limitNum));
  } catch (error) {
    next(error);
  }
};

const createNotice = async (req, res, next) => {
  try {
    const attachments = req.files ? req.files.map((f) => `/uploads/notices/${f.filename}`) : [];
    const notice = await Notice.create({
      ...req.body,
      postedBy: req.user._id,
      attachments,
    });

    const populated = await Notice.findById(notice._id).populate('postedBy', 'name');
    await logActivity('posted', 'Notice', notice._id, req.user._id, notice.title);
    res.status(201).json({ success: true, message: 'Notice posted', data: populated });
  } catch (error) {
    next(error);
  }
};

const markAsRead = async (req, res, next) => {
  try {
    const notice = await Notice.findById(req.params.id);
    if (!notice) return res.status(404).json({ success: false, message: 'Notice not found' });

    const alreadyRead = notice.readBy.some((r) => r.user.toString() === req.user._id.toString());
    if (!alreadyRead) {
      notice.readBy.push({ user: req.user._id });
      await notice.save();
    }

    res.json({ success: true, message: 'Marked as read' });
  } catch (error) {
    next(error);
  }
};

const deleteNotice = async (req, res, next) => {
  try {
    const notice = await Notice.findById(req.params.id);
    if (!notice) return res.status(404).json({ success: false, message: 'Notice not found' });
    notice.isActive = false;
    await notice.save();
    res.json({ success: true, message: 'Notice deleted' });
  } catch (error) {
    next(error);
  }
};

module.exports = { getNotices, createNotice, markAsRead, deleteNotice };
