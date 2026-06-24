const express = require("express");

const { getAnalytics } = require("../controllers/analyticsController");
const { authenticate } = require("../middlewares/authMiddleware");

const router = express.Router();

router.use(authenticate);
router.get("/", getAnalytics);

module.exports = router;
