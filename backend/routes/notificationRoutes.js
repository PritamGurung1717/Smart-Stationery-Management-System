// backend/routes/notificationRoutes.js
const express = require('express');
const router = express.Router();
const { auth } = require('../middleware/auth');
const notificationController = require('../controllers/notificationController');

// Get user notifications
router.get('/', auth, notificationController.getNotifications);

// Get unread count
router.get('/unread-count', auth, notificationController.getUnreadCount);

// Mark notification as read
router.put('/:notificationId/read', auth, notificationController.markAsRead);

// Mark all as read
router.put('/mark-all-read', auth, notificationController.markAllAsRead);

// Delete notification
router.delete('/:notificationId', auth, notificationController.deleteNotification);

module.exports = router;
