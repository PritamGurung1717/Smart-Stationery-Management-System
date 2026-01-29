// backend/routes/userRoutes.js - UPDATED WITH INTEGER IDs
const express = require("express");
const User = require("../models/user");
const Product = require("../models/product");
const router = express.Router();
const nodemailer = require("nodemailer");
const { auth, adminAuth, instituteAuth } = require("../middleware/auth");

// Gmail transporter for sending OTP and notifications
const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

// ---------------- PUBLIC ROUTES ----------------

// ---------------- REGISTER ----------------
router.post("/register", async (req, res) => {
  try {
    const { name, email, password, role, phone, address } = req.body;

    // Prevent admin registration from public endpoint
    if (role === "admin") {
      return res.status(400).json({
        success: false,
        message: "Admin registration is not allowed from this endpoint",
      });
    }

    const existing = await User.findOne({ email });
    if (existing)
      return res.status(400).json({ success: false, message: "Email already exists" });

    const user = new User({ name, email, password, role: role || "personal", phone, address });

    // Generate OTP
    const otp = user.generateOTP();
    await user.save();

    // Generate token for immediate login after OTP
    const token = await user.generateAuthToken();

    // Send OTP email
    await transporter.sendMail({
      to: email,
      subject: "Verify OTP - Smart Stationery",
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #2c3e50;">Smart Stationery - Email Verification</h2>
          <p>Hello ${name},</p>
          <p>Thank you for registering. Use the following OTP to verify your email:</p>
          <div style="background-color: #f8f9fa; padding: 20px; text-align: center; margin: 20px 0; border-radius: 8px;">
            <h1 style="color: #3498db; margin: 0; letter-spacing: 10px;">${otp}</h1>
          </div>
          <p>This OTP will expire in 10 minutes.</p>
          <p>If you didn't request this, ignore this email.</p>
          <hr>
          <p style="color: #7f8c8d; font-size: 12px;">Smart Stationery © 2025</p>
        </div>
      `,
    });

    res.json({
      success: true,
      message: "OTP sent to email",
      email,
      token,
      user: { id: user.id, name: user.name, email: user.email, role: user.role },
    });
  } catch (err) {
    console.error("Registration error:", err);
    const message =
      err.name === "ValidationError"
        ? Object.values(err.errors).map((v) => v.message).join(", ")
        : err.message;
    res.status(400).json({ success: false, message });
  }
});

// ---------------- RESEND OTP ----------------
router.post("/resend-otp", async (req, res) => {
  try {
    const { email } = req.body;
    const user = await User.findOne({ email });
    if (!user) return res.status(404).json({ success: false, message: "User not found" });

    const otp = user.generateOTP();
    await user.save();

    await transporter.sendMail({
      to: email,
      subject: "New OTP - Smart Stationery",
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #2c3e50;">Smart Stationery - New OTP Request</h2>
          <p>Hello ${user.name},</p>
          <p>You requested a new OTP. Here it is:</p>
          <div style="background-color: #f8f9fa; padding: 20px; text-align: center; margin: 20px 0; border-radius: 8px;">
            <h1 style="color: #3498db; margin: 0; letter-spacing: 10px;">${otp}</h1>
          </div>
          <p>This OTP will expire in 10 minutes.</p>
          <p>If you didn't request this, ignore this email.</p>
          <hr>
          <p style="color: #7f8c8d; font-size: 12px;">Smart Stationery © 2025</p>
        </div>
      `,
    });

    res.json({ success: true, message: "New OTP sent to your email", email });
  } catch (err) {
    console.error("Resend OTP error:", err);
    res.status(500).json({ success: false, message: "Failed to resend OTP", error: err.message });
  }
});

