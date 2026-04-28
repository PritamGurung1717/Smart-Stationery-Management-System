// backend/models/conversation.js
const mongoose = require("mongoose");

const conversationSchema = new mongoose.Schema(
  {
    id: { type: Number, unique: true, required: true },
    institute_id: { type: Number, required: true, ref: "User", index: true },
    admin_id:     { type: Number, required: true, ref: "User", index: true },
    last_message: { type: String, default: null },
    last_message_at: { type: Date, default: null },
    created_at:   { type: Date, default: Date.now },
    updated_at:   { type: Date, default: Date.now },
  },
  {
    timestamps: { createdAt: "created_at", updatedAt: "updated_at" },
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

conversationSchema.index({ institute_id: 1, admin_id: 1 }, { unique: true });

conversationSchema.virtual("institute", {
  ref: "User", localField: "institute_id", foreignField: "id", justOne: true,
});
conversationSchema.virtual("admin", {
  ref: "User", localField: "admin_id", foreignField: "id", justOne: true,
});

module.exports = mongoose.model("Conversation", conversationSchema);
