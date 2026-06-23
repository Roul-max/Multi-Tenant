const mongoose = require("mongoose");

const connectDatabase = async () => {
  mongoose.set("strictQuery", true);

  await mongoose.connect(process.env.MASTER_DB_URL, {
    serverSelectionTimeoutMS: 10000,
  });

  console.log("Connected to MongoDB");
  console.log("[AUTH_DEBUG] Connected DB:", mongoose.connection.name);
};

module.exports = connectDatabase;
