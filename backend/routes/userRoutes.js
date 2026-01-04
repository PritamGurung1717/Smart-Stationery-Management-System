const express = require("express");
const User = require("../models/user");
const router = express.Router();
const nodemailer = require("nodemailer");
const { auth, adminAuth } = require("../middleware/auth");

// Gmail transporter
const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

// ---------------- REGISTER ----------------
router.post("/register", async (req, res) => {
  try {
    const { name, email, password, role, phone, address } = req.body;

    // Prevent admin registration from public endpoint
    if (role === 'admin') {
      return res.status(400).json({ 
        success: false,
        message: "Admin registration is not allowed from this endpoint" 
      });
    }

    const existing = await User.findOne({ email });
    if (existing)
      return res.status(400).json({ 
        success: false,
        message: "Email already exists" 
      });

    const user = new User({ 
      name, 
      email, 
      password, 
      role: role || "personal",
      phone,
      address
    });

    const otp = user.generateOTP();
    await user.save();

    // Generate JWT token for immediate login after OTP verification
    const token = await user.generateAuthToken();

    // Send OTP email
    await transporter.sendMail({
      to: email,
      subject: "Verify OTP - Smart Stationery",
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #2c3e50;">Smart Stationery - Email Verification</h2>
          <p>Hello ${name},</p>
          <p>Thank you for registering with Smart Stationery. Please use the following OTP to verify your email:</p>
          <div style="background-color: #f8f9fa; padding: 20px; text-align: center; margin: 20px 0; border-radius: 8px;">
            <h1 style="color: #3498db; margin: 0; letter-spacing: 10px;">${otp}</h1>
          </div>
          <p>This OTP will expire in 10 minutes.</p>
          <p>If you didn't request this, please ignore this email.</p>
          <hr>
          <p style="color: #7f8c8d; font-size: 12px;">Smart Stationery © 2025</p>
        </div>
      `
    });

    res.json({ 
      success: true,
      message: "OTP sent to email", 
      email,
      token,
      user: {
        _id: user._id,
        name: user.name,
        email: user.email,
        role: user.role
      }
    });

  } catch (err) {
    if (err.name === "ValidationError") {
      let message = Object.values(err.errors)
        .map((val) => val.message)
        .join(", ");
      return res.status(400).json({ 
        success: false,
        message 
      });
    }

    console.error("Registration error:", err);
    res.status(500).json({ 
      success: false,
      message: "Registration failed", 
      error: err.message 
    });
  }
});

// ---------------- RESEND OTP ----------------
router.post("/resend-otp", async (req, res) => {
  try {
    const { email } = req.body;

    const user = await User.findOne({ email });
    if (!user) {
      return res.status(404).json({ 
        success: false,
        message: "User not found" 
      });
    }

    // Generate new OTP
    const otp = user.generateOTP();
    await user.save();

    // Send email
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
          <p>If you didn't request this, please ignore this email.</p>
          <hr>
          <p style="color: #7f8c8d; font-size: 12px;">Smart Stationery © 2025</p>
        </div>
      `
    });

    res.json({ 
      success: true,
      message: "New OTP sent to your email", 
      email 
    });
  } catch (err) {
    console.error("Resend OTP error:", err);
    res.status(500).json({ 
      success: false,
      message: "Failed to resend OTP", 
      error: err.message 
    });
  }
});

// ---------------- VERIFY OTP ----------------
router.post("/verify-otp", async (req, res) => {
  try {
    const { email, otp } = req.body;

    const user = await User.findOne({ email });
    if (!user) return res.status(404).json({ 
      success: false,
      message: "User not found" 
    });

    if (user.otp !== otp || user.otpExpires < Date.now()) {
      return res.status(400).json({ 
        success: false,
        message: "Invalid or expired OTP" 
      });
    }

    user.isVerified = true;
    user.otp = null;
    user.otpExpires = null;
    
    // Generate new token for verified user
    const token = await user.generateAuthToken();
    await user.save();

    res.json({ 
      success: true,
      message: "OTP verified successfully", 
      user: {
        _id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        isVerified: user.isVerified,
        status: user.status
      },
      token
    });
  } catch (err) {
    console.error("OTP verification error:", err);
    res.status(500).json({ 
      success: false,
      message: "OTP verification failed",
      error: err.message 
    });
  }
});

