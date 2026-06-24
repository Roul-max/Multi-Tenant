const { recordActivity } = require("../services/activityService");

const serializeProfile = (user) => ({
  id: user._id,
  name: user.name || "",
  email: user.email,
  avatarUrl: user.avatarUrl || "",
  role: user.role,
});

const getProfile = async (req, res) => {
  return res.success({ profile: serializeProfile(req.user) });
};

const updateProfile = async (req, res, next) => {
  try {
    req.user.name = req.body.name || "";
    req.user.avatarUrl = req.body.avatarUrl || "";
    await req.user.save();

    await recordActivity({
      tenantId: req.tenant._id,
      actorId: req.user._id,
      action: "profile.updated",
      entityType: "profile",
      entityId: req.user._id,
      metadata: { name: req.user.name },
    });

    return res.success({ profile: serializeProfile(req.user) });
  } catch (error) {
    next(error);
  }
};

module.exports = { getProfile, updateProfile };
