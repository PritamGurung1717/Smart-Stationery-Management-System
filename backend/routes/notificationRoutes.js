// backend/routes/notificationRoutes.js
const express = require('express');
const router = express.Router();
const { auth } = require('../middleware/auth');
const notificationController = require('../controllers/notificationController');

// Get user notifications
router.get('/', auth, notificationController.getNotifications);

// Get unread count
router.get('/unread-count', auth, notificationController.getUnreadCount);

// Mark all as read (must be before /:notificationId routes)
router.put('/mark-all-read', auth, notificationController.markAllAsRead);

// Mark notification as read
router.put('/:notificationId/read', auth, notificationController.markAsRead);

// Delete notification
router.delete('/:notificationId', auth, notificationController.deleteNotification);

module.exports = router;