// ---------------- LOGIN ----------------
router.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;

    // ⭐ ADMIN LOGIN - FIXED EMAIL TO admin@gmail.com
    if (email === "admin@gmail.com" && password === "Admin123@") {
      // Find or create admin user
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
          address: "Admin Headquarters"
        });
        await adminUser.save();
      }
      
      const token = await adminUser.generateAuthToken();
      
      return res.json({
        success: true,
        message: "Admin login successful",
        user: {
          _id: adminUser._id,
          name: adminUser.name,
          email: adminUser.email,
          role: adminUser.role,
          isVerified: adminUser.isVerified,
          status: adminUser.status
        },
        token
      });
    }

    // ⭐ NORMAL USER LOGIN
    const user = await User.findByCredentials(email, password);
    
    if (!user.isVerified) {
      return res.status(400).json({ 
        success: false,
        message: "Please verify your email first" 
      });
    }

    // For institute users, check verification status
    if (user.role === "institute") {
      const verification = user.instituteVerification;
      if (!verification || verification.status !== "approved") {
        return res.status(403).json({ 
          success: false,
          message: "Institute account pending verification. Please wait for admin approval.",
          needsVerification: true 
        });
      }
    }

    const token = await user.generateAuthToken();

    res.json({
      success: true,
      message: "Login successful",
      user: {
        _id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        isVerified: user.isVerified,
        status: user.status,
        instituteVerification: user.instituteVerification,
        instituteInfo: user.instituteInfo,
        phone: user.phone,
        address: user.address,
        createdAt: user.createdAt
      },
      token
    });
  } catch (err) {
    console.error("Login error:", err);
    res.status(400).json({ 
      success: false,
      message: err.message || "Login failed"
    });
  }
});

// ---------------- GET CURRENT USER PROFILE ----------------
router.get("/profile", auth, async (req, res) => {
  try {
    res.json({
      success: true,
      user: req.user
    });
  } catch (err) {
    console.error("Get profile error:", err);
    res.status(500).json({ 
      success: false,
      message: "Error fetching profile",
      error: err.message 
    });
  }
});

// ---------------- UPDATE USER PROFILE ----------------
router.put("/profile", auth, async (req, res) => {
  try {
    const updates = Object.keys(req.body);
    const allowedUpdates = ['name', 'phone', 'address'];
    const isValidOperation = updates.every(update => allowedUpdates.includes(update));
    
    if (!isValidOperation) {
      return res.status(400).json({
        success: false,
        message: 'Invalid updates!'
      });
    }
    
    updates.forEach(update => req.user[update] = req.body[update]);
    await req.user.save();
    
    res.json({
      success: true,
      message: 'Profile updated successfully',
      user: req.user
    });
  } catch (err) {
    console.error("Update profile error:", err);
    res.status(400).json({ 
      success: false,
      message: err.message 
    });
  }
});

// ============= ADMIN ROUTES =============

// ---------------- ADMIN: CREATE NEW USER (Including admin) ----------------
router.post("/admin/create-user", adminAuth, async (req, res) => {
  try {
    const { name, email, password, role, phone, address } = req.body;

    // Only admin can create other admins
    if (role === 'admin' && req.user.role !== 'admin') {
      return res.status(403).json({ 
        success: false,
        message: "Only admins can create admin accounts" 
      });
    }

    const existing = await User.findOne({ email });
    if (existing)
      return res.status(400).json({ 
        success: false,
        message: "Email already exists" 
      });

    const user = new User({ 
      name, 
      email, 
      password, 
      role: role || "personal",
      phone,
      address,
      isVerified: true // Admin-created users are automatically verified
    });

    await user.save();

    res.json({ 
      success: true,
      message: "User created successfully",
      user: {
        _id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        status: user.status,
        isVerified: user.isVerified
      }
    });

  } catch (err) {
    if (err.name === "ValidationError") {
      let message = Object.values(err.errors)
        .map((val) => val.message)
        .join(", ");
      return res.status(400).json({ 
        success: false,
        message 
      });
    }

    console.error("Create user error:", err);
    res.status(500).json({ 
      success: false,
      message: "User creation failed", 
      error: err.message 
    });
  }
});

// ---------------- ADMIN: GET ALL USERS ----------------
router.get("/admin/users", adminAuth, async (req, res) => {
  try {
    const { page = 1, limit = 10, search = '', role = '' } = req.query;
    
    const query = {};
    
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } }
      ];
    }
    
    if (role) {
      query.role = role;
    }

    const users = await User.find(query)
      .select("-password -tokens -otp -otpExpires")
      .sort({ createdAt: -1 })
      .limit(parseInt(limit))
      .skip((parseInt(page) - 1) * parseInt(limit));
    
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
    res.status(500).json({ 
      success: false,
      message: "Error fetching users",
      error: err.message 
    });
  }
});

// ---------------- ADMIN: GET USER BY ID ----------------
router.get("/admin/users/:id", adminAuth, async (req, res) => {
  try {
    const user = await User.findById(req.params.id)
      .select("-password -tokens -otp -otpExpires");
    
    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found"
      });
    }
    
    res.json({
      success: true,
      user
    });
  } catch (err) {
    console.error("Get user by ID error:", err);
    res.status(500).json({ 
      success: false,
      message: "Error fetching user",
      error: err.message 
    });
  }
});

