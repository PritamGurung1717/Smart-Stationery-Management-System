// backend/models/donationChat.js
const mongoose = require("mongoose");

const donationChatSchema = new mongoose.Schema(
  {
    id: {
      type: Number,
      unique: true,
      required: true,
    },
    donation_id: {
      type: Number,
      required: true,
      ref: "Donation",
      index: true,
    },
    sender_id: {
      type: Number,
      required: true,
      ref: "User",
      index: true,
    },
    receiver_id: {
      type: Number,
      required: true,
      ref: "User",
      index: true,
    },
    message: {
      type: String,
      required: [true, "Message is required"],
      trim: true,
      maxlength: [1000, "Message cannot exceed 1000 characters"],
    },
    attachment_url: {
      type: String,
      default: null,
      maxlength: [500, "Attachment URL too long"],
    },
    is_read: {
      type: Boolean,
      default: false,
      index: true,
    },
    created_at: {
      type: Date,
      default: Date.now,
      index: true,
    },
  },
  {
    timestamps: { createdAt: "created_at", updatedAt: false },
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// Virtual for sender information
donationChatSchema.virtual("sender", {
  ref: "User",
  localField: "sender_id",
  foreignField: "id",
  justOne: true,
});

// Virtual for receiver information
donationChatSchema.virtual("receiver", {
  ref: "User",
  localField: "receiver_id",
  foreignField: "id",
  justOne: true,
});

// Compound indexes for efficient querying
donationChatSchema.index({ donation_id: 1, created_at: 1 });
donationChatSchema.index({ donation_id: 1, receiver_id: 1, is_read: 1 });
donationChatSchema.index({ sender_id: 1, receiver_id: 1, donation_id: 1 });

// Custom findById that works with integer ID
donationChatSchema.statics.findById = function (id) {
  const parsedId = parseInt(id);
  if (!isNaN(parsedId)) {
    return this.findOne({ id: parsedId });
  }
  return this.findOne({ _id: id });
};

// Static method to get unread count for a user in a donation
donationChatSchema.statics.getUnreadCount = async function (donationId, userId) {
  return await this.countDocuments({
    donation_id: donationId,
    receiver_id: userId,
    is_read: false,
  });
};

// Static method to mark all messages as read
donationChatSchema.statics.markAllAsRead = async function (donationId, userId) {
  return await this.updateMany(
    {
      donation_id: donationId,
      receiver_id: userId,
      is_read: false,
    },
    {
      $set: { is_read: true },
    }
  );
};

module.exports = mongoose.model("DonationChat", donationChatSchema);
