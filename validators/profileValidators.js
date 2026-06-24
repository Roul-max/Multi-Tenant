const { body } = require("express-validator");

const ONE_MEGABYTE = 1024 * 1024;
const DATA_URL_PATTERN = /^data:image\/(png|jpeg|webp);base64,([A-Za-z0-9+/]+={0,2})$/;
const DANGEROUS_PAYLOAD_PATTERN = /<\s*(svg|html|script|iframe|object|embed|body|img|link|meta)\b|javascript:/i;

const hasValidImageSignature = (mimeType, buffer) => {
  if (mimeType === "png") {
    return buffer.length >= 8 && buffer.subarray(0, 8).equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]));
  }

  if (mimeType === "jpeg") {
    return buffer.length >= 3 && buffer[0] === 0xff && buffer[1] === 0xd8 && buffer[2] === 0xff;
  }

  if (mimeType === "webp") {
    return buffer.length >= 12 && buffer.toString("ascii", 0, 4) === "RIFF" && buffer.toString("ascii", 8, 12) === "WEBP";
  }

  return false;
};

const validateAvatarDataUrl = (value) => {
  if (!value) {
    return true;
  }

  const match = DATA_URL_PATTERN.exec(value);
  if (!match) {
    throw new Error("Avatar must be a png, jpeg, or webp data URL");
  }

  const [, mimeType, base64Payload] = match;
  const decoded = Buffer.from(base64Payload, "base64");

  if (decoded.length > ONE_MEGABYTE) {
    throw new Error("Avatar image must be 1MB or smaller");
  }

  if (DANGEROUS_PAYLOAD_PATTERN.test(decoded.toString("utf8", 0, Math.min(decoded.length, 4096)))) {
    throw new Error("Avatar image payload is not allowed");
  }

  if (!hasValidImageSignature(mimeType, decoded)) {
    throw new Error("Avatar image type is invalid");
  }

  return true;
};

const updateProfileValidator = [
  body("name").optional().isString().trim().isLength({ max: 120 }).withMessage("Name must be 120 characters or fewer"),
  body("avatarUrl")
    .optional()
    .isString()
    .trim()
    .custom(validateAvatarDataUrl),
];

module.exports = { updateProfileValidator };
