const express = require("express");

const { getProfile, updateProfile } = require("../controllers/profileController");
const { authenticate } = require("../middlewares/authMiddleware");
const validateRequest = require("../middlewares/validateRequest");
const { updateProfileValidator } = require("../validators/profileValidators");

const router = express.Router();

router.use(authenticate);
router.get("/", getProfile);
router.put("/", updateProfileValidator, validateRequest, updateProfile);

module.exports = router;
