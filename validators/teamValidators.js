const { body, param } = require("express-validator");

const PUBLIC_ROLES = ["owner", "admin", "member"];

const inviteTeamMemberValidator = [
  body("email").isEmail().normalizeEmail().withMessage("A valid email is required"),
  body("name").optional().isString().trim().isLength({ max: 120 }).withMessage("Name must be 120 characters or fewer"),
  body("role").optional().isIn(PUBLIC_ROLES).withMessage(`Role must be one of: ${PUBLIC_ROLES.join(", ")}`),
  body("temporaryPassword").customSanitizer(() => undefined),
];

const updateTeamMemberRoleValidator = [
  param("id").isMongoId().withMessage("A valid member id is required"),
  body("role").isIn(PUBLIC_ROLES).withMessage(`Role must be one of: ${PUBLIC_ROLES.join(", ")}`),
];

module.exports = {
  inviteTeamMemberValidator,
  updateTeamMemberRoleValidator,
};
