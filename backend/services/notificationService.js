// backend/services/notificationService.js
const Notification = require('../models/notification');

class NotificationService {
  // Create a new notification
  static async createNotification(data) {
    try {
      const notification = new Notification(data);
      await notification.save();
      console.log(`✅ Notification created for user ${data.user_id}: ${data.title}`);
      return notification;
    } catch (error) {
      console.error('❌ Error creating notification:', error);
      throw error;
    }
  }

  // Get user notifications
  static async getUserNotifications(userId, limit = 20, skip = 0) {
    try {
      const notifications = await Notification.find({ user_id: userId })
        .sort({ created_at: -1 })
        .limit(limit)
        .skip(skip);
      
      const unreadCount = await Notification.countDocuments({ 
        user_id: userId, 
        is_read: false 
      });
      
      return { notifications, unreadCount };
    } catch (error) {
      console.error('❌ Error fetching notifications:', error);
      throw error;
    }
  }

  // Mark notification as read
  static async markAsRead(notificationId, userId) {
    try {
      const notification = await Notification.findOneAndUpdate(
        { _id: notificationId, user_id: userId },
        { is_read: true },
        { new: true }
      );
      return notification;
    } catch (error) {
      console.error('❌ Error marking notification as read:', error);
      throw error;
    }
  }

  // Mark all notifications as read
  static async markAllAsRead(userId) {
    try {
      const result = await Notification.updateMany(
        { user_id: userId, is_read: false },
        { is_read: true }
      );
      return result;
    } catch (error) {
      console.error('❌ Error marking all notifications as read:', error);
      throw error;
    }
  }

  // Delete notification
  static async deleteNotification(notificationId, userId) {
    try {
      const notification = await Notification.findOneAndDelete({
        _id: notificationId,
        user_id: userId
      });
      return notification;
    } catch (error) {
      console.error('❌ Error deleting notification:', error);
      throw error;
    }
  }

  // Get unread count
  static async getUnreadCount(userId) {
    try {
      const count = await Notification.countDocuments({ 
        user_id: userId, 
        is_read: false 
      });
      return count;
    } catch (error) {
      console.error('❌ Error getting unread count:', error);
      throw error;
    }
  }

  // Helper methods for creating specific notification types
  
  // Order notifications
  static async createOrderNotification(userId, orderId, status, amount) {
    const statusMessages = {
      placed: {
        title: 'Order Placed Successfully',
        message: `Your order #${orderId} for ₹${amount} has been placed successfully.`,
        icon: '🛒'
      },
      processing: {
        title: 'Order Being Processed',
        message: `Your order #${orderId} is being processed.`,
        icon: '⚙️'
      },
      shipped: {
        title: 'Order Shipped',
        message: `Your order #${orderId} has been shipped!`,
        icon: '🚚'
      },
      delivered: {
        title: 'Order Delivered',
        message: `Your order #${orderId} has been delivered.`,
        icon: '✅'
      },
      cancelled: {
        title: 'Order Cancelled',
        message: `Your order #${orderId} has been cancelled.`,
        icon: '❌'
      }
    };

    const config = statusMessages[status] || statusMessages.placed;

    return this.createNotification({
      user_id: userId,
      type: status === 'placed' ? 'order_placed' : 'order_status_changed',
      title: config.title,
      message: config.message,
      link: `/my-orders`,
      icon: config.icon
    });
  }

  // Donation request received (donor gets notified)
  static async createDonationRequestNotification(donorId, donationId, donationTitle, requesterName) {
    return this.createNotification({
      user_id: donorId,
      type: 'donation_request_received',
      title: 'New Donation Request 🎁',
      message: `${requesterName} requested your donation: ${donationTitle}`,
      link: `/my-donations`,
      icon: '🎁'
    });
  }

  // Donation request response (requester gets notified)
  static async createDonationResponseNotification(requesterId, donationId, donationTitle, status) {
    if (status === 'accepted') {
      return this.createNotification({
        user_id: requesterId,
        type: 'donation_request_accepted',
        title: 'Donation Request Accepted! ✅',
        message: `Your request for "${donationTitle}" was accepted. You can now chat with the donor.`,
        link: `/donations/${donationId}/chat`,
        icon: '✅'
      });
    } else {
      return this.createNotification({
        user_id: requesterId,
        type: 'donation_request_rejected',
        title: 'Donation Request Declined',
        message: `Your request for "${donationTitle}" was declined.`,
        link: `/donations`,
        icon: '❌'
      });
    }
  }

  // Book set notifications
  static async createBookSetNotification(userId, bookSetId, bookSetTitle, status) {
    if (status === 'approved') {
      return this.createNotification({
        user_id: userId,
        type: 'book_set_approved',
        title: 'Book Set Request Approved! 📚',
        message: `Your book set request "${bookSetTitle}" has been approved!`,
        link: `/book-sets`,
        icon: '📚'
      });
    } else {
      return this.createNotification({
        user_id: userId,
        type: 'book_set_rejected',
        title: 'Book Set Request Rejected',
        message: `Your book set request "${bookSetTitle}" was rejected.`,
        link: `/institute/book-set-request`,
        icon: '📕'
      });
    }
  }

  // Verification notifications
  static async createVerificationNotification(userId, status) {
    if (status === 'approved') {
      return this.createNotification({
        user_id: userId,
        type: 'verification_approved',
        title: 'Institute Verification Approved! ✅',
        message: 'Congratulations! Your institute has been verified.',
        link: `/institute-dashboard`,
        icon: '✅'
      });
    } else {
      return this.createNotification({
        user_id: userId,
        type: 'verification_rejected',
        title: 'Institute Verification Rejected',
        message: 'Your verification request was rejected. Please contact support.',
        link: `/institute-verification`,
        icon: '❌'
      });
    }
  }
}

module.exports = NotificationService;
