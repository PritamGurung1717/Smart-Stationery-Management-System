// backend/routes/orderRoutes.js - COMPLETE UPDATED WITH /my-orders ROUTE
const express = require("express");
const Order = require("../models/order");
const Product = require("../models/product");
const User = require("../models/user");
const router = express.Router();
const { auth, adminAuth, instituteAuth } = require("../middleware/auth");

// ----------------- ORDER ROUTES -----------------

// Create new order
router.post("/", auth, async (req, res) => {
  try {
    console.log("=== ORDER CREATION START ===");
    console.log("User ID:", req.user.id);
    
    const { products, shippingAddress, paymentMethod, notes, orderType } = req.body;

    if (!products || !Array.isArray(products) || products.length === 0) {
      return res.status(400).json({
        success: false,
        message: "Products array is required and must not be empty",
      });
    }

    if (!shippingAddress || !shippingAddress.address || !shippingAddress.city || 
        !shippingAddress.state || !shippingAddress.zipCode) {
      return res.status(400).json({
        success: false,
        message: "Complete shipping address is required",
      });
    }

    let subtotal = 0;
    let discount = 0;
    const orderItems = [];

    for (const item of products) {
      let productId = item.productId;
      const numericProductId = Number(productId);
      
      if (isNaN(numericProductId) || numericProductId <= 0) {
        return res.status(400).json({
          success: false,
          message: `Invalid product ID: ${productId}. Must be a valid number.`,
        });
      }

      const product = await Product.findOne({ id: numericProductId });
      
      if (!product) {
        return res.status(404).json({
          success: false,
          message: `Product with ID ${numericProductId} not found`,
        });
      }

      const availableStock = product.stock !== undefined ? product.stock : 
                            product.stock_quantity !== undefined ? product.stock_quantity : 0;
      
      if (availableStock < item.quantity) {
        return res.status(400).json({
          success: false,
          message: `Insufficient stock for ${product.name}. Available: ${availableStock}, Requested: ${item.quantity}`,
        });
      }

      const itemSubtotal = product.price * item.quantity;
      subtotal += itemSubtotal;

      orderItems.push({
        product: product.id,
        productId: product.id,
        productName: product.name,
        quantity: item.quantity,
        unitPrice: product.price,
        subtotal: itemSubtotal,
      });

      if (product.stock !== undefined) {
        product.stock -= item.quantity;
      } else if (product.stock_quantity !== undefined) {
        product.stock_quantity -= item.quantity;
      }
      await product.save();
    }

    if (orderType === "bulk" && req.user.role === "institute") {
      discount = subtotal * 0.1;
    }

    const totalAmount = subtotal - discount;

    const lastOrder = await Order.findOne().sort({ id: -1 });
    const nextId = lastOrder ? lastOrder.id + 1 : 1;

    const order = new Order({
      id: nextId,
      user: req.user.id,
      institute: req.user.role === "institute" ? req.user.id : null,
      products: orderItems,
      subtotal,
      discount,
      totalAmount,
      shippingAddress,
      paymentMethod: paymentMethod || "cod",
      paymentStatus: paymentMethod === "cod" ? "pending" : "completed",
      orderStatus: "pending",
      orderType: orderType || "regular",
      orderDate: new Date(),
      statusHistory: [{ status: "pending", updated_by: null, note: "Order placed" }],
    });

    await order.save();

    res.status(201).json({
      success: true,
      message: "Order created successfully",
      order: {
        id: order.id,
        user: req.user.id,
        products: order.products,
        subtotal: order.subtotal,
        discount: order.discount,
        totalAmount: order.totalAmount,
        shippingAddress: order.shippingAddress,
        paymentMethod: order.paymentMethod,
        paymentStatus: order.paymentStatus,
        orderStatus: order.orderStatus,
        orderType: order.orderType,
        orderDate: order.orderDate,
        _id: order._id
      },
    });
  } catch (error) {
    console.error("Create order error:", error);
    res.status(500).json({
      success: false,
      message: "Order creation failed",
      error: error.message,
    });
  }
});

