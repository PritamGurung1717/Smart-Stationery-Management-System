// backend/models/donation.js
const mongoose = require("mongoose");

const donationSchema = new mongoose.Schema(
  {
    id: {
      type: Number,
      unique: true,
      required: true,
    },
    donor_id: {
      type: Number,
      required: true,
      ref: "User",
      index: true,
    },
    title: {
      type: String,
      required: [true, "Title is required"],
      trim: true,
      minlength: [5, "Title must be at least 5 characters"],
      maxlength: [100, "Title cannot exceed 100 characters"],
    },
    description: {
      type: String,
      required: [true, "Description is required"],
      trim: true,
      minlength: [10, "Description must be at least 10 characters"],
      maxlength: [1000, "Description cannot exceed 1000 characters"],
    },
    category: {
      type: String,
      required: [true, "Category is required"],
      enum: {
        values: ["books", "stationery", "electronics", "furniture", "other"],
        message: "{VALUE} is not a valid category",
      },
      lowercase: true,
    },
    condition: {
      type: String,
      required: [true, "Condition is required"],
      enum: {
        values: ["new", "like_new", "good", "used"],
        message: "{VALUE} is not a valid condition",
      },
      lowercase: true,
    },
    images: {
      type: [String],
      validate: {
        validator: function (v) {
          return v && v.length > 0 && v.length <= 5;
        },
        message: "At least 1 image is required (maximum 5 images)",
      },
    },
    status: {
      type: String,
      required: true,
      enum: ["available", "reserved", "completed", "cancelled"],
      default: "available",
      index: true,
    },
    pickup_location: {
      type: String,
      required: [true, "Pickup location is required"],
      trim: true,
      maxlength: [200, "Pickup location cannot exceed 200 characters"],
    },
    accepted_requester_id: {
      type: Number,
      ref: "User",
      default: null,
    },
    created_at: {
      type: Date,
      default: Date.now,
      index: true,
    },
    updated_at: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: { createdAt: "created_at", updatedAt: "updated_at" },
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// Virtual for donor information
donationSchema.virtual("donor", {
  ref: "User",
  localField: "donor_id",
  foreignField: "id",
  justOne: true,
});

// Virtual for accepted requester information
donationSchema.virtual("accepted_requester", {
  ref: "User",
  localField: "accepted_requester_id",
  foreignField: "id",
  justOne: true,
});

// Index for search and filtering
donationSchema.index({ title: "text", description: "text" });
donationSchema.index({ category: 1, status: 1 });
donationSchema.index({ donor_id: 1, status: 1 });

// Custom findById that works with integer ID
donationSchema.statics.findById = function (id) {
  const parsedId = parseInt(id);
  if (!isNaN(parsedId)) {
    return this.findOne({ id: parsedId });
  }
  return this.findOne({ _id: id });
};

// Method to check if user is the donor
donationSchema.methods.isDonor = function (userId) {
  return this.donor_id === userId;
};

// Method to check if donation can be edited
donationSchema.methods.canEdit = function () {
  return this.status === "available";
};

// Method to check if donation can be requested
donationSchema.methods.canRequest = function (userId) {
  return this.status === "available" && this.donor_id !== userId;
};

// Method to check if user can chat
donationSchema.methods.canChat = function (userId) {
  return (
    this.status === "reserved" &&
    (this.donor_id === userId || this.accepted_requester_id === userId)
  );
};

module.exports = mongoose.model("Donation", donationSchema);
