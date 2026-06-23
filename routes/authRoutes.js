const express = require("express");

const { createUser, login, register } = require("../controllers/authController");
const { authenticate, requireAdmin } = require("../middlewares/authMiddleware");
const validateRequest = require("../middlewares/validateRequest");
const {
  createUserValidator,
  loginValidator,
  registerValidator,
} = require("../validators/authValidators");

const router = express.Router();

router.post("/register", registerValidator, validateRequest, register);
router.post("/login", loginValidator, validateRequest, login);
router.post("/users", authenticate, requireAdmin, createUserValidator, validateRequest, createUser);

module.exports = router;