// Get all orders (Admin only) - FIXED: Manual population for integer IDs
router.get("/", adminAuth, async (req, res) => {
  try {
    const {
      page = 1,
      limit = 10,
      status = "",
      paymentStatus = "",
      orderType = "",
      startDate = "",
      endDate = "",
      search = "",
    } = req.query;

    const query = {};

    if (status && status !== "all") {
      query.orderStatus = status;
    }
    
    if (paymentStatus && paymentStatus !== "all") {
      query.paymentStatus = paymentStatus;
    }
    
    if (orderType && orderType !== "all") {
      query.orderType = orderType;
    }

    if (startDate || endDate) {
      query.orderDate = {};
      if (startDate) {
        const start = new Date(startDate);
        start.setHours(0, 0, 0, 0);
        query.orderDate.$gte = start;
      }
      if (endDate) {
        const end = new Date(endDate);
        end.setHours(23, 59, 59, 999);
        query.orderDate.$lte = end;
      }
    }

    // Get orders without populate
    let orders = await Order.find(query)
      .select('id user products subtotal discount totalAmount shippingAddress paymentMethod paymentStatus orderStatus orderType orderDate trackingNumber transactionId notes updatedAt createdAt')
      .sort({ orderDate: -1 });

    // Manual population: Get user details for each order
    const userIds = [...new Set(orders.map(order => order.user).filter(id => id))];
    const users = await User.find({ id: { $in: userIds } })
      .select('id name email phone role isVerified status');

    // Create a map of users by ID for quick lookup
    const userMap = {};
    users.forEach(user => {
      userMap[user.id] = {
        id: user.id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        role: user.role,
        isVerified: user.isVerified,
        status: user.status
      };
    });

    // Combine orders with user details
    const ordersWithUsers = orders.map(order => {
      const orderObj = order.toObject();
      orderObj.userDetails = userMap[order.user] || { id: order.user };
      return orderObj;
    });

    // Apply search filter if provided
    let filteredOrders = ordersWithUsers;
    if (search) {
      const searchLower = search.toLowerCase();
      filteredOrders = ordersWithUsers.filter(order => {
        // Search in order ID
        if (order.id.toString().includes(search)) {
          return true;
        }
        
        // Search in user name
        if (order.userDetails && order.userDetails.name && 
            order.userDetails.name.toLowerCase().includes(searchLower)) {
          return true;
        }
        
        // Search in user email
        if (order.userDetails && order.userDetails.email && 
            order.userDetails.email.toLowerCase().includes(searchLower)) {
          return true;
        }
        
        // Search in user phone
        if (order.userDetails && order.userDetails.phone && 
            order.userDetails.phone.includes(search)) {
          return true;
        }
        
        // Search in product names
        if (order.products && order.products.some(item => 
            item.productName && item.productName.toLowerCase().includes(searchLower))) {
          return true;
        }
        
        // Search in tracking number
        if (order.trackingNumber && order.trackingNumber.toLowerCase().includes(searchLower)) {
          return true;
        }
        
        return false;
      });
    }

    const total = filteredOrders.length;

    const startIndex = (parseInt(page) - 1) * parseInt(limit);
    const endIndex = startIndex + parseInt(limit);
    const paginatedOrders = filteredOrders.slice(startIndex, endIndex);

    const totalPages = Math.ceil(total / parseInt(limit));

    res.json({
      success: true,
      count: paginatedOrders.length,
      total,
      totalPages,
      currentPage: parseInt(page),
      orders: paginatedOrders,
    });
  } catch (error) {
    console.error("Get orders error:", error);
    res.status(500).json({
      success: false,
      message: "Error fetching orders",
      error: error.message,
    });
  }
});

