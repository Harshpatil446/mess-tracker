const express = require('express');
const router = express.Router();
const User = require('../models/User');
const webpush = require('web-push');

router.get('/send-notifications', async (req, res) => {
  // To secure the cron endpoint, verify the CRON_SECRET if it's set
  if (process.env.CRON_SECRET) {
    const authHeader = req.headers.authorization;
    if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
      return res.status(401).json({ error: 'Unauthorized' });
    }
  }

  const now = new Date();
  // Vercel cron jobs use UTC time. Adjust this if your app needs a specific timezone.
  // Since the user is likely in India, let's adjust for IST (+5:30)
  const istOffset = 5.5 * 60 * 60 * 1000;
  const istTime = new Date(now.getTime() + istOffset);
  
  const hours = istTime.getUTCHours().toString().padStart(2, "0");
  const minutes = istTime.getUTCMinutes().toString().padStart(2, "0");
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
    return res.status(200).json({ message: "Notifications processed", time: currentTimeString });
  } catch (error) {
    console.error("Cron error:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
});

module.exports = router;
