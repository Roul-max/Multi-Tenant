const express = require("express");

const {
  createNote,
  deleteNote,
  getNote,
  listNotes,
  updateNote,
} = require("../controllers/noteController");
const { authenticate } = require("../middlewares/authMiddleware");
const validateRequest = require("../middlewares/validateRequest");
const { noteIdValidator, upsertNoteValidator } = require("../validators/noteValidators");

const router = express.Router();

router.use(authenticate);

router.route("/")
  .get(listNotes)
  .post(upsertNoteValidator, validateRequest, createNote);

router.route("/:id")
  .get(noteIdValidator, validateRequest, getNote)
  .put(noteIdValidator, upsertNoteValidator, validateRequest, updateNote)
  .delete(noteIdValidator, validateRequest, deleteNote);

module.exports = router;