// Get logged-in user's own orders (for user dashboard) - NEW ROUTE
router.get('/my-orders', auth, async (req, res) => {
  try {
    console.log("=== MY ORDERS REQUEST ===");
    console.log("User ID:", req.user.id);
    console.log("User Role:", req.user.role);
    console.log("Query params:", req.query);
    
    const { limit = 5, page = 1, status = '' } = req.query;
    
    // Build query for this user's orders only
    const query = { user: req.user.id };
    
    // Add status filter if provided
    if (status && status !== 'all') {
      query.orderStatus = status;
    }
    
    // Calculate pagination
    const skip = (parseInt(page) - 1) * parseInt(limit);
    
    // Get user's orders
    const orders = await Order.find(query)
      .sort({ orderDate: -1 })
      .skip(skip)
      .limit(parseInt(limit))
      .select('id products subtotal discount totalAmount shippingAddress paymentMethod paymentStatus orderStatus orderType orderDate trackingNumber');
    
    console.log(`Found ${orders.length} orders for user ${req.user.id}`);
    
    // If no orders found
    if (!orders || orders.length === 0) {
      return res.json({
        success: true,
        orders: [],
        total: 0,
        page: 1,
        totalPages: 0,
        message: "No orders found for your account."
      });
    }
    
    // Get total count for pagination
    const total = await Order.countDocuments(query);
    
    // Format orders with product details
    const formattedOrders = orders.map(order => {
      const orderObj = order.toObject();
      
      // Calculate item count
      orderObj.itemCount = orderObj.products.reduce((sum, item) => sum + item.quantity, 0);
      
      // Format date
      orderObj.formattedDate = new Date(orderObj.orderDate).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
      });
      
      // Status badge color
      const statusColors = {
        pending: 'warning',
        confirmed: 'info',
        processing: 'primary',
        shipped: 'success',
        delivered: 'success',
        cancelled: 'danger'
      };
      orderObj.statusColor = statusColors[orderObj.orderStatus] || 'secondary';
      
      return orderObj;
    });
    
    res.json({
      success: true,
      orders: formattedOrders,
      total,
      page: parseInt(page),
      totalPages: Math.ceil(total / parseInt(limit)),
      message: `Found ${formattedOrders.length} orders`
    });
    
  } catch (error) {
    console.error('Error fetching user orders:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching your orders',
      error: error.message
    });
  }
});

// Get all orders for admin dashboard (with user details) - NEW ROUTE
router.get('/admin/all', adminAuth, async (req, res) => {
  try {
    const { limit = 5, page = 1 } = req.query;
    
    // Calculate skip for pagination
    const skip = (parseInt(page) - 1) * parseInt(limit);
    
    // Get all orders
    const orders = await Order.find()
      .sort({ orderDate: -1 })
      .skip(skip)
      .limit(parseInt(limit))
      .select('id user products subtotal totalAmount paymentStatus orderStatus orderDate');
    
    // Get user details for each order
    const userIds = [...new Set(orders.map(order => order.user).filter(id => id))];
    const users = await User.find({ id: { $in: userIds } })
      .select('id name email');
    
    const userMap = {};
    users.forEach(user => {
      userMap[user.id] = {
        name: user.name,
        email: user.email
      };
    });
    
    // Combine orders with user details
    const ordersWithUsers = orders.map(order => {
      const orderObj = order.toObject();
      orderObj.userDetails = userMap[order.user] || { id: order.user };
      return orderObj;
    });
    
    // Get total count
    const total = await Order.countDocuments();
    
    res.json({
      success: true,
      orders: ordersWithUsers,
      total,
      page: parseInt(page),
      totalPages: Math.ceil(total / parseInt(limit))
    });
    
  } catch (error) {
    console.error('Error fetching admin orders:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching orders for admin',
      error: error.message
    });
  }
});

// Get order by ID
router.get("/:id", auth, async (req, res) => {
  try {
    const orderId = parseInt(req.params.id);
    
    if (isNaN(orderId) || orderId <= 0) {
      return res.status(400).json({
        success: false,
        message: "Invalid order ID.",
      });
    }

    const order = await Order.findOne({ id: orderId });
    if (!order) {
      return res.status(404).json({
        success: false,
        message: "Order not found",
      });
    }

    // Check if user has access
    if (order.user !== req.user.id && req.user.role !== "admin") {
      return res.status(403).json({
        success: false,
        message: "Access denied",
      });
    }

    // Get user details
    const user = await User.findOne({ id: order.user }).select('id name email phone role');

    res.json({
      success: true,
      order: {
        ...order.toObject(),
        userDetails: user || { id: order.user }
      },
    });
  } catch (error) {
    console.error("Get order error:", error);
    res.status(500).json({
      success: false,
      message: "Error fetching order",
      error: error.message,
    });
  }
});

