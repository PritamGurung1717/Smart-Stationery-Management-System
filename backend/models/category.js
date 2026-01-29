// backend/models/Category.js - FIXED VERSION
const mongoose = require("mongoose");

const categorySchema = new mongoose.Schema(
  {
    id: { // Custom integer ID
      type: Number,
      unique: true
      // No required: true - we handle ID manually in route
    },
    name: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      lowercase: true,
      maxlength: 50
    },
    description: {
      type: String,
      trim: true,
      maxlength: 200,
    },
    created_at: {
      type: Date,
      default: Date.now,
    },
    updated_at: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' }
  }
);

// NO PRE-SAVE HOOKS - ID is handled manually in routes
module.exports = mongoose.model("Category", categorySchema);