// ---------------- VERIFY OTP ----------------
router.post("/verify-otp", async (req, res) => {
  try {
    const { email, otp } = req.body;
    const user = await User.findOne({ email });
    if (!user) return res.status(404).json({ success: false, message: "User not found" });

    if (user.otp !== otp || user.otpExpires < Date.now()) {
      return res.status(400).json({ success: false, message: "Invalid or expired OTP" });
    }

    user.isVerified = true;
    user.otp = null;
    user.otpExpires = null;
    const token = await user.generateAuthToken();
    await user.save();

    res.json({
      success: true,
      message: "OTP verified successfully",
      user: { id: user.id, name: user.name, email: user.email, role: user.role, isVerified: user.isVerified, status: user.status },
      token,
    });
  } catch (err) {
    console.error("OTP verification error:", err);
    res.status(500).json({ success: false, message: "OTP verification failed", error: err.message });
  }
});

// Login route
router.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;

    // Admin login fix
    if (email === "admin@gmail.com" && password === "Admin123@") {
      let adminUser = await User.findOne({ email: "admin@gmail.com" });
      if (!adminUser) {
        adminUser = new User({
          name: "Super Admin",
          email: "admin@gmail.com",
          password: "Admin123@",
          role: "admin",
          isVerified: true,
          status: "active",
          phone: "0000000000",
          address: "Admin Headquarters",
        });
        await adminUser.save();
      }
      const token = await adminUser.generateAuthToken();
      return res.json({
        success: true,
        message: "Admin login successful",
        user: { 
          id: adminUser.id, 
          name: adminUser.name, 
          email: adminUser.email, 
          role: adminUser.role, 
          isVerified: adminUser.isVerified, 
          status: adminUser.status 
        },
        token,
      });
    }

    // Find user by email
    const user = await User.findOne({ email });
    
    if (!user) {
      return res.status(400).json({ 
        success: false, 
        message: "Invalid email or password" 
      });
    }

    // Check if user is suspended
    if (user.status === "suspended") {
      return res.status(403).json({
        success: false,
        message: "Your account has been suspended. Please contact admin.",
      });
    }

    // Compare password
    const isMatch = await user.comparePassword(password);
    
    if (!isMatch) {
      return res.status(400).json({ 
        success: false, 
        message: "Invalid email or password" 
      });
    }

    if (!user.isVerified)
      return res.status(400).json({ 
        success: false, 
        message: "Please verify your email first" 
      });

    if (user.role === "institute") {
      if (!user.instituteVerification || user.instituteVerification.status !== "approved") {
        return res.status(403).json({
          success: false,
          message: "Institute account pending verification. Please wait for admin approval.",
          needsVerification: true,
        });
      }
    }

    const token = await user.generateAuthToken();

    res.json({
      success: true,
      message: "Login successful",
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        isVerified: user.isVerified,
        status: user.status,
        instituteVerification: user.instituteVerification,
        instituteInfo: user.instituteInfo,
        phone: user.phone,
        address: user.address,
        createdAt: user.createdAt,
      },
      token,
    });
  } catch (err) {
    console.error("Login error:", err);
    res.status(400).json({ 
      success: false, 
      message: err.message || "Login failed" 
    });
  }
});

// ---------------- LOGOUT ----------------
router.post("/logout", auth, async (req, res) => {
  try {
    req.user.tokens = req.user.tokens.filter((token) => token.token !== req.token);
    await req.user.save();
    res.json({ success: true, message: "Logged out successfully" });
  } catch (err) {
    console.error("Logout error:", err);
    res.status(500).json({ success: false, message: "Logout failed", error: err.message });
  }
});

// ---------------- GET CURRENT USER PROFILE ----------------
router.get("/profile", auth, async (req, res) => {
  try {
    res.json({ success: true, user: req.user });
  } catch (err) {
    console.error("Get profile error:", err);
    res.status(500).json({ success: false, message: "Error fetching profile", error: err.message });
  }
});

// ---------------- UPDATE USER PROFILE ----------------
router.put("/profile", auth, async (req, res) => {
  try {
    const updates = Object.keys(req.body);
    const allowedUpdates = ["name", "phone", "address"];
    const isValidOperation = updates.every((update) => allowedUpdates.includes(update));
    if (!isValidOperation) return res.status(400).json({ success: false, message: "Invalid updates!" });

    updates.forEach((update) => (req.user[update] = req.body[update]));
    await req.user.save();
    res.json({ success: true, message: "Profile updated successfully", user: req.user });
  } catch (err) {
    console.error("Update profile error:", err);
    res.status(400).json({ success: false, message: err.message });
  }
});

