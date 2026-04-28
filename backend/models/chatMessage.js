// backend/models/chatMessage.js
const mongoose = require("mongoose");

const chatMessageSchema = new mongoose.Schema(
  {
    id:              { type: Number, unique: true, required: true },
    conversation_id: { type: Number, required: true, ref: "Conversation", index: true },
    sender_id:       { type: Number, required: true, ref: "User", index: true },
    message_text:    { type: String, default: null, trim: true, maxlength: 2000 },
    file_url:        { type: String, default: null },
    file_type:       { type: String, enum: ["image", "pdf", "csv", null], default: null },
    file_name:       { type: String, default: null },
    is_read:         { type: Boolean, default: false, index: true },
    created_at:      { type: Date, default: Date.now, index: true },
  },
  {
    timestamps: { createdAt: "created_at", updatedAt: false },
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

chatMessageSchema.index({ conversation_id: 1, created_at: 1 });
chatMessageSchema.index({ conversation_id: 1, is_read: 1, sender_id: 1 });

chatMessageSchema.virtual("sender", {
  ref: "User", localField: "sender_id", foreignField: "id", justOne: true,
});

module.exports = mongoose.model("ChatMessage", chatMessageSchema);
