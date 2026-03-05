// backend/models/donationRequest.js
const mongoose = require("mongoose");

const donationRequestSchema = new mongoose.Schema(
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
    requester_id: {
      type: Number,
      required: true,
      ref: "User",
      index: true,
    },
    message: {
      type: String,
      required: [true, "Message is required"],
      trim: true,
      minlength: [10, "Message must be at least 10 characters"],
      maxlength: [500, "Message cannot exceed 500 characters"],
    },
    status: {
      type: String,
      required: true,
      enum: ["pending", "accepted", "rejected"],
      default: "pending",
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

// Virtual for requester information
donationRequestSchema.virtual("requester", {
  ref: "User",
  localField: "requester_id",
  foreignField: "id",
  justOne: true,
});

// Virtual for donation information
donationRequestSchema.virtual("donation", {
  ref: "Donation",
  localField: "donation_id",
  foreignField: "id",
  justOne: true,
});

// Compound index to prevent duplicate requests
donationRequestSchema.index({ donation_id: 1, requester_id: 1 }, { unique: true });

// Index for querying
donationRequestSchema.index({ donation_id: 1, status: 1 });
donationRequestSchema.index({ requester_id: 1, status: 1 });

// Custom findById that works with integer ID
donationRequestSchema.statics.findById = function (id) {
  const parsedId = parseInt(id);
  if (!isNaN(parsedId)) {
    return this.findOne({ id: parsedId });
  }
  return this.findOne({ _id: id });
};

// Method to check if request can be accepted
donationRequestSchema.methods.canAccept = function () {
  return this.status === "pending";
};

// Method to check if request can be rejected
donationRequestSchema.methods.canReject = function () {
  return this.status === "pending";
};

module.exports = mongoose.model("DonationRequest", donationRequestSchema);
