const Event = require('../models/Event');

const isHoliday = async (date) => {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  const next = new Date(d);
  next.setDate(next.getDate() + 1);

  const holiday = await Event.findOne({
    type: 'holiday',
    isActive: true,
    date: { $lte: d },
    $or: [{ endDate: { $gte: d } }, { endDate: null }, { endDate: { $exists: false } }],
  });

  if (holiday) {
    if (!holiday.endDate) return true;
    const end = new Date(holiday.endDate);
    end.setHours(23, 59, 59, 999);
    return d <= end;
  }

  const singleDay = await Event.findOne({
    type: 'holiday',
    isActive: true,
    date: { $gte: d, $lt: next },
  });

  return !!singleDay;
};

module.exports = { isHoliday };
