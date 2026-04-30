// backend/controllers/paymentController.js
const Order = require("../models/order");
const Payment = require("../models/payment");
const User = require("../models/user");
const { initiateKhaltiPayment, lookupKhaltiPayment } = require("../services/khaltiService");
const NotificationService = require("../services/notificationService");

/**
 * POST /api/payment/khalti/initiate
 * Initiates a real Khalti ePay session and returns payment_url for redirect.
 */
const initiateKhaltiPaymentHandler = async (req, res) => {
  try {
    const { orderId } = req.body;

    console.log("🟢 Khalti initiate request for order:", orderId);

    if (!orderId) {
      return res.status(400).json({ success: false, message: "orderId is required." });
    }

    const order = await Order.findOne({ id: Number(orderId) });
    if (!order) {
      console.log("❌ Order not found:", orderId);
      return res.status(404).json({ success: false, message: "Order not found." });
    }

    console.log("🟢 Order found:", {
      id: order.id,
      paymentMethod: order.paymentMethod,
      paymentStatus: order.paymentStatus,
      totalAmount: order.totalAmount
    });

    // Ensure the order belongs to the requesting user
    if (order.user !== req.user.id) {
      return res.status(403).json({ success: false, message: "Access denied. This order does not belong to you." });
    }

    // Only allow khalti payment method
    if (order.paymentMethod !== "khalti") {
      console.log("❌ Wrong payment method:", order.paymentMethod);
      return res.status(400).json({ success: false, message: "This order is not set up for Khalti payment." });
    }

    // Prevent re-payment of already paid orders
    if (order.paymentStatus === "completed") {
      console.log("❌ Order already paid");
      return res.status(400).json({ success: false, message: "This order has already been paid." });
    }

    // Get user details for customer_info
    const user = await User.findOne({ id: req.user.id });
    if (!user) {
      return res.status(404).json({ success: false, message: "User not found." });
    }

    // Prepare Khalti ePay initiate payload
    const amountInPaisa = Math.round(order.totalAmount * 100);
    const paymentData = {
      return_url: `${process.env.FRONTEND_URL}/payment/verify/${order.id}`,
      website_url: process.env.FRONTEND_URL || "http://localhost:5173",
      amount: amountInPaisa,
      purchase_order_id: `ORD-${order.id}`,
      purchase_order_name: `SSMS Order #${order.id}`,
      customer_info: {
        name: user.name || "Customer",
        email: user.email || "",
        phone: user.phone || "",
      },
    };

    console.log("🟢 Calling Khalti API with:", paymentData);

    // Call Khalti initiate API
    const khaltiResponse = await initiateKhaltiPayment(paymentData);

    console.log("🟢 Khalti response:", khaltiResponse);

    // Record payment initiation
    await Payment.create({
      orderId: order.id,
      userId: req.user.id,
      paymentMethod: "khalti",
      pidx: khaltiResponse.pidx,
      amount: amountInPaisa,
      status: "initiated",
      rawResponse: khaltiResponse,
    });

    console.log("🟢 Payment record created. Returning payment URL:", khaltiResponse.payment_url);

    return res.status(200).json({
      success: true,
      payment_url: khaltiResponse.payment_url,
      pidx: khaltiResponse.pidx,
      expires_at: khaltiResponse.expires_at,
      expires_in: khaltiResponse.expires_in,
    });
  } catch (error) {
    console.error("❌ Khalti initiate error:", error);
    const khaltiMsg = error.response?.data?.detail || error.response?.data?.error_key || error.message;
    return res.status(500).json({
      success: false,
      message: "Failed to initiate payment.",
      error: khaltiMsg,
    });
  }
};

/**
 * POST /api/payment/khalti/verify
 * Verifies the Khalti payment using pidx after user returns from Khalti.
 */
