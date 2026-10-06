const app = require('../server/app');
const connectDB = require('../server/config/db');
const webpush = require('web-push');

// Initialize Web Push VAPID Details
if (process.env.VAPID_PUBLIC_KEY && process.env.VAPID_PRIVATE_KEY) {
  webpush.setVapidDetails(
    "mailto:test@example.com",
    process.env.VAPID_PUBLIC_KEY,
    process.env.VAPID_PRIVATE_KEY
  );
}

// Connect to the database before handling the request
// In a serverless environment, we need to ensure the DB connection is established
let isConnected = false;

app.use(async (req, res, next) => {
  if (!isConnected) {
    try {
      await connectDB();
      isConnected = true;
    } catch (error) {
      console.error("Database connection failed", error);
      return res.status(500).json({ error: "Database connection failed" });
    }
  }
  next();
});

module.exports = app;
