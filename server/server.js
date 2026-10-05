require("dotenv").config();
const app = require("./app");
const connectDB = require("./config/db");
const dns = require("dns");
const webpush = require("web-push");
const cron = require("node-cron");
const User = require("./models/User");

dns.setServers(["1.1.1.1", "8.8.8.8"])

const PORT = process.env.PORT || 8080;

// Connect to database
connectDB().then(() => {
  // Initialize Web Push VAPID Details
  if (process.env.VAPID_PUBLIC_KEY && process.env.VAPID_PRIVATE_KEY) {
    webpush.setVapidDetails(
      "mailto:test@example.com",
      process.env.VAPID_PUBLIC_KEY,
      process.env.VAPID_PRIVATE_KEY
    );
  }

  // Start Cron Job for Push Notifications every minute
  cron.schedule("* * * * *", async () => {
    const now = new Date();
    const hours = now.getHours().toString().padStart(2, "0");
    const minutes = now.getMinutes().toString().padStart(2, "0");
    const currentTimeString = `${hours}:${minutes}`;

    try {
      const users = await User.find({ notificationTime: currentTimeString });
      for (const user of users) {
        if (user.pushSubscriptions && user.pushSubscriptions.length > 0) {
          const payload = JSON.stringify({
            title: "Mess Tracker Reminder",
            body: "Don't forget to update your mess meal status for today!"
          });
          
          user.pushSubscriptions.forEach(sub => {
            webpush.sendNotification(sub, payload).catch(err => {
              console.error("Push error for user", user.mobile, err);
            });
          });
        }
      }
    } catch (error) {
      console.error("Cron error:", error);
    }
  });

  app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
  });
});
