const User = require('../models/User');

const saveSubscription = async (req, res) => {
  try {
    const { subscription } = req.body;
    
    const user = await User.findById(req.user._id);
    const exists = user.pushSubscriptions.some(sub => sub.endpoint === subscription.endpoint);
    
    if (!exists) {
      user.pushSubscriptions.push(subscription);
      await user.save();
    }
    
    res.status(201).json({ message: 'Subscription saved successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const updateNotificationTime = async (req, res) => {
  try {
    const { time } = req.body; // expected format "HH:MM"
    const user = await User.findById(req.user._id);
    user.notificationTime = time;
    await user.save();
    
    res.status(200).json({ message: 'Notification time updated', time });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const getVapidPublicKey = (req, res) => {
  res.status(200).json({ publicKey: process.env.VAPID_PUBLIC_KEY });
};

module.exports = { saveSubscription, updateNotificationTime, getVapidPublicKey };
