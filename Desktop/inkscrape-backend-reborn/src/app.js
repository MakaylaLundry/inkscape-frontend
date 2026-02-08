const express = require("express");
const healthRoutes = require("./routes/health");
const stubRoutes = require("./routes/stub");
const { notFoundHandler, errorHandler } = require("./middleware/errorHandler");

const app = express();
const cors = require("cors");

app.use(cors({
  origin: (origin, callback) => {
    // allow server-to-server / curl / same-origin
    if (!origin) return callback(null, true);

    if (
      origin === "http://localhost:5173" ||
      origin === "http://localhost:8080" ||
      origin.endsWith(".lovable.app") ||
      origin === "https://lovable.app" ||
      origin.endsWith(".vercel.app")
    ) {
      return callback(null, true);
    }

    return callback(new Error("Not allowed by CORS"));
  },
  methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization", "x-dev-user-sub"],
  credentials: false
}));


app.get("/health", (req, res) => {
  res.json({ ok: true });
});



app.use(express.json());

app.use("/api/v1", healthRoutes);
app.use("/api/v1", stubRoutes);

app.use(notFoundHandler);
app.use(errorHandler);

module.exports = app;
