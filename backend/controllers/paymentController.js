// backend/controllers/paymentController.js
const Order = require("../models/order");
const Payment = require("../models/payment");
const { verifyKhaltiPayment } = require("../services/khaltiService");
const NotificationService = require("../services/notificationService");

/**
 * POST /api/payment/khalti/initiate
 * Validates the order and returns public key + order details for Khalti checkout.
 */
const initiateKhaltiPayment = async (req, res) => {
  try {
    const { orderId } = req.body;

    if (!orderId) {
      return res.status(400).json({ success: false, message: "orderId is required." });
    }

    const order = await Order.findOne({ id: Number(orderId) });
    if (!order) {
      return res.status(404).json({ success: false, message: "Order not found." });
    }

    // Ensure the order belongs to the requesting user
    if (order.user !== req.user.id) {
      return res.status(403).json({ success: false, message: "Access denied. This order does not belong to you." });
    }

    // Only allow khalti payment method
    if (order.paymentMethod !== "khalti") {
      return res.status(400).json({ success: false, message: "This order is not set up for Khalti payment." });
    }

    // Prevent re-payment of already paid orders
    if (order.paymentStatus === "completed") {
      return res.status(400).json({ success: false, message: "This order has already been paid." });
    }

    if (!process.env.KHALTI_PUBLIC_KEY) {
      return res.status(500).json({ success: false, message: "Khalti public key is not configured." });
    }

    return res.status(200).json({
      success: true,
      publicKey: process.env.KHALTI_PUBLIC_KEY,
      order: {
        id: order.id,
        totalAmount: order.totalAmount,
        amountInPaisa: Math.round(order.totalAmount * 100), // convert to paisa
      },
    });
  } catch (error) {
    console.error("Khalti initiate error:", error);
    return res.status(500).json({ success: false, message: "Failed to initiate payment.", error: error.message });
  }
};

/**
 * POST /api/payment/khalti/verify
 * Verifies the Khalti payment token with Khalti's server, then updates order.
 */
const verifyKhaltiPaymentHandler = async (req, res) => {
  const { token, amount, orderId } = req.body;

  // --- Input validation ---
  if (!token || !amount || !orderId) {
    return res.status(400).json({
      success: false,
      error: "Missing required fields",
      details: "token, amount, and orderId are all required.",
    });
  }

  const amountNum = Number(amount);
  if (isNaN(amountNum) || amountNum <= 0) {
    return res.status(400).json({
      success: false,
      error: "Invalid amount",
      details: "Amount must be a positive number (in paisa).",
    });
  }

  try {
    // --- Duplicate verification guard ---
    const existingPayment = await Payment.findOne({ khaltiToken: token });
    if (existingPayment) {
      if (existingPayment.status === "success") {
        return res.status(400).json({
          success: false,
          error: "Payment already used",
          details: "This payment token has already been verified.",
        });
      }
    }

    // --- Load and validate order ---
    const order = await Order.findOne({ id: Number(orderId) });
    if (!order) {
      return res.status(404).json({ success: false, error: "Order not found", details: `No order with id ${orderId}.` });
    }

    if (order.user !== req.user.id) {
      return res.status(403).json({ success: false, error: "Unauthorized", details: "This order does not belong to you." });
    }

    if (order.paymentStatus === "completed") {
      return res.status(400).json({ success: false, error: "Already paid", details: "This order has already been paid." });
    }

    // --- Amount mismatch check (compare paisa) ---
    const expectedPaisa = Math.round(order.totalAmount * 100);
    if (amountNum !== expectedPaisa) {
      // Log suspicious activity
      console.warn(`⚠️  Amount mismatch for order ${orderId}: expected ${expectedPaisa}, got ${amountNum} (user: ${req.user.id})`);

      // Record failed payment attempt
      await Payment.create({
        orderId: order.id,
        userId: req.user.id,
        paymentMethod: "khalti",
        khaltiToken: token,
        amount: amountNum,
        status: "failed",
        rawResponse: { error: "amount_mismatch", expected: expectedPaisa, received: amountNum },
      }).catch(() => {}); // non-blocking

      return res.status(402).json({
        success: false,
        error: "Payment failed",
        details: "Amount mismatch. Payment cannot be verified.",
      });
    }

    // --- Call Khalti verification API ---
    let khaltiResponse;
    try {
      khaltiResponse = await verifyKhaltiPayment(token, amountNum);
    } catch (khaltiError) {
      const statusCode = khaltiError.response?.status;
      const khaltiMsg = khaltiError.response?.data?.detail || khaltiError.response?.data?.token?.[0] || khaltiError.message;

      // Record failed payment
      await Payment.create({
        orderId: order.id,
        userId: req.user.id,
        paymentMethod: "khalti",
        khaltiToken: token,
        amount: amountNum,
        status: "failed",
        rawResponse: khaltiError.response?.data || { error: khaltiError.message },
      }).catch(() => {});

      if (statusCode === 400) {
        return res.status(402).json({ success: false, error: "Payment verification failed", details: khaltiMsg || "Invalid token." });
      }
      if (statusCode === 401) {
        return res.status(401).json({ success: false, error: "Unauthorized", details: "Invalid Khalti secret key." });
      }
      if (khaltiError.code === "ECONNABORTED" || khaltiError.code === "ETIMEDOUT") {
        return res.status(500).json({ success: false, error: "Timeout", details: "Khalti server did not respond in time. Please try again." });
      }
      return res.status(500).json({ success: false, error: "Khalti server error", details: khaltiMsg || "Could not reach Khalti." });
    }

    // --- SUCCESS: Update order ---
    order.paymentStatus = "completed";
    order.orderStatus = "confirmed";
    order.transactionId = khaltiResponse.idx;
    order.statusHistory.push({
      status: "confirmed",
      updated_by: req.user.id,
      note: `Payment confirmed via Khalti. Transaction ID: ${khaltiResponse.idx}`,
    });
    await order.save();

    // --- Record payment in payments collection ---
    await Payment.create({
      orderId: order.id,
      userId: req.user.id,
      paymentMethod: "khalti",
      khaltiToken: token,
      transactionId: khaltiResponse.idx,
      amount: amountNum,
      status: "success",
      rawResponse: khaltiResponse,
    });

    // --- Send notification (non-blocking) ---
    NotificationService.createOrderNotification(req.user.id, order.id, "placed", order.totalAmount).catch(() => {});

    return res.status(200).json({
      success: true,
      message: "Payment successful",
      transaction_id: khaltiResponse.idx,
      order: {
        id: order.id,
        orderStatus: order.orderStatus,
        paymentStatus: order.paymentStatus,
        transactionId: order.transactionId,
      },
    });
  } catch (error) {
    console.error("Khalti verify error:", error);
    return res.status(500).json({ success: false, error: "Server error", details: error.message });
  }
};

module.exports = { initiateKhaltiPayment, verifyKhaltiPaymentHandler };
