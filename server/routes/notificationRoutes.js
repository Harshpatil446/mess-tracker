const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const { saveSubscription, updateNotificationTime, getVapidPublicKey } = require('../controllers/notificationController');

router.post('/subscribe', protect, saveSubscription);
router.post('/time', protect, updateNotificationTime);
router.get('/vapidPublicKey', protect, getVapidPublicKey);

module.exports = router;