// ---------------- CHANGE PASSWORD ----------------
router.put("/change-password", auth, async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;
    if (!currentPassword || !newPassword)
      return res.status(400).json({ success: false, message: "Current password and new password are required." });

    const isMatch = await req.user.comparePassword(currentPassword);
    if (!isMatch) return res.status(400).json({ success: false, message: "Current password is incorrect." });

    req.user.password = newPassword;
    await req.user.save();
    res.json({ success: true, message: "Password changed successfully. Please login again." });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
});

// ================ ADMIN ROUTES ================

// Create user (including admin)
router.post("/admin/users/create", adminAuth, async (req, res) => {
  try {
    const { name, email, password, role, phone, address } = req.body;

    if (role === 'admin' && req.user.role !== 'admin') {
      return res.status(403).json({ success: false, message: "Only admins can create admin accounts" });
    }

    const existing = await User.findOne({ email });
    if (existing) return res.status(400).json({ success: false, message: "Email already exists" });

    const user = new User({ name, email, password, role: role || "personal", phone, address, isVerified: true });
    await user.save();

    res.json({ 
      success: true, 
      message: "User created successfully", 
      user: { 
        id: user.id, 
        name: user.name, 
        email: user.email, 
        role: user.role, 
        status: user.status, 
        isVerified: user.isVerified 
      } 
    });

  } catch (err) {
    console.error("Create user error:", err);
    res.status(500).json({ success: false, message: "User creation failed", error: err.message });
  }
});

// Get all users (with pagination & search)
router.get("/admin/users", adminAuth, async (req, res) => {
  try {
    const { page = 1, limit = 10, search = '', role = '', status = '' } = req.query;
    const query = {};

    // Enhanced search functionality
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
        { phone: { $regex: search, $options: 'i' } },
        { 'address': { $regex: search, $options: 'i' } },
      ];
      
      // Also search by user ID if search looks like an ID
      if (!isNaN(search)) {
        query.$or.push({ id: Number(search) });
      }
    }
    
    if (role && role !== 'all') query.role = role;
    if (status && status !== 'all') query.status = status;

    const users = await User.find(query)
      .select("-password -tokens -otp -otpExpires")
      .sort({ createdAt: -1 })
      .limit(parseInt(limit))
      .skip((parseInt(page)-1)*parseInt(limit));
      
    const total = await User.countDocuments(query);
    const totalPages = Math.ceil(total / parseInt(limit));

    res.json({ 
      success: true, 
      count: users.length, 
      total, 
      totalPages, 
      currentPage: parseInt(page), 
      users 
    });

  } catch (err) {
    console.error("Get all users error:", err);
    res.status(500).json({ success: false, message: "Error fetching users", error: err.message });
  }
});

// Get user by ID
router.get("/admin/users/:id", adminAuth, async (req, res) => {
  try {
    const user = await User.findOne({ id: Number(req.params.id) }).select("-password -tokens -otp -otpExpires");
    if (!user) return res.status(404).json({ success: false, message: "User not found" });
    res.json({ success: true, user });
  } catch (err) {
    console.error("Get user by ID error:", err);
    res.status(500).json({ success: false, message: "Error fetching user", error: err.message });
  }
});

