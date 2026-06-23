const jwt = require("jsonwebtoken");
const Tenant = require("../models/Tenant");
const User = require("../models/User");
const { ROLES } = require("../config/security");

const authenticate = async (req, res, next) => {
  try {
    const authHeader = req.get("authorization");

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res.status(401).json({
        success: false,
        message: "Authentication token is required",
      });
    }

    const token = authHeader.slice(7);
    const payload = jwt.verify(token, process.env.JWT_SECRET);

    const user = await User.findById(payload.userId).select("_id email role tenantId");
    if (!user) {
      return res.status(401).json({
        success: false,
        message: "Authenticated user no longer exists",
      });
    }

    const tenant = await Tenant.findById(user.tenantId);
    if (!tenant) {
      return res.status(401).json({
        success: false,
        message: "Authenticated tenant no longer exists",
      });
    }

    req.user = user;
    req.tenant = tenant;
    next();
  } catch (error) {
    next(error);
  }
};

const requireAdmin = (req, res, next) => {
  if (!req.user || ![ROLES.ADMIN, ROLES.SUPERADMIN].includes(req.user.role)) {
    return res.status(403).json({
      success: false,
      message: "Admin access is required",
    });
  }

  next();
};

module.exports = {
  authenticate,
  requireAdmin,
};
