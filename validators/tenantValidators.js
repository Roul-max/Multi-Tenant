const { body } = require("express-validator");
const createTenantValidator = [
  body("name")
    .isString()
    .trim()
    .isLength({ min: 2, max: 120 })
    .withMessage("Tenant name must be between 2 and 120 characters"),
  body("slug")
    .isString()
    .trim()
    .matches(/^[a-z0-9]+(?:-[a-z0-9]+)*$/)
    .isLength({ min: 2, max: 80 })
    .withMessage("Tenant slug must be URL-safe and between 2 and 80 characters"),
  body("plan").customSanitizer(() => undefined),
];

const updateTenantPlanValidator = [
  body("plan").customSanitizer(() => undefined),
];

module.exports = { createTenantValidator, updateTenantPlanValidator };
