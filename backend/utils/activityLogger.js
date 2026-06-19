const ActivityLog = require('../models/ActivityLog');

const logActivity = async (action, entity, entityId, performedBy, details = '') => {
  try {
    await ActivityLog.create({ action, entity, entityId, performedBy, details });
  } catch {
    // Non-blocking activity logging
  }
};

module.exports = logActivity;
