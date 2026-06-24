const Activity = require("../models/Activity");

const serializeActivity = (activity) => ({
  id: activity._id,
  action: activity.action,
  entityType: activity.entityType,
  entityId: activity.entityId,
  metadata: activity.metadata,
  created_at: activity.createdAt,
  actor: activity.actorId
    ? {
        id: activity.actorId._id,
        email: activity.actorId.email,
        name: activity.actorId.name,
      }
    : undefined,
});

const listActivity = async (req, res, next) => {
  try {
    const limit = Math.min(Number(req.query.limit) || 25, 100);
    const activities = await Activity.find({ tenantId: req.tenant._id })
      .populate("actorId", "email name")
      .sort({ createdAt: -1 })
      .limit(limit);

    return res.success({ activities: activities.map(serializeActivity) });
  } catch (error) {
    next(error);
  }
};

module.exports = { listActivity };