// Update user
router.put("/admin/users/:id", adminAuth, async (req, res) => {
  try {
    const { name, email, role, status, phone, address } = req.body;
    const user = await User.findOne({ id: Number(req.params.id) });
    if (!user) return res.status(404).json({ success: false, message: "User not found" });

    if (user.id === req.user.id && status === 'suspended') {
      return res.status(400).json({ success: false, message: "You cannot suspend your own account" });
    }

    if (name) user.name = name;
    if (email) user.email = email;
    if (role) user.role = role;
    if (status) user.status = status;
    if (phone !== undefined) user.phone = phone;
    if (address !== undefined) user.address = address;

    await user.save();
    res.json({ 
      success: true, 
      message: "User updated successfully", 
      user: { 
        id: user.id, 
        name: user.name, 
        email: user.email, 
        role: user.role, 
        status: user.status, 
        phone: user.phone, 
        address: user.address 
      } 
    });

  } catch (err) {
    console.error("Update user error:", err);
    res.status(400).json({ success: false, message: err.message });
  }
});

// Delete user
router.delete("/admin/users/:id", adminAuth, async (req, res) => {
  try {
    const user = await User.findOne({ id: Number(req.params.id) });
    if (!user) return res.status(404).json({ success: false, message: "User not found" });
    if (user.id === req.user.id) return res.status(400).json({ success: false, message: "You cannot delete your own account" });

    await User.findOneAndDelete({ id: Number(req.params.id) });
    res.json({ success: true, message: "User deleted successfully" });

  } catch (err) {
    console.error("Delete user error:", err);
    res.status(500).json({ success: false, message: "Error deleting user", error: err.message });
  }
});

// Get pending institute verifications
router.get("/admin/verifications/pending", adminAuth, async (req, res) => {
  try {
    const { search = '' } = req.query;
    
    let query = { 
      role: "institute", 
      $or: [
        { "instituteVerification.status": "pending" },
        { "instituteVerification": { $exists: false } }
      ]
    };
    
    // Add search functionality for verifications
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
        { 'instituteVerification.instituteName': { $regex: search, $options: 'i' } },
        { 'instituteInfo.schoolName': { $regex: search, $options: 'i' } },
      ];
    }
    
    const pendingUsers = await User.find(query)
      .select("-password -tokens -otp -otpExpires")
      .sort({ createdAt: -1 });
    
    res.json({ 
      success: true, 
      count: pendingUsers.length, 
      pendingVerifications: pendingUsers 
    });
  } catch (err) {
    console.error("Get pending verifications error:", err);
    res.status(500).json({ success: false, message: "Error fetching pending verifications", error: err.message });
  }
});

