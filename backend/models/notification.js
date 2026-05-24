// backend/models/notification.js
const mongoose = require('mongoose');

const notificationSchema = new mongoose.Schema({
  user_id: {
    type: Number,
    required: true,
    index: true
  },
  type: {
    type: String,
    required: true,
    enum: [
      'order_placed',
      'order_status_changed',
      'order_payment_success',
      'donation_request_received',
      'donation_request_accepted',
      'donation_request_rejected',
      'book_set_approved',
      'book_set_rejected',
      'verification_approved',
      'verification_rejected',
      'new_message',
      'chat_message',
      'product_low_stock',
      'product_out_of_stock',
      // Admin-targeted notification types
      'admin_new_order',
      'admin_new_payment',
      'admin_new_verification',
      'admin_low_stock',
      'admin_out_of_stock',
      'admin_order_delivered',
      'admin_order_cancelled',
      'admin_new_item_request',
      'admin_new_book_set_request',
      'admin_new_donation',
      'admin_chat_message'
    ]
  },
  title: {
    type: String,
    required: true
  },
  message: {
    type: String,
    required: true
  },
  link: {
    type: String,
    default: null
  },
  icon: {
    type: String,
    default: '🔔'
  },
  is_read: {
    type: Boolean,
    default: false
  },
  metadata: {
    type: mongoose.Schema.Types.Mixed,
    default: {}
  },
  created_at: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

// Compound index to prevent duplicate notifications for the same order payment
notificationSchema.index(
  { user_id: 1, type: 1, link: 1 }, 
  { 
    unique: true,
    partialFilterExpression: { 
      type: 'order_payment_success',
      link: { $exists: true }
    }
  }
);

// Index for faster queries
notificationSchema.index({ user_id: 1, is_read: 1, created_at: -1 });

const Notification = mongoose.model('Notification', notificationSchema);

module.exports = Notification;