// UPDATE ORDER STATUS - ADD THIS ROUTE
router.put("/:id", auth, async (req, res) => {
  try {
    const orderId = parseInt(req.params.id);
    
    if (isNaN(orderId) || orderId <= 0) {
      return res.status(400).json({
        success: false,
        message: "Invalid order ID.",
      });
    }

    const { orderStatus } = req.body;
    
    if (!orderStatus) {
      return res.status(400).json({
        success: false,
        message: "Order status is required.",
      });
    }

    const validStatuses = ["pending", "confirmed", "processing", "shipped", "delivered", "cancelled"];
    if (!validStatuses.includes(orderStatus)) {
      return res.status(400).json({
        success: false,
        message: `Invalid order status. Must be one of: ${validStatuses.join(", ")}`,
      });
    }

    const order = await Order.findOne({ id: orderId });
    if (!order) {
      return res.status(404).json({
        success: false,
        message: "Order not found",
      });
    }

    // Check if user is admin
    if (req.user.role !== "admin") {
      return res.status(403).json({
        success: false,
        message: "Only admin can update order status",
      });
    }

    order.orderStatus = orderStatus;
    order.updatedAt = new Date();
    order.statusHistory.push({ status: orderStatus, updated_by: req.user.id, note: `Status updated by admin` });
    await order.save();

    // Send notification to user
    try {
      const NotificationService = require('../services/notificationService');
      await NotificationService.createOrderNotification(order.user, order.id, orderStatus, order.totalAmount);
    } catch (e) { /* non-blocking */ }

    res.json({
      success: true,
      message: "Order status updated successfully",
      order: {
        id: order.id,
        orderStatus: order.orderStatus,
        updatedAt: order.updatedAt
      },
    });
  } catch (error) {
    console.error("Update order status error:", error);
    res.status(500).json({
      success: false,
      message: "Error updating order status",
      error: error.message,
    });
  }
});

// Process payment for order - USES INTEGER ID
router.post("/:id/process-payment", auth, async (req, res) => {
  try {
    const { paymentMethod, transactionId } = req.body;
    
    const orderId = parseInt(req.params.id);
    
    if (isNaN(orderId) || orderId <= 0) {
      return res.status(400).json({
        success: false,
        message: "Invalid order ID.",
      });
    }

    const order = await Order.findOne({ id: orderId });
    if (!order) {
      return res.status(404).json({
        success: false,
        message: "Order not found",
      });
    }

    if (order.user !== req.user.id && req.user.role !== "admin") {
      return res.status(403).json({
        success: false,
        message: "Access denied",
      });
    }

    if (order.paymentStatus === "completed") {
      return res.status(400).json({
        success: false,
        message: "Payment already completed",
      });
    }

    order.paymentMethod = paymentMethod;
    order.paymentStatus = "completed";
    order.transactionId = transactionId;
    order.updatedAt = new Date();

    await order.save();

    res.json({
      success: true,
      message: "Payment processed successfully",
      order,
    });
  } catch (error) {
    console.error("Process payment error:", error);
    res.status(500).json({
      success: false,
      message: "Error processing payment",
      error: error.message,
    });
  }
});

// Get order stats for admin dashboard
router.get("/stats/overview", adminAuth, async (req, res) => {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const firstDayOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);

    // Today's orders
    const todayOrders = await Order.find({
      orderDate: { $gte: today, $lt: tomorrow }
    });

    const todayStats = {
      count: todayOrders.length,
      revenue: todayOrders.reduce((sum, order) => sum + (order.totalAmount || 0), 0)
    };

    // Monthly orders
    const monthlyOrders = await Order.find({
      orderDate: { $gte: firstDayOfMonth }
    });

    const monthlyStats = {
      count: monthlyOrders.length,
      revenue: monthlyOrders.reduce((sum, order) => sum + (order.totalAmount || 0), 0)
    };

    // Orders by status
    const ordersByStatus = await Order.aggregate([
      {
        $group: {
          _id: "$orderStatus",
          count: { $sum: 1 },
          revenue: { $sum: "$totalAmount" }
        }
      },
      { $sort: { count: -1 } }
    ]);

    // Orders by payment status
    const ordersByPayment = await Order.aggregate([
      {
        $group: {
          _id: "$paymentStatus",
          count: { $sum: 1 },
          revenue: { $sum: "$totalAmount" }
        }
      },
      { $sort: { count: -1 } }
    ]);

    // Daily revenue for last 30 days
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const dailyRevenue = await Order.aggregate([
      {
        $match: {
          orderDate: { $gte: thirtyDaysAgo }
        }
      },
      {
        $group: {
          _id: {
            $dateToString: { format: "%Y-%m-%d", date: "$orderDate" }
          },
          revenue: { $sum: "$totalAmount" },
          count: { $sum: 1 }
        }
      },
      { $sort: { _id: 1 } }
    ]);

    res.json({
      success: true,
      stats: {
        today: todayStats,
        monthly: monthlyStats,
        byStatus: ordersByStatus,
        byPayment: ordersByPayment,
        dailyRevenue: dailyRevenue
      }
    });
  } catch (error) {
    console.error("Get stats error:", error);
    res.status(500).json({
      success: false,
      message: "Error fetching stats",
      error: error.message,
    });
  }
});

