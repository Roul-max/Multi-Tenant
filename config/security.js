const ROLES = Object.freeze({
  USER: "user",
  ADMIN: "admin",
  SUPERADMIN: "superadmin",
});

const ROLE_VALUES = Object.freeze(Object.values(ROLES));

const PLANS = Object.freeze({
  FREE: "free",
  PRO: "pro",
});

const PLAN_VALUES = Object.freeze(Object.values(PLANS));
const DEFAULT_ROLE = ROLES.USER;
const DEFAULT_PLAN = PLANS.FREE;

module.exports = {
  DEFAULT_PLAN,
  DEFAULT_ROLE,
  PLANS,
  PLAN_VALUES,
  ROLES,
  ROLE_VALUES,
};
