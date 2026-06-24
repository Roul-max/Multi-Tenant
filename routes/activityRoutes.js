const express = require("express");

const { listActivity } = require("../controllers/activityController");
const { authenticate } = require("../middlewares/authMiddleware");

const router = express.Router();

router.use(authenticate);
router.get("/", listActivity);

module.exports = router;
