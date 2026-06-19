const Event = require('../models/Event');
const { getPagination, paginatedResponse } = require('../utils/pagination');
const logActivity = require('../utils/activityLogger');

const getEvents = async (req, res, next) => {
  try {
    const { month, year, type, upcoming } = req.query;
    const query = { isActive: true };

    if (type) query.type = type;

    if (month && year) {
      const start = new Date(year, month - 1, 1);
      const end = new Date(year, month, 0, 23, 59, 59);
      query.date = { $gte: start, $lte: end };
    }

    if (upcoming === 'true') {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      query.date = { $gte: today };
    }

    const events = await Event.find(query).sort({ date: 1 }).limit(upcoming ? 10 : 100);
    res.json({ success: true, data: events });
  } catch (error) {
    next(error);
  }
};

const createEvent = async (req, res, next) => {
  try {
    const event = await Event.create({ ...req.body, createdBy: req.user._id });
    await logActivity('created', 'Event', event._id, req.user._id, event.name);
    res.status(201).json({ success: true, data: event });
  } catch (error) {
    next(error);
  }
};

const deleteEvent = async (req, res, next) => {
  try {
    await Event.findByIdAndUpdate(req.params.id, { isActive: false });
    res.json({ success: true, message: 'Event deleted' });
  } catch (error) {
    next(error);
  }
};

module.exports = { getEvents, createEvent, deleteEvent };
