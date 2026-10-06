const app = require('../server/app');
const connectDB = require('../server/config/db');

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
