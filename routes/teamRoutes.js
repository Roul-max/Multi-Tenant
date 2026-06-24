const express = require("express");

const {
  inviteTeamMember,
  listTeamMembers,
  updateTeamMemberRole,
} = require("../controllers/teamController");
const { authenticate, requireAdmin } = require("../middlewares/authMiddleware");
const validateRequest = require("../middlewares/validateRequest");
const {
  inviteTeamMemberValidator,
  updateTeamMemberRoleValidator,
} = require("../validators/teamValidators");

const router = express.Router();

router.use(authenticate);
router.get("/", requireAdmin, listTeamMembers);
router.post("/invite", requireAdmin, inviteTeamMemberValidator, validateRequest, inviteTeamMember);
router.patch("/:id/role", requireAdmin, updateTeamMemberRoleValidator, validateRequest, updateTeamMemberRole);

module.exports = router;
