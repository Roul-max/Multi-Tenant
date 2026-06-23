const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

const Tenant = require("../models/Tenant");
const User = require("../models/User");
const { DEFAULT_ROLE, ROLES } = require("../config/security");

const sanitizeUser = (user, tenant) => ({
  id: user._id,
  email: user.email,
  role: user.role,
  tenant: {
    id: tenant._id,
    slug: tenant.slug,
    name: tenant.name,
    plan: tenant.plan,
  },
});

const signToken = (user, tenant) => {
  return jwt.sign(
    {
      userId: user._id.toString(),
      email: user.email,
      role: user.role,
      tenantId: tenant._id.toString(),
      tenantSlug: tenant.slug,
    },
    process.env.JWT_SECRET,
    { expiresIn: "7d" }
  );
};

const register = async (req, res, next) => {
  try {
    const { email, password, tenantSlug } = req.body;
    const tenant = await Tenant.findOne({ slug: tenantSlug.toLowerCase() });

    if (!tenant) {
      return res.status(404).json({
        success: false,
        message: "Tenant not found",
      });
    }

    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(409).json({
        success: false,
        message: "Email is already registered",
      });
    }

    const passwordHash = await bcrypt.hash(password, 12);
    const user = await User.create({
      email,
      passwordHash,
      role: DEFAULT_ROLE,
      tenantId: tenant._id,
    });

    const token = signToken(user, tenant);
    return res.success({ token, user: sanitizeUser(user, tenant) }, 201);
  } catch (error) {
    next(error);
  }
};

const createUser = async (req, res, next) => {
  try {
    const { email, password } = req.body;
    const requestedRole = req.body.role || DEFAULT_ROLE;

    if (requestedRole === ROLES.SUPERADMIN && req.user.role !== ROLES.SUPERADMIN) {
      return res.status(403).json({
        success: false,
        message: "Only superadmins can create superadmin users",
      });
    }

    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(409).json({
        success: false,
        message: "Email is already registered",
      });
    }

    const passwordHash = await bcrypt.hash(password, 12);
    const user = await User.create({
      email,
      passwordHash,
      role: requestedRole,
      tenantId: req.tenant._id,
    });

    return res.success({ user: sanitizeUser(user, req.tenant) }, 201);
  } catch (error) {
    next(error);
  }
};

const login = async (req, res, next) => {
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ email }).select("+passwordHash");

    if (!user) {
      return res.status(401).json({
        success: false,
        message: "Invalid email or password",
      });
    }

    const passwordMatches = await bcrypt.compare(password, user.passwordHash);
    if (!passwordMatches) {
      return res.status(401).json({
        success: false,
        message: "Invalid email or password",
      });
    }

    const tenant = await Tenant.findById(user.tenantId);
    if (!tenant) {
      return res.status(404).json({
        success: false,
        message: "Tenant not found for this user",
      });
    }

    const token = signToken(user, tenant);
    return res.success({ token, user: sanitizeUser(user, tenant) });
  } catch (error) {
    next(error);
  }
};

module.exports = { createUser, login, register };
