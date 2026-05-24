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
    const normalized = status === 'processing' ? 'preparing' : status;
    const statusMessages = {
      placed: {
        title: 'Order Placed Successfully',
        message: `Your order #${orderId} for ₹${amount} has been placed successfully.`,
        icon: '🛒'
      },
      confirmed: {
        title: 'Order Confirmed',
        message: `Your order #${orderId} has been confirmed.`,
        icon: '✅'
      },
      preparing: {
        title: 'Order Being Prepared',
        message: `Your order #${orderId} is being prepared.`,
        icon: '⚙️'
      },
      shipped: {
        title: 'Order Shipped',
        message: `Your order #${orderId} has been shipped!`,
        icon: '🚚'
      },
      out_for_delivery: {
        title: 'Out for Delivery',
        message: `Your order #${orderId} is out for delivery.`,
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

    const config = statusMessages[normalized] || statusMessages.placed;

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

  // ── Admin notification helpers ────────────────────────────────

  // Get admin user IDs (all admins)
  static async getAdminIds() {
    try {
      const User = require('../models/user');
      const admins = await User.find({ role: 'admin' }).select('id');
      return admins.map(a => a.id);
    } catch { return []; }
  }

  // Notify all admins
  static async notifyAdmins(data) {
    try {
      const adminIds = await this.getAdminIds();
      await Promise.all(adminIds.map(adminId =>
        this.createNotification({ ...data, user_id: adminId }).catch(() => {})
      ));
    } catch (err) {
      console.error('❌ Error notifying admins:', err.message);
    }
  }

  // New order placed
  static async notifyAdminNewOrder(orderId, userName, amount, paymentMethod) {
    const method = (paymentMethod || 'cod').toUpperCase();
    return this.notifyAdmins({
      type: 'admin_new_order',
      title: '🛒 New Order Received',
      message: `Order #${orderId} placed by ${userName} for ₹${amount} (${method}).`,
      link: `/admin-dashboard`,
      icon: '🛒',
      metadata: { orderId, amount, paymentMethod, tab: 'orders' }
    });
  }

  // Khalti payment verified
  static async notifyAdminPayment(orderId, userName, amount, transactionId) {
    return this.notifyAdmins({
      type: 'admin_new_payment',
      title: '💳 Khalti Payment Received',
      message: `Payment of ₹${amount} confirmed for Order #${orderId} by ${userName}. TXN: ${transactionId}`,
      link: `/admin-dashboard`,
      icon: '💳',
      metadata: { orderId, amount, transactionId, tab: 'orders' }
    });
  }

  // New institute verification submitted
  static async notifyAdminNewVerification(instituteName, userId) {
    return this.notifyAdmins({
      type: 'admin_new_verification',
      title: '🏫 New Verification Request',
      message: `${instituteName} has submitted an institute verification request for review.`,
      link: `/admin-dashboard`,
      icon: '🏫',
      metadata: { userId, tab: 'verifications' }
    });
  }

  // Low stock alert (1–5 units remaining)
  static async notifyAdminLowStock(productName, productId, stock) {
    return this.notifyAdmins({
      type: 'admin_low_stock',
      title: '⚠️ Low Stock Alert',
      message: `"${productName}" is running low — only ${stock} unit${stock === 1 ? '' : 's'} left.`,
      link: `/admin-dashboard`,
      icon: '⚠️',
      metadata: { productId, stock, tab: 'products' }
    });
  }

  // Out of stock alert
  static async notifyAdminOutOfStock(productName, productId) {
    return this.notifyAdmins({
      type: 'admin_out_of_stock',
      title: '🚫 Out of Stock',
      message: `"${productName}" is now out of stock. Restock soon.`,
      link: `/admin-dashboard`,
      icon: '🚫',
      metadata: { productId, stock: 0, tab: 'products' }
    });
  }

  // After order or stock update — notify admins if thresholds crossed
  static async checkProductStockAlerts(product) {
    if (!product) return;
    const remaining = product.stock_quantity ?? product.stock ?? 0;
    if (remaining <= 0) {
      return this.notifyAdminOutOfStock(product.name, product.id);
    }
    if (remaining <= 5) {
      return this.notifyAdminLowStock(product.name, product.id, remaining);
    }
  }

  // Order delivered/confirmed by customer
  static async notifyAdminOrderDelivered(orderId, userName) {
    return this.notifyAdmins({
      type: 'admin_order_delivered',
      title: '✅ Order Delivery Confirmed',
      message: `${userName} confirmed receipt of Order #${orderId}.`,
      link: `/admin-dashboard`,
      icon: '✅',
      metadata: { orderId, tab: 'orders' }
    });
  }

  // Order cancelled by customer
  static async notifyAdminOrderCancelled(orderId, userName, amount) {
    return this.notifyAdmins({
      type: 'admin_order_cancelled',
      title: '❌ Order Cancelled',
      message: `${userName} cancelled Order #${orderId} (₹${amount}).`,
      link: `/admin-dashboard`,
      icon: '❌',
      metadata: { orderId, tab: 'orders' }
    });
  }

  // New item request submitted
  static async notifyAdminItemRequest(itemName, userName, requestId) {
    return this.notifyAdmins({
      type: 'admin_new_item_request',
      title: '📋 New Item Request',
      message: `${userName} requested "${itemName}" — not currently in catalog.`,
      link: `/admin-dashboard`,
      icon: '📋',
      metadata: { itemName, requestId, tab: 'item-requests' }
    });
  }

  // New book set request from institute
  static async notifyAdminNewBookSetRequest(requestId, instituteName, schoolName, grade, bookCount) {
    return this.notifyAdmins({
      type: 'admin_new_book_set_request',
      title: '📚 New Book Set Request',
      message: `${instituteName} submitted a request for ${schoolName} — Grade ${grade} (${bookCount} book${bookCount === 1 ? '' : 's'}).`,
      link: `/admin-dashboard`,
      icon: '📚',
      metadata: { requestId, schoolName, grade, tab: 'book-sets' }
    });
  }

  // Bulk Excel book set upload summary
  static async notifyAdminBulkBookSetRequests(count, instituteName) {
    return this.notifyAdmins({
      type: 'admin_new_book_set_request',
      title: `📚 ${count} Book Set Request${count === 1 ? '' : 's'} Uploaded`,
      message: `${instituteName} submitted ${count} book set request(s) via Excel. Review pending requests.`,
      link: `/admin-dashboard`,
      icon: '📚',
      metadata: { count, tab: 'book-sets' }
    });
  }

  // New donation listed
  static async notifyAdminNewDonation(donationId, title, donorName) {
    return this.notifyAdmins({
      type: 'admin_new_donation',
      title: '🎁 New Donation Listed',
      message: `${donorName} listed "${title}" on the donation board.`,
      link: `/admin-dashboard`,
      icon: '🎁',
      metadata: { donationId, tab: 'donations' }
    });
  }

  // Institute sent a chat message
  static async notifyAdminChatMessage(instituteName, preview, conversationId) {
    const text = preview && preview.length > 80 ? `${preview.slice(0, 80)}…` : preview;
    return this.notifyAdmins({
      type: 'admin_chat_message',
      title: '💬 New Institute Message',
      message: `${instituteName}: ${text || 'Sent a message'}`,
      link: `/admin-dashboard`,
      icon: '💬',
      metadata: { conversationId, tab: 'institute-chats' }
    });
  }
}

module.exports = NotificationService;
