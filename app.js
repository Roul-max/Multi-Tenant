const cors = require("cors");
const express = require("express");
const helmet = require("helmet");
const rateLimit = require("express-rate-limit");
const morgan = require("morgan");

const authRoutes = require("./routes/authRoutes");
const noteRoutes = require("./routes/noteRoutes");
const tenantRoutes = require("./routes/tenantRoutes");
const { errorHandler, notFoundHandler } = require("./middlewares/errorHandler");
const { attachResponseHelpers } = require("./middlewares/responseHandler");

const app = express();

const normalizeOrigin = (origin) => origin.trim().replace(/\/+$/, "");

const allowedOrigins = (process.env.CORS_ORIGIN || "")
  .split(",")
  .map(normalizeOrigin)
  .filter(Boolean);

app.set("trust proxy", 1);
app.use(helmet());
app.use(
  cors({
    origin(origin, callback) {
      if (!origin) {
        return callback(null, true);
      }

      const normalizedOrigin = normalizeOrigin(origin);
      if (allowedOrigins.includes(normalizedOrigin)) {
        return callback(null, true);
      }

      if (process.env.NODE_ENV !== "production" && /^https?:\/\/localhost:\d+$/.test(normalizedOrigin)) {
        return callback(null, true);
      }

      console.warn("[CORS] Rejected origin:", origin);
      return callback(new Error("CORS origin is not allowed"));
    },
    credentials: true,
  })
);
app.use(express.json({ limit: "1mb" }));
app.use(express.urlencoded({ extended: true }));
app.use(morgan(process.env.NODE_ENV === "production" ? "combined" : "dev"));
app.use(
  rateLimit({
    windowMs: 15 * 60 * 1000,
    limit: 100,
    standardHeaders: "draft-8",
    legacyHeaders: false,
    message: {
      success: false,
      message: "Too many requests. Please try again later.",
    },
  })
);
app.use(attachResponseHelpers);

app.get("/health", (req, res) => {
  res.status(200).json({ status: "ok" });
});

app.use("/api/auth", authRoutes);
app.use("/api/notes", noteRoutes);
app.use("/api/tenants", tenantRoutes);

app.use(notFoundHandler);
app.use(errorHandler);

module.exports = app;
