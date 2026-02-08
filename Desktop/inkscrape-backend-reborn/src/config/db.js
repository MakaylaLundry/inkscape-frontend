const mongoose = require("mongoose");
const { env } = require("./env");

async function connectToDatabase() {
  if (!env.mongodbUri) {
    throw new Error("Missing required env var: MONGODB_URI");
  }

  await mongoose.connect(env.mongodbUri);
  console.log("MongoDB connected");
}

module.exports = {
  connectToDatabase
};
