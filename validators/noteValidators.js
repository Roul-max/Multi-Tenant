const { body, param } = require("express-validator");

const noteIdValidator = [
  param("id").isMongoId().withMessage("A valid note id is required"),
];

const upsertNoteValidator = [
  body("title")
    .isString()
    .trim()
    .isLength({ min: 1, max: 160 })
    .withMessage("Title must be between 1 and 160 characters"),
  body("content")
    .optional({ values: "falsy" })
    .isString()
    .trim()
    .isLength({ max: 10000 })
    .withMessage("Content must be 10000 characters or fewer"),
];

module.exports = { noteIdValidator, upsertNoteValidator };
