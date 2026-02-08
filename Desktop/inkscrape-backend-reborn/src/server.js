const app = require("./app");
const { connectToDatabase } = require("./config/db");
const { env } = require("./config/env");

async function startServer() {
  await connectToDatabase();

  app.listen(env.port, () => {
    console.log(`Server listening on port ${env.port}`);
  });
}

startServer().catch((error) => {
  console.error("Failed to start server", error);
  process.exit(1);
});
