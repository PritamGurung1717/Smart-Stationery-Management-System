// backend/models/order.js
const mongoose = require("mongoose");
require('./counter');

const orderItemSchema = new mongoose.Schema({
  product: { type: mongoose.Schema.Types.Mixed, ref: "Product", required: true },
  productId: { type: Number, required: true },
  productName: { type: String, required: true },
  quantity: { type: Number, required: true, min: 1 },
  unitPrice: { type: Number, required: true, min: 0 },
  subtotal: { type: Number, required: true, min: 0 },
  createdAt: { type: Date, default: Date.now },
});

const statusHistorySchema = new mongoose.Schema({
  status: {
    type: String,
    enum: ["pending", "confirmed", "preparing", "shipped", "out_for_delivery", "delivered", "cancelled"],
    required: true,
  },
  updated_by: { type: Number, default: null },
  note: { type: String, default: '' },
  timestamp: { type: Date, default: Date.now },
});

const orderSchema = new mongoose.Schema(
  {
    id: { type: Number, unique: true },
    user: { type: Number, ref: "User", required: true },
    institute: { type: Number, ref: "User", default: null },
    products: [orderItemSchema],
    subtotal: { type: Number, required: true, min: 0 },
    discount: { type: Number, default: 0, min: 0 },
    totalAmount: { type: Number, required: true, min: 0 },
    shippingAddress: {
      address: String, city: String, state: String, zipCode: String, country: String,
    },
    paymentMethod: {
      type: String,
      enum: ["esewa", "khalti", "cod"],
      default: "cod",
      required: true,
    },
    paymentStatus: {
      type: String,
      enum: ["pending", "completed", "failed"],
      default: "pending",
    },
    orderStatus: {
      type: String,
      enum: ["pending", "confirmed", "preparing", "shipped", "out_for_delivery", "delivered", "cancelled"],
      default: "pending",
    },
    orderType: { type: String, enum: ["regular", "bulk"], default: "regular" },
    statusHistory: [statusHistorySchema],
    trackingNumber: { type: String },
    transactionId: { type: String },
    notes: { type: String },
    orderDate: { type: Date, default: Date.now },
    updatedAt: { type: Date, default: Date.now },
  },
  { timestamps: true, toJSON: { virtuals: true }, toObject: { virtuals: true } }
);

orderSchema.statics.getNextOrderId = async function () {
  const Counter = mongoose.model("Counter");
  const counter = await Counter.findByIdAndUpdate(
    { _id: "orderId" },
    { $inc: { sequence_value: 1 } },
    { new: true, upsert: true }
  );
  return counter.sequence_value;
};

orderSchema.pre("save", async function (next) {
  if (this.isNew && !this.id) {
    this.id = await mongoose.model("Order").getNextOrderId();
  }
  next();
});

orderSchema.pre("save", function (next) {
  this.updatedAt = new Date();
  next();
});

orderSchema.virtual("formattedDate").get(function () {
  return this.orderDate.toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" });
});

orderSchema.virtual("statusColor").get(function () {
  const colors = {
    pending: "warning", confirmed: "info", preparing: "primary",
    shipped: "success", out_for_delivery: "success", delivered: "success", cancelled: "danger",
  };
  return colors[this.orderStatus] || "secondary";
});

orderSchema.statics.findById = function (id) {
  const parsedId = parseInt(id);
  if (!isNaN(parsedId)) return this.findOne({ id: parsedId });
  return this.findOne({ _id: id });
};

module.exports = mongoose.model("Order", orderSchema);
