const { body } = require("express-validator");
const { ROLE_VALUES } = require("../config/security");

const registerValidator = [
  body("email").isEmail().normalizeEmail().withMessage("A valid email is required"),
  body("password")
    .isString()
    .isLength({ min: 8, max: 128 })
    .withMessage("Password must be between 8 and 128 characters"),
  body("tenantSlug")
    .isString()
    .trim()
    .matches(/^[a-z0-9]+(?:-[a-z0-9]+)*$/)
    .withMessage("A valid tenantSlug is required"),
  body("role").customSanitizer(() => undefined),
];

const createUserValidator = [
  body("email").isEmail().normalizeEmail().withMessage("A valid email is required"),
  body("password")
    .isString()
    .isLength({ min: 8, max: 128 })
    .withMessage("Password must be between 8 and 128 characters"),
  body("role")
    .optional()
    .isIn(ROLE_VALUES)
    .withMessage(`Role must be one of: ${ROLE_VALUES.join(", ")}`),
];

const loginValidator = [
  body("email").isEmail().normalizeEmail().withMessage("A valid email is required"),
  body("password").isString().notEmpty().withMessage("Password is required"),
];

module.exports = { createUserValidator, loginValidator, registerValidator };
