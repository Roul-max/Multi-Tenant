const bcrypt = require("bcryptjs");
const crypto = require("crypto");

const User = require("../models/User");
const { ROLES } = require("../config/security");
const { recordActivity } = require("../services/activityService");

const PUBLIC_ROLES = Object.freeze({
  owner: ROLES.SUPERADMIN,
  admin: ROLES.ADMIN,
  member: ROLES.USER,
});

const generateTemporaryPassword = () => {
  return crypto.randomBytes(18).toString("base64url");
};

const canAssignPublicRole = (actorRole, requestedRole) => {
  return requestedRole !== "owner" || actorRole === ROLES.SUPERADMIN;
};

const toPublicRole = (role) => {
  if (role === ROLES.SUPERADMIN) {
    return "owner";
  }
  if (role === ROLES.ADMIN) {
    return "admin";
  }
  return "member";
};

const serializeTeamMember = (user) => ({
  id: user._id,
  name: user.name || "",
  email: user.email,
  avatarUrl: user.avatarUrl || "",
  role: toPublicRole(user.role),
  status: user.status || "active",
  invited_at: user.invitedAt,
  created_at: user.createdAt,
});

const listTeamMembers = async (req, res, next) => {
  try {
    const users = await User.find({ tenantId: req.tenant._id }).sort({ createdAt: 1 });
    return res.success({ members: users.map(serializeTeamMember) });
  } catch (error) {
    next(error);
  }
};

const inviteTeamMember = async (req, res, next) => {
  try {
    const requestedRole = req.body.role || "member";
    const role = PUBLIC_ROLES[requestedRole];

    if (!canAssignPublicRole(req.user.role, requestedRole)) {
      return res.status(403).json({
        success: false,
        message: "Only superadmins can assign owner access",
      });
    }

    const existingUser = await User.findOne({ email: req.body.email });
    if (existingUser) {
      return res.status(409).json({
        success: false,
        message: "Email is already registered",
      });
    }

    const temporaryPassword = generateTemporaryPassword();
    const passwordHash = await bcrypt.hash(temporaryPassword, 12);
    const user = await User.create({
      name: req.body.name || "",
      email: req.body.email,
      passwordHash,
      role,
      tenantId: req.tenant._id,
      status: "invited",
      invitedAt: new Date(),
    });

    await recordActivity({
      tenantId: req.tenant._id,
      actorId: req.user._id,
      action: "user.invited",
      entityType: "user",
      entityId: user._id,
      metadata: { email: user.email, role: requestedRole },
    });

    return res.success({ member: serializeTeamMember(user), temporaryPassword }, 201);
  } catch (error) {
    next(error);
  }
};

const updateTeamMemberRole = async (req, res, next) => {
  try {
    if (!canAssignPublicRole(req.user.role, req.body.role)) {
      return res.status(403).json({
        success: false,
        message: "Only superadmins can assign owner access",
      });
    }

    const role = PUBLIC_ROLES[req.body.role];
    const user = await User.findOneAndUpdate(
      { _id: req.params.id, tenantId: req.tenant._id },
      { role, status: "active" },
      { new: true, runValidators: true }
    );

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "Team member not found",
      });
    }

    await recordActivity({
      tenantId: req.tenant._id,
      actorId: req.user._id,
      action: "user.role_updated",
      entityType: "user",
      entityId: user._id,
      metadata: { email: user.email, role: req.body.role },
    });

    return res.success({ member: serializeTeamMember(user) });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  inviteTeamMember,
  listTeamMembers,
  updateTeamMemberRole,
};