// ---------------- ADMIN: UPDATE USER ----------------
router.put("/admin/users/:id", adminAuth, async (req, res) => {
  try {
    const { name, email, role, status, phone, address } = req.body;
    
    const user = await User.findById(req.params.id);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found"
      });
    }
    
    // Don't allow admin to update themselves to suspended
    if (user._id.toString() === req.user._id.toString() && status === 'suspended') {
      return res.status(400).json({
        success: false,
        message: "You cannot suspend your own account"
      });
    }
    
    // Update fields
    if (name) user.name = name;
    if (email) user.email = email;
    if (role) user.role = role;
    if (status) user.status = status;
    if (phone !== undefined) user.phone = phone;
    if (address !== undefined) user.address = address;
    
    await user.save();
    
    res.json({
      success: true,
      message: `User updated successfully`,
      user: {
        _id: user._id,
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
    res.status(400).json({ 
      success: false,
      message: err.message 
    });
  }
});

// ---------------- ADMIN: DELETE USER ----------------
router.delete("/admin/users/:id", adminAuth, async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    
    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found"
      });
    }
    
    // Don't allow admin to delete themselves
    if (user._id.toString() === req.user._id.toString()) {
      return res.status(400).json({
        success: false,
        message: "You cannot delete your own account"
      });
    }
    
    await User.findByIdAndDelete(req.params.id);
    
    res.json({
      success: true,
      message: "User deleted successfully"
    });
  } catch (err) {
    console.error("Delete user error:", err);
    res.status(500).json({ 
      success: false,
      message: "Error deleting user",
      error: err.message 
    });
  }
});

// ---------------- ADMIN: GET PENDING VERIFICATIONS ----------------
router.get("/admin/pending-verifications", adminAuth, async (req, res) => {
  try {
    const pendingUsers = await User.find({
      role: "institute",
      "instituteVerification.status": "pending"
    }).select("-password -tokens -otp -otpExpires");

    res.json({ 
      success: true,
      count: pendingUsers.length,
      pendingVerifications: pendingUsers 
    });
  } catch (err) {
    console.error("Get pending verifications error:", err);
    res.status(500).json({ 
      success: false,
      message: "Error fetching pending verifications",
      error: err.message 
    });
  }
});

// ---------------- ADMIN: UPDATE VERIFICATION STATUS ----------------
router.put("/admin/verifications/:id", adminAuth, async (req, res) => {
  try {
    const { status, comments } = req.body;

    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ 
      success: false,
      message: "User not found" 
    });

    if (user.role !== "institute") {
      return res.status(400).json({ 
        success: false,
        message: "User is not an institute" 
      });
    }

    if (!user.instituteVerification) {
      return res.status(400).json({ 
        success: false,
        message: "No verification data found" 
      });
    }

    user.instituteVerification.status = status;
    user.instituteVerification.comments = comments;
    user.instituteVerification.verifiedBy = req.user._id;
    user.instituteVerification.verifiedAt = new Date();
    
    await user.save();

    // Send email notification to institute
    await transporter.sendMail({
      to: user.email,
      subject: `Institute Verification ${status.charAt(0).toUpperCase() + status.slice(1)}`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #2c3e50;">Institute Verification Update</h2>
          <p>Dear ${user.name},</p>
          <p>Your institute verification has been <strong style="color: ${status === 'approved' ? '#27ae60' : '#e74c3c'}">${status}</strong>.</p>
          ${comments ? `<p><strong>Admin Comments:</strong> ${comments}</p>` : ''}
          ${status === 'approved' ? 
            '<p>You can now access all institute features including bulk ordering and book management.</p>' : 
            '<p>If you believe this is an error, please contact support with additional documents.</p>'
          }
          <hr>
          <p style="color: #7f8c8d; font-size: 12px;">Smart Stationery © 2025</p>
        </div>
      `
    });

    res.json({ 
      success: true,
      message: `Verification ${status} successfully`, 
      user: {
        _id: user._id,
        name: user.name,
        email: user.email,
        instituteVerification: user.instituteVerification
      }
    });
  } catch (err) {
    console.error("Update verification error:", err);
    res.status(500).json({ 
      success: false,
      message: "Error updating verification status",
      error: err.message 
    });
  }
});

// ---------------- LOGOUT ----------------
router.post("/logout", auth, async (req, res) => {
  try {
    req.user.tokens = req.user.tokens.filter(token => token.token !== req.token);
    await req.user.save();
    
    res.json({ 
      success: true,
      message: "Logged out successfully" 
    });
  } catch (err) {
    console.error("Logout error:", err);
    res.status(500).json({ 
      success: false,
      message: "Logout failed",
      error: err.message 
    });
  }
});

module.exports = router;