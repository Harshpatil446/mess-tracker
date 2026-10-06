const express = require("express");
const cors = require("cors");
const path = require("path");
const webpush = require("web-push");
const authRoutes = require("./routes/authRoutes");
const messRoutes = require("./routes/messRoutes");

// Initialize Web Push VAPID Details
if (process.env.VAPID_PUBLIC_KEY && process.env.VAPID_PRIVATE_KEY) {
  webpush.setVapidDetails(
    "mailto:test@example.com",
    process.env.VAPID_PUBLIC_KEY,
    process.env.VAPID_PRIVATE_KEY
  );
}

const app = express();

// Middleware
app.use(cors({
  origin: process.env.CLIENT_URL || "http://localhost:5173",
  credentials: true
}));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

// Routes
app.use("/api/auth", authRoutes);
app.use("/api/mess", messRoutes);
app.use("/api/notifications", require("./routes/notificationRoutes"));
app.use("/api/cron", require("./routes/cronRoutes"));

// Serve Frontend (only if not running on Vercel serverless)
if (process.env.NODE_ENV === "production" && !process.env.VERCEL) {
  app.use(express.static(path.join(__dirname, "../dist")));

  app.get("*", (req, res) =>
    res.sendFile(
      path.resolve(__dirname, "../", "dist", "index.html")
    )
  );
} else {
  // Base route for testing
  app.get("/", (req, res) => {
    res.send("Mess Tiffin Tracker API is running");
  });
}

// Global Error Handler
app.use((err, req, res, next) => {
  const statusCode = res.statusCode === 200 ? 500 : res.statusCode;
  res.status(statusCode).json({
    message: err.message,
    stack: process.env.NODE_ENV === "production" ? null : err.stack,
  });
});

module.exports = app;
