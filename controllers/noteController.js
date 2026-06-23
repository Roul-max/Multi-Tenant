const Note = require("../models/Note");

const FREE_PLAN_NOTE_LIMIT = 3;

const serializeNote = (note) => ({
  id: note._id,
  title: note.title,
  content: note.content,
  created_at: note.createdAt,
  updated_at: note.updatedAt,
  users: note.userId
    ? {
        id: note.userId._id,
        email: note.userId.email,
      }
    : undefined,
});

const listNotes = async (req, res, next) => {
  try {
    const notes = await Note.find({ tenantId: req.tenant._id })
      .populate("userId", "email")
      .sort({ createdAt: -1 });

    return res.success({ notes: notes.map(serializeNote) });
  } catch (error) {
    next(error);
  }
};

const createNote = async (req, res, next) => {
  try {
    if (req.tenant.plan === "free") {
      const noteCount = await Note.countDocuments({ tenantId: req.tenant._id });

      if (noteCount >= FREE_PLAN_NOTE_LIMIT) {
        return res.status(403).json({
          success: false,
          message: "Free plan allows maximum 3 notes. Upgrade to Pro for unlimited notes.",
        });
      }
    }

    const note = await Note.create({
      title: req.body.title,
      content: req.body.content || "",
      userId: req.user._id,
      tenantId: req.tenant._id,
    });
    await note.populate("userId", "email");

    return res.success({ note: serializeNote(note) }, 201);
  } catch (error) {
    next(error);
  }
};

const getNote = async (req, res, next) => {
  try {
    const note = await Note.findOne({
      _id: req.params.id,
      tenantId: req.tenant._id,
    }).populate("userId", "email");

    if (!note) {
      return res.status(404).json({
        success: false,
        message: "Note not found",
      });
    }

    return res.success({ note: serializeNote(note) });
  } catch (error) {
    next(error);
  }
};

const updateNote = async (req, res, next) => {
  try {
    const note = await Note.findOneAndUpdate(
      {
        _id: req.params.id,
        tenantId: req.tenant._id,
      },
      {
        title: req.body.title,
        content: req.body.content || "",
      },
      { new: true, runValidators: true }
    );

    if (!note) {
      return res.status(404).json({
        success: false,
        message: "Note not found",
      });
    }

    await note.populate("userId", "email");

    return res.success({ note: serializeNote(note) });
  } catch (error) {
    next(error);
  }
};

const deleteNote = async (req, res, next) => {
  try {
    const note = await Note.findOneAndDelete({
      _id: req.params.id,
      tenantId: req.tenant._id,
    });

    if (!note) {
      return res.status(404).json({
        success: false,
        message: "Note not found",
      });
    }

    return res.success({ deleted: true });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  createNote,
  deleteNote,
  getNote,
  listNotes,
  updateNote,
};