// Update verification status
router.put("/admin/verifications/:id/status", adminAuth, async (req, res) => {
  try {
    const { status, comments } = req.body;
    const user = await User.findOne({ id: Number(req.params.id) });
    
    if (!user) {
      return res.status(404).json({ 
        success: false, 
        message: "User not found" 
      });
    }
    
    if (user.role !== "institute") {
      return res.status(400).json({ 
        success: false, 
        message: "User is not an institute" 
      });
    }

    // Initialize instituteVerification if it doesn't exist
    if (!user.instituteVerification) {
      user.instituteVerification = {
        instituteName: user.instituteInfo?.schoolName || user.name,
        status: "pending",
        documents: []
      };
    }

    user.instituteVerification.status = status;
    if (comments) user.instituteVerification.comments = comments;
    user.instituteVerification.verifiedBy = req.user.id;
    user.instituteVerification.verifiedAt = new Date();

    await user.save();

    // Email notification
    if (user.email) {
      await transporter.sendMail({
        to: user.email,
        subject: `Institute Verification ${status}`,
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h2 style="color: #2c3e50;">Institute Verification Update</h2>
            <p>Hello ${user.name},</p>
            <p>Your institute verification has been <strong>${status}</strong>.</p>
            ${comments ? `<p><strong>Comments:</strong> ${comments}</p>` : ""}
            <p>If you have any questions, please contact our support team.</p>
            <hr>
            <p style="color: #7f8c8d; font-size: 12px;">Smart Stationery © 2025</p>
          </div>
        `
      });
    }

    res.json({ 
      success: true, 
      message: `Verification ${status} successfully`, 
      user: { 
        id: user.id, 
        name: user.name, 
        email: user.email, 
        instituteVerification: user.instituteVerification 
      } 
    });

  } catch (err) {
    console.error("Update verification error:", err);
    res.status(500).json({ 
      success: false, 
      message: "Error updating verification", 
      error: err.message 
    });
  }
});

// ----------------- CART ROUTES -----------------

// Get cart
router.get("/cart", auth, async (req, res) => {
  try {
    const user = await User.findOne({ id: req.user.id }).populate(
      "cart.items.product",
      "id name price image category stock"
    );

    res.json({
      success: true,
      cart: user.cart || { items: [] },
      cartTotal: user.cartTotal,
      cartItemCount: user.cartItemCount,
    });
  } catch (err) {
    console.error("Get cart error:", err);
    res.status(500).json({
      success: false,
      message: "Error fetching cart",
      error: err.message,
    });
  }
});

// Add to cart - FIXED for integer IDs
router.post("/cart/add", auth, async (req, res) => {
  try {
    const { productId, quantity = 1 } = req.body;
    console.log("Cart add request - productId:", productId, "type:", typeof productId);

    if (!productId) {
      return res.status(400).json({
        success: false,
        message: "Product ID is required",
      });
    }

    // Convert to number if it's a string
    const productIdNum = Number(productId);
    await req.user.addToCart(productIdNum, parseInt(quantity));

    const user = await User.findOne({ id: req.user.id }).populate(
      "cart.items.product",
      "id name price image"
    );

    res.json({
      success: true,
      message: "Product added to cart",
      cart: user.cart,
      cartTotal: user.cartTotal,
      cartItemCount: user.cartItemCount,
    });
  } catch (err) {
    console.error("Add to cart error:", err);
    res.status(400).json({
      success: false,
      message: err.message,
    });
  }
});

// Update cart item quantity
router.put("/cart/update", auth, async (req, res) => {
  try {
    const { productId, quantity } = req.body;

    if (!productId || quantity === undefined) {
      return res.status(400).json({
        success: false,
        message: "Product ID and quantity are required",
      });
    }

    const productIdNum = Number(productId);
    await req.user.updateCartQuantity(productIdNum, parseInt(quantity));

    const user = await User.findOne({ id: req.user.id }).populate(
      "cart.items.product",
      "id name price image"
    );

    res.json({
      success: true,
      message: "Cart updated",
      cart: user.cart,
      cartTotal: user.cartTotal,
      cartItemCount: user.cartItemCount,
    });
  } catch (err) {
    console.error("Update cart error:", err);
    res.status(400).json({
      success: false,
      message: err.message,
    });
  }
});

// Remove from cart
router.delete("/cart/remove/:productId", auth, async (req, res) => {
  try {
    const productIdNum = Number(req.params.productId);
    await req.user.removeFromCart(productIdNum);

    const user = await User.findOne({ id: req.user.id }).populate(
      "cart.items.product",
      "id name price image"
    );

    res.json({
      success: true,
      message: "Item removed from cart",
      cart: user.cart,
      cartTotal: user.cartTotal,
      cartItemCount: user.cartItemCount,
    });
  } catch (err) {
    console.error("Remove from cart error:", err);
    res.status(400).json({
      success: false,
      message: err.message,
    });
  }
});

// Clear cart
router.delete("/cart/clear", auth, async (req, res) => {
  try {
    await req.user.clearCart();

    res.json({
      success: true,
      message: "Cart cleared",
      cart: { items: [] },
      cartTotal: 0,
      cartItemCount: 0,
    });
  } catch (err) {
    console.error("Clear cart error:", err);
    res.status(500).json({
      success: false,
      message: "Error clearing cart",
      error: err.message,
    });
  }
});

// ----------------- INSTITUTE ROUTES -----------------

// Submit institute verification
router.post(
  "/institute/verification/submit",
  instituteAuth,
  async (req, res) => {
    try {
      const {
        instituteName,
        invoiceNumber,
        panNumber,
        gstNumber,
        contactNumber,
        schoolName,
        type,
        address,
        contactPerson,
        phone,
        email,
        grades,
      } = req.body;

      // Validate required fields
      if (
        !instituteName ||
        !invoiceNumber ||
        !panNumber ||
        !contactNumber ||
        !schoolName
      ) {
        return res.status(400).json({
          success: false,
          message:
            "Institute name, invoice number, PAN number, contact number, and school name are required",
        });
      }

      // Parse grades if provided
      let gradesArray = [];
      if (grades) {
        gradesArray = Array.isArray(grades) ? grades : grades.split(",");
      }

      // Update institute verification info
      req.user.instituteVerification = {
        instituteName,
        invoiceNumber,
        panNumber,
        gstNumber: gstNumber || "",
        contactNumber,
        documents: [],
        status: "pending",
      };

      // Update institute info
      req.user.instituteInfo = {
        schoolName,
        type: type || "school",
        address: address || "",
        contactPerson: contactPerson || "",
        phone: phone || "",
        email: email || "",
        grades: gradesArray,
        bookSets: [],
      };

      await req.user.save();

      res.json({
        success: true,
        message: "Verification request submitted successfully",
        verification: req.user.instituteVerification,
        instituteInfo: req.user.instituteInfo,
      });
    } catch (err) {
      console.error("Submit verification error:", err);
      res.status(500).json({
        success: false,
        message: "Verification submission failed",
        error: err.message,
      });
    }
  }
);

// Add book set request
router.post("/institute/book-sets/add", instituteAuth, async (req, res) => {
  try {
    const { grade, bookName, publication, quantity, price } = req.body;

    if (!grade || !bookName || !publication || !quantity) {
      return res.status(400).json({
        success: false,
        message: "Grade, book name, publication, and quantity are required",
      });
    }

    if (!req.user.instituteInfo) {
      req.user.instituteInfo = {
        schoolName: "",
        type: "school",
        address: "",
        contactPerson: "",
        phone: "",
        email: "",
        grades: [],
        bookSets: [],
      };
    }

    const bookSet = {
      grade,
      bookName,
      publication,
      quantity: parseInt(quantity),
      price: price ? parseFloat(price) : null,
      status: "pending",
    };

    req.user.instituteInfo.bookSets.push(bookSet);
    await req.user.save();

    res.json({
      success: true,
      message: "Book set request added successfully",
      bookSet,
    });
  } catch (err) {
    console.error("Add book set error:", err);
    res.status(500).json({
      success: false,
      message: "Failed to add book set",
      error: err.message,
    });
  }
});

// Get institute dashboard stats
router.get("/institute/dashboard", instituteAuth, async (req, res) => {
  try {
    const Order = require("../models/order");

    // Get order statistics
    const orderStats = await Order.aggregate([
      {
        $match: {
          user: req.user.id,
          orderType: "bulk",
        },
      },
      {
        $group: {
          _id: "$orderStatus",
          count: { $sum: 1 },
          totalAmount: { $sum: "$totalAmount" },
        },
      },
    ]);

    // Get recent orders
    const recentOrders = await Order.find({
      user: req.user.id,
      orderType: "bulk",
    })
      .sort({ orderDate: -1 })
      .limit(5)
      .populate("products.product", "name image");

    // Get book set requests
    const bookSetRequests = req.user.instituteInfo?.bookSets || [];

    res.json({
      success: true,
      stats: {
        totalOrders: orderStats.reduce((sum, stat) => sum + stat.count, 0),
        totalSpent: orderStats.reduce((sum, stat) => sum + stat.totalAmount, 0),
        pendingOrders:
          orderStats.find((stat) => stat._id === "pending")?.count || 0,
        deliveredOrders:
          orderStats.find((stat) => stat._id === "delivered")?.count || 0,
      },
      recentOrders,
      bookSetRequests,
      verificationStatus: req.user.instituteVerification?.status || "pending",
    });
  } catch (err) {
    console.error("Get institute dashboard error:", err);
    res.status(500).json({
      success: false,
      message: "Error fetching dashboard data",
      error: err.message,
    });
  }
});

module.exports = router;