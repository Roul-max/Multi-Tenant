const REQUIRED_ENV_VARS = ["MASTER_DB_URL", "JWT_SECRET", "PORT"];

const validateEnv = () => {
  const missing = REQUIRED_ENV_VARS.filter((name) => !process.env[name]);

  if (missing.length > 0) {
    console.error(`Missing required environment variables: ${missing.join(", ")}`);
    process.exit(1);
  }

  const port = Number(process.env.PORT);
  if (!Number.isInteger(port) || port <= 0) {
    console.error("PORT must be a positive integer");
    process.exit(1);
  }

  if (process.env.NODE_ENV === "production" && !process.env.CORS_ORIGIN) {
    console.error("CORS_ORIGIN is required in production");
    process.exit(1);
  }
};

module.exports = validateEnv;
