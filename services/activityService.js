const Activity = require("../models/Activity");

const recordActivity = async ({ tenantId, actorId, action, entityType, entityId, metadata = {} }) => {
  if (!tenantId || !actorId || !action || !entityType || !entityId) {
    return;
  }

  try {
    await Activity.create({
      tenantId,
      actorId,
      action,
      entityType,
      entityId,
      metadata,
    });
  } catch (error) {
    console.error("Failed to record activity:", error.message);
  }
};

module.exports = { recordActivity };
