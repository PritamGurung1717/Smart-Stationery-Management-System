// backend/models/payment.js
const mongoose = require("mongoose");

const paymentSchema = new mongoose.Schema(
  {
    orderId: { type: Number, required: true, ref: "Order" },
    userId: { type: Number, required: true, ref: "User" },
    paymentMethod: { type: String, default: "khalti" },
    khaltiToken: { type: String },
    transactionId: { type: String },
    amount: { type: Number, required: true }, // in paisa
    status: { type: String, enum: ["success", "failed", "pending"], default: "pending" },
    rawResponse: { type: mongoose.Schema.Types.Mixed },
    createdAt: { type: Date, default: Date.now },
  },
  { timestamps: true }
);

// Prevent duplicate successful verifications for the same token
paymentSchema.index({ khaltiToken: 1 }, { unique: true, sparse: true });

module.exports = mongoose.model("Payment", paymentSchema);
