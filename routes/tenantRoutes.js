const express = require("express");

const { createTenant, upgradeTenant } = require("../controllers/tenantController");
const { authenticate, requireAdmin } = require("../middlewares/authMiddleware");
const validateRequest = require("../middlewares/validateRequest");
const {
  createTenantValidator,
  updateTenantPlanValidator,
} = require("../validators/tenantValidators");

const router = express.Router();

router.post("/", createTenantValidator, validateRequest, createTenant);
router.post("/:slug/upgrade", authenticate, requireAdmin, updateTenantPlanValidator, validateRequest, upgradeTenant);

module.exports = router;
