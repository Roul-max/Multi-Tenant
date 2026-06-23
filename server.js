require("dotenv").config();

const app = require("./app");
const connectDatabase = require("./config/database");
const validateEnv = require("./config/validateEnv");

const startServer = async () => {
  validateEnv();
  await connectDatabase();

  const port = Number(process.env.PORT);
  app.listen(port, () => {
    console.log(`API server listening on port ${port}`);
  });
};

startServer().catch((error) => {
  console.error("Failed to start server:", error.message);
  process.exit(1);
});