const verifyKhaltiPaymentHandler = async (req, res) => {
  const { pidx, orderId } = req.body;

  // --- Input validation ---
  if (!pidx || !orderId) {
    return res.status(400).json({
      success: false,
      error: "Missing required fields",
      details: "pidx and orderId are required.",
    });
  }

  try {
    // --- Duplicate verification guard ---
    const existingPayment = await Payment.findOne({ pidx });
    if (existingPayment && existingPayment.status === "success") {
      return res.status(400).json({
        success: false,
        error: "Payment already verified",
        details: "This payment has already been processed.",
      });
    }

    // --- Load and validate order ---
    const order = await Order.findOne({ id: Number(orderId) });
    if (!order) {
      return res.status(404).json({
        success: false,
        error: "Order not found",
        details: `No order with id ${orderId}.`,
      });
    }

    if (order.user !== req.user.id) {
      return res.status(403).json({
        success: false,
        error: "Unauthorized",
        details: "This order does not belong to you.",
      });
    }

    if (order.paymentStatus === "completed") {
      return res.status(400).json({
        success: false,
        error: "Already paid",
        details: "This order has already been paid.",
      });
    }

    // --- Call Khalti lookup API ---
    let khaltiResponse;
    try {
      khaltiResponse = await lookupKhaltiPayment(pidx);
    } catch (khaltiError) {
      const statusCode = khaltiError.response?.status;
      const khaltiMsg =
        khaltiError.response?.data?.detail ||
        khaltiError.response?.data?.error_key ||
        khaltiError.message;

      // Update payment record as failed
      if (existingPayment) {
        existingPayment.status = "failed";
        existingPayment.rawResponse = khaltiError.response?.data || { error: khaltiError.message };
        await existingPayment.save();
      }

      if (statusCode === 400) {
        return res.status(402).json({
          success: false,
          error: "Payment verification failed",
          details: khaltiMsg || "Invalid pidx.",
        });
      }
      if (statusCode === 401) {
        return res.status(401).json({
          success: false,
          error: "Unauthorized",
          details: "Invalid Khalti secret key.",
        });
      }
      if (khaltiError.code === "ECONNABORTED" || khaltiError.code === "ETIMEDOUT") {
        return res.status(500).json({
          success: false,
          error: "Timeout",
          details: "Khalti server did not respond in time. Please try again.",
        });
      }
      return res.status(500).json({
        success: false,
        error: "Khalti server error",
        details: khaltiMsg || "Could not reach Khalti.",
      });
    }

    // --- Validate payment status from Khalti ---
    if (khaltiResponse.status !== "Completed") {
      // Update payment as failed
      if (existingPayment) {
        existingPayment.status = "failed";
        existingPayment.rawResponse = khaltiResponse;
        await existingPayment.save();
      }

      return res.status(402).json({
        success: false,
        error: "Payment not completed",
        details: `Payment status: ${khaltiResponse.status}`,
      });
    }

    // --- Amount verification ---
    const expectedPaisa = Math.round(order.totalAmount * 100);
    if (khaltiResponse.total_amount !== expectedPaisa) {
      console.warn(
        `⚠️  Amount mismatch for order ${orderId}: expected ${expectedPaisa}, got ${khaltiResponse.total_amount} (user: ${req.user.id})`
      );

      if (existingPayment) {
        existingPayment.status = "failed";
        existingPayment.rawResponse = {
          ...khaltiResponse,
          error: "amount_mismatch",
          expected: expectedPaisa,
        };
        await existingPayment.save();
      }

      return res.status(402).json({
        success: false,
        error: "Payment failed",
        details: "Amount mismatch. Payment cannot be verified.",
      });
    }

    // --- SUCCESS: Update order ---
    order.paymentStatus = "completed";
    order.orderStatus = "confirmed";
    order.transactionId = khaltiResponse.transaction_id;
    order.statusHistory.push({
      status: "confirmed",
      updated_by: req.user.id,
      note: `Payment confirmed via Khalti. Transaction ID: ${khaltiResponse.transaction_id}`,
    });
    await order.save();

    console.log("🟢 Order updated successfully:", {
      id: order.id,
      paymentStatus: order.paymentStatus,
      orderStatus: order.orderStatus,
      transactionId: order.transactionId
    });

    // --- Update payment record ---
    if (existingPayment) {
      existingPayment.status = "success";
      existingPayment.transactionId = khaltiResponse.transaction_id;
      existingPayment.rawResponse = khaltiResponse;
      await existingPayment.save();
    } else {
      await Payment.create({
        orderId: order.id,
        userId: req.user.id,
        paymentMethod: "khalti",
        pidx,
        transactionId: khaltiResponse.transaction_id,
        amount: khaltiResponse.total_amount,
        status: "success",
        rawResponse: khaltiResponse,
      });
    }

    // --- Send notification (non-blocking) - with duplicate check using upsert ---
    try {
      console.log("🟡 Creating/updating notification for order:", order.id);
      
      const Notification = require("../models/notification");
      
      // Use findOneAndUpdate with upsert to prevent duplicates atomically
      const notificationData = {
        user_id: req.user.id,
        type: "order_payment_success",
        title: "Payment Successful! 🎉",
        message: `Your payment of ₹${order.totalAmount} for Order #${order.id} has been confirmed. Transaction ID: ${khaltiResponse.transaction_id}`,
        link: `/orders/${order.id}`,
        icon: "✅",
        is_read: false,
      };
      
      // Atomic upsert - creates if doesn't exist, updates if exists
      const notification = await Notification.findOneAndUpdate(
        {
          user_id: req.user.id,
          type: "order_payment_success",
          link: `/orders/${order.id}`
        },
        notificationData,
        {
          upsert: true,  // Create if doesn't exist
          new: true,     // Return the updated document
          setDefaultsOnInsert: true
        }
      );
      
      console.log("🟢 Notification created/updated successfully:", notification._id);
    } catch (notifErr) {
      console.error("❌ Failed to send notification:");
      console.error("Error name:", notifErr.name);
      console.error("Error message:", notifErr.message);
      console.error("Full error:", notifErr);
      // Don't fail the payment if notification fails
    }

    // --- Send email (non-blocking) ---
    try {
      const user = await User.findOne({ id: req.user.id });
      if (user && user.email) {
        console.log("🟡 Sending email to:", user.email);
        const sendEmail = require("../utils/sendEmail");
        const emailHtml = `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
            <div style="text-align: center; margin-bottom: 30px;">
              <h1 style="color: #111; font-size: 28px; margin: 0;">smart stationery.</h1>
              <p style="color: #6b7280; margin: 5px 0;">Smart Stationery Management System</p>
            </div>
            
            <div style="background: #16a34a; color: white; padding: 20px; border-radius: 8px; text-align: center; margin-bottom: 30px;">
              <h2 style="margin: 0; font-size: 24px;">✅ Payment Successful!</h2>
            </div>
            
            <p style="color: #374151; font-size: 16px; line-height: 1.6;">Dear ${user.name},</p>
            
            <p style="color: #374151; font-size: 16px; line-height: 1.6;">
              Your payment has been successfully processed via Khalti. Thank you for your order!
            </p>
            
            <div style="background: #f3f4f6; padding: 25px; border-radius: 8px; margin: 25px 0;">
              <h3 style="margin: 0 0 15px 0; color: #111; font-size: 18px;">Order Details</h3>
              <table style="width: 100%; border-collapse: collapse;">
                <tr>
                  <td style="padding: 8px 0; color: #6b7280; font-size: 14px;">Order ID:</td>
                  <td style="padding: 8px 0; color: #111; font-weight: 600; text-align: right;">#${order.id}</td>
                </tr>
                <tr>
                  <td style="padding: 8px 0; color: #6b7280; font-size: 14px;">Amount Paid:</td>
                  <td style="padding: 8px 0; color: #111; font-weight: 600; text-align: right;">₹${order.totalAmount}</td>
                </tr>
                <tr>
                  <td style="padding: 8px 0; color: #6b7280; font-size: 14px;">Transaction ID:</td>
                  <td style="padding: 8px 0; color: #111; font-weight: 600; text-align: right;">${khaltiResponse.transaction_id}</td>
                </tr>
                <tr>
                  <td style="padding: 8px 0; color: #6b7280; font-size: 14px;">Payment Method:</td>
                  <td style="padding: 8px 0; color: #111; font-weight: 600; text-align: right;">Khalti</td>
                </tr>
                <tr>
                  <td style="padding: 8px 0; color: #6b7280; font-size: 14px;">Payment Status:</td>
                  <td style="padding: 8px 0; color: #16a34a; font-weight: 600; text-align: right;">✅ Completed</td>
                </tr>
                <tr>
                  <td style="padding: 8px 0; color: #6b7280; font-size: 14px;">Order Status:</td>
                  <td style="padding: 8px 0; color: #2563eb; font-weight: 600; text-align: right;">Confirmed</td>
                </tr>
              </table>
            </div>
            
            <div style="background: #eff6ff; border-left: 4px solid #2563eb; padding: 15px; margin: 25px 0;">
              <p style="margin: 0; color: #1e40af; font-size: 14px;">
                <strong>📦 What's Next?</strong><br>
                Your order is now confirmed and will be processed shortly. We'll notify you once it's shipped.
              </p>
            </div>
            
            <div style="text-align: center; margin: 30px 0;">
              <a href="${process.env.FRONTEND_URL}/orders/${order.id}" 
                 style="display: inline-block; background: #111; color: white; padding: 12px 30px; text-decoration: none; border-radius: 6px; font-weight: 600;">
                View Order Details
              </a>
            </div>
            
            <p style="color: #374151; font-size: 16px; line-height: 1.6;">
              Thank you for shopping with Smart Stationery!
            </p>
            
            <hr style="margin: 30px 0; border: none; border-top: 1px solid #e5e7eb;">
            
            <p style="color: #9ca3af; font-size: 12px; text-align: center; margin: 0;">
              This is an automated email. Please do not reply to this message.<br>
              © 2026 Smart Stationery Management System. All rights reserved.
            </p>
          </div>
        `;
        
        await sendEmail(
          user.email,
          "Payment Successful - Order Confirmed",
          emailHtml
        );
        console.log("🟢 Email sent successfully to:", user.email);
      } else {
        console.log("⚠️  User or email not found, skipping email");
      }
    } catch (emailErr) {
      console.error("⚠️  Failed to send email:", emailErr.message);
      // Don't fail the payment if email fails
    }

    return res.status(200).json({
      success: true,
      message: "Payment successful",
      redirectUrl: `/orders/${order.id}`,
      transaction_id: khaltiResponse.transaction_id,
      orderDetails: {
        id: order.id,
        orderStatus: order.orderStatus,
        paymentStatus: order.paymentStatus,
        transactionId: order.transactionId,
        totalAmount: order.totalAmount,
        items: order.items,
        shippingAddress: order.shippingAddress,
      },
    });
  } catch (error) {
    console.error("Khalti verify error:", error);
    return res.status(500).json({
      success: false,
      error: "Server error",
      details: error.message,
    });
  }
};

module.exports = { initiateKhaltiPaymentHandler, verifyKhaltiPaymentHandler };