// ─── CANCEL ORDER (user, pending only) ───────────────────────────────────────
router.put("/:id/cancel", auth, async (req, res) => {
  try {
    const orderId = parseInt(req.params.id);
    const order = await Order.findOne({ id: orderId });
    if (!order) return res.status(404).json({ success: false, message: "Order not found" });
    if (order.user !== req.user.id && req.user.role !== "admin")
      return res.status(403).json({ success: false, message: "Access denied" });
    if (order.orderStatus !== "pending")
      return res.status(400).json({ success: false, message: "Only pending orders can be cancelled" });

    order.orderStatus = "cancelled";
    order.statusHistory.push({ status: "cancelled", updated_by: req.user.id, note: "Cancelled by user" });
    await order.save();

    // Notify user
    try {
      const NotificationService = require('../services/notificationService');
      await NotificationService.createOrderNotification(order.user, order.id, 'cancelled', order.totalAmount);
    } catch (e) { /* non-blocking */ }

    res.json({ success: true, message: "Order cancelled successfully", order });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// ─── CONFIRM DELIVERY (user, shipped only) ────────────────────────────────────
router.put("/:id/confirm-delivery", auth, async (req, res) => {
  try {
    const orderId = parseInt(req.params.id);
    const order = await Order.findOne({ id: orderId });
    if (!order) return res.status(404).json({ success: false, message: "Order not found" });
    if (order.user !== req.user.id)
      return res.status(403).json({ success: false, message: "Access denied" });
    if (order.orderStatus !== "shipped" && order.orderStatus !== "out_for_delivery")
      return res.status(400).json({ success: false, message: "Order must be shipped before confirming delivery" });

    order.orderStatus = "delivered";
    order.statusHistory.push({ status: "delivered", updated_by: req.user.id, note: "Delivery confirmed by customer" });
    await order.save();

    // Notify user
    try {
      const NotificationService = require('../services/notificationService');
      await NotificationService.createOrderNotification(order.user, order.id, 'delivered', order.totalAmount);
    } catch (e) { /* non-blocking */ }

    res.json({ success: true, message: "Delivery confirmed successfully", order });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// ─── ORDER TIMELINE ───────────────────────────────────────────────────────────
router.get("/:id/timeline", auth, async (req, res) => {
  try {
    const orderId = parseInt(req.params.id);
    const order = await Order.findOne({ id: orderId }).select('id user orderStatus statusHistory orderDate');
    if (!order) return res.status(404).json({ success: false, message: "Order not found" });
    if (order.user !== req.user.id && req.user.role !== "admin")
      return res.status(403).json({ success: false, message: "Access denied" });

    // If no history yet, synthesize from orderDate
    let timeline = order.statusHistory || [];
    if (timeline.length === 0) {
      timeline = [{ status: "pending", timestamp: order.orderDate, note: "Order placed" }];
    }

    res.json({ success: true, timeline, currentStatus: order.orderStatus });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// ─── INVOICE (inline HTML, printable) ────────────────────────────────────────
// Supports ?token= query param so it can be opened in a new browser tab
const invoiceAuth = async (req, res, next) => {
  // Allow token from query string for browser tab opens
  if (req.query.token && !req.headers.authorization) {
    req.headers.authorization = `Bearer ${req.query.token}`;
  }
  return auth(req, res, next);
};

router.get("/:id/invoice", invoiceAuth, async (req, res) => {
  try {
    const orderId = parseInt(req.params.id);
    const order = await Order.findOne({ id: orderId });
    if (!order) return res.status(404).json({ success: false, message: "Order not found" });
    if (order.user !== req.user.id && req.user.role !== "admin")
      return res.status(403).json({ success: false, message: "Access denied" });

    const user = await User.findOne({ id: order.user }).select('name email phone');
    const invoiceNumber = `INV-${String(order.id).padStart(6, '0')}`;
    const date = new Date(order.orderDate).toLocaleDateString('en-IN', { year: 'numeric', month: 'long', day: 'numeric' });

    const itemRows = (order.products || []).map(item => `
      <tr>
        <td style="padding:10px;border-bottom:1px solid #e5e7eb;">${item.productName}</td>
        <td style="padding:10px;border-bottom:1px solid #e5e7eb;text-align:center;">${item.quantity}</td>
        <td style="padding:10px;border-bottom:1px solid #e5e7eb;text-align:right;">₹${item.unitPrice}</td>
        <td style="padding:10px;border-bottom:1px solid #e5e7eb;text-align:right;">₹${item.subtotal}</td>
      </tr>`).join('');

    const html = `<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>Invoice ${invoiceNumber}</title>
  <link href="https://fonts.googleapis.com/css2?family=Instrument+Serif:ital@0;1&family=Inter:wght@400;500;600;700;800&display=swap" rel="stylesheet">
  <style>
    * { box-sizing: border-box; }
    body { font-family: 'Inter', sans-serif; margin: 0; padding: 32px 16px; color: #111; background: #fafafa; }
    .invoice { max-width: 780px; margin: 0 auto; background: #fff; border: 1px solid #e5e7eb; border-radius: 16px; overflow: hidden; }
    .header { background: #111; color: #fff; padding: 36px 40px; display: flex; justify-content: space-between; align-items: flex-start; }
    .brand { font-family: 'Instrument Serif', Georgia, serif; font-size: 1.75rem; font-weight: 400; letter-spacing: -0.02em; margin: 0; }
    .brand-sub { font-size: 0.8rem; color: rgba(255,255,255,0.5); margin-top: 4px; }
    .inv-meta { text-align: right; }
    .inv-meta .inv-label { font-size: 0.65rem; font-weight: 700; letter-spacing: 0.12em; text-transform: uppercase; color: rgba(255,255,255,0.5); margin-bottom: 4px; }
    .inv-meta .inv-number { font-size: 1.1rem; font-weight: 700; }
    .inv-meta .inv-date { font-size: 0.82rem; color: rgba(255,255,255,0.6); margin-top: 2px; }
    .body { padding: 36px 40px; }
    .info-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 28px; margin-bottom: 32px; padding-bottom: 32px; border-bottom: 1px solid #e5e7eb; }
    .info-box .box-label { font-size: 0.65rem; font-weight: 700; letter-spacing: 0.1em; text-transform: uppercase; color: #9ca3af; margin-bottom: 8px; }
    .info-box p { margin: 2px 0; font-size: 0.875rem; color: #374151; line-height: 1.5; }
    .info-box strong { color: #111; font-weight: 700; }
    table { width: 100%; border-collapse: collapse; margin-bottom: 24px; }
    thead tr { border-bottom: 2px solid #111; }
    thead th { padding: 10px 8px; text-align: left; font-size: 0.7rem; font-weight: 700; text-transform: uppercase; letter-spacing: 0.08em; color: #6b7280; }
    thead th:nth-child(2) { text-align: center; }
    thead th:nth-child(3), thead th:nth-child(4) { text-align: right; }
    tbody td { padding: 11px 8px; font-size: 0.875rem; color: #374151; border-bottom: 1px solid #f3f4f6; }
    tbody td:nth-child(2) { text-align: center; }
    tbody td:nth-child(3), tbody td:nth-child(4) { text-align: right; font-weight: 500; }
    .totals { margin-left: auto; width: 260px; padding-top: 16px; }
    .totals-row { display: flex; justify-content: space-between; padding: 5px 0; font-size: 0.875rem; color: #6b7280; }
    .totals-row.grand { border-top: 2px solid #111; margin-top: 8px; padding-top: 12px; font-weight: 800; font-size: 1rem; color: #111; }
    .totals-row.discount { color: #059669; }
    .badge { display: inline-block; padding: 3px 10px; border-radius: 20px; font-size: 0.72rem; font-weight: 700; }
    .badge-success { background: #d1fae5; color: #065f46; }
    .badge-warning { background: #fef3c7; color: #92400e; }
    .footer { background: #fafafa; border-top: 1px solid #e5e7eb; padding: 20px 40px; text-align: center; color: #9ca3af; font-size: 0.8rem; }
    @media print {
      body { padding: 0; background: #fff; }
      .invoice { border: none; border-radius: 0; }
      .no-print { display: none !important; }
    }
  </style>
</head>
<body>
  <div class="no-print" style="text-align:center;margin-bottom:24px;display:flex;justify-content:center;gap:12px;">
    <button onclick="window.print()" style="background:#111;color:#fff;border:none;padding:11px 28px;border-radius:8px;font-size:0.9rem;cursor:pointer;font-weight:600;font-family:'Inter',sans-serif;display:inline-flex;align-items:center;gap:8px;">
      🖨️ Print / Save as PDF
    </button>
    <button onclick="window.close()" style="background:#fff;color:#374151;border:1px solid #e5e7eb;padding:11px 28px;border-radius:8px;font-size:0.9rem;cursor:pointer;font-weight:600;font-family:'Inter',sans-serif;">
      Close
    </button>
  </div>

  <div class="invoice">
    <div class="header">
      <div>
        <div class="brand">smartstationery.</div>
        <div class="brand-sub">Order Invoice</div>
      </div>
      <div class="inv-meta">
        <div class="inv-label">Invoice</div>
        <div class="inv-number">${invoiceNumber}</div>
        <div class="inv-date">${date}</div>
      </div>
    </div>

    <div class="body">
      <div class="info-grid">
        <div class="info-box">
          <div class="box-label">Bill To</div>
          <p><strong>${user?.name || 'Customer'}</strong></p>
          <p>${user?.email || ''}</p>
          ${user?.phone ? `<p>${user.phone}</p>` : ''}
        </div>
        <div class="info-box">
          <div class="box-label">Ship To</div>
          <p>${order.shippingAddress?.address || '—'}</p>
          <p>${[order.shippingAddress?.city, order.shippingAddress?.state, order.shippingAddress?.zipCode].filter(Boolean).join(', ')}</p>
          <p>${order.shippingAddress?.country || ''}</p>
        </div>
        <div class="info-box">
          <div class="box-label">Order Details</div>
          <p>Order ID: <strong>ORD-${order.id}</strong></p>
          <p>Type: ${order.orderType}</p>
          <p>Status: <span class="badge ${order.orderStatus === 'delivered' ? 'badge-success' : 'badge-warning'}">${order.orderStatus}</span></p>
        </div>
        <div class="info-box">
          <div class="box-label">Payment</div>
          <p>Method: <strong>${(order.paymentMethod || '').toUpperCase()}</strong></p>
          <p>Status: <span class="badge ${order.paymentStatus === 'completed' ? 'badge-success' : 'badge-warning'}">${order.paymentStatus}</span></p>
          ${order.transactionId ? `<p style="font-size:0.8rem;color:#9ca3af;">Txn: ${order.transactionId}</p>` : ''}
        </div>
      </div>

      <table>
        <thead>
          <tr>
            <th>Product</th>
            <th>Qty</th>
            <th>Unit Price</th>
            <th>Total</th>
          </tr>
        </thead>
        <tbody>${itemRows}</tbody>
      </table>

      <div class="totals">
        <div class="totals-row"><span>Subtotal</span><span>₹${order.subtotal}</span></div>
        ${order.discount > 0 ? `<div class="totals-row discount"><span>Discount</span><span>−₹${order.discount}</span></div>` : ''}
        <div class="totals-row grand"><span>Total</span><span>₹${order.totalAmount}</span></div>
      </div>
    </div>

    <div class="footer">
      Thank you for your order — smartstationery. &nbsp;·&nbsp; support@smartstationery.com
    </div>
  </div>
</body>
</html>`;

    res.setHeader('Content-Type', 'text/html');
    res.send(html);
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

module.exports = router;