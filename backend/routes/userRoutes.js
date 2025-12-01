const express = require("express");
const router = express.Router();
const User = require("../models/user");
const bcrypt = require("bcryptjs");
const sendEmail = require("../utils/sendEmail");

// validators (same as model but for quick server-side check)
const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const strongPasswordRegex =
  /^(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;

// helper
const generateOTP = () => Math.floor(100000 + Math.random() * 900000).toString();

// REGISTER: create user, save, send OTP **in background** (non-blocking)
router.post("/register", async (req, res) => {
  try {
    const { name, email, password } = req.body;

    if (!name || !email || !password)
      return res.status(400).json({ message: "All fields are required" });

    if (!emailRegex.test(email))
      return res.status(400).json({ message: "Invalid email format" });

    if (!strongPasswordRegex.test(password))
      return res.status(400).json({
        message:
          "Password must be minimum 8 chars, have an uppercase letter, a number and a special character"
      });

    const exists = await User.findOne({ email });
    if (exists) return res.status(400).json({ message: "Email already in use" });

    const user = new User({ name, email, password });

    // generate OTP and save it
    user.generateOTP();
    await user.save();

    // send OTP email in background — do NOT await, but catch error
    const html = `
      <h3>Smart Stationery - Email Verification</h3>
      <p>Hello ${user.name},</p>
      <p>Your OTP code is: <b>${user.otp}</b></p>
      <p>This code will expire in 10 minutes.</p>
    `;
    sendEmail(user.email, "Your Smart Stationery OTP", html).catch((err) => {
      // log but do not block register flow
      console.error("Failed to send OTP email:", err?.message || err);
    });

    // respond immediately so UI does not freeze
    return res.status(201).json({
      message: "Registered successfully — an OTP has been sent to your email.",
      email: user.email
    });
  } catch (err) {
    console.error("Register error:", err);
    return res.status(500).json({ message: "Server error" });
  }
});

// VERIFY OTP
router.post("/verify-otp", async (req, res) => {
  try {
    const { email, otp } = req.body;
    if (!email || !otp) return res.status(400).json({ message: "Email and OTP required" });

    const user = await User.findOne({ email });
    if (!user) return res.status(404).json({ message: "User not found" });

    // trim and compare strings
    const inputOTP = otp.toString().trim();
    const storedOTP = (user.otp || "").toString().trim();

    // expiry check
    if (!user.otpExpires || user.otpExpires < Date.now()) {
      return res.status(400).json({ message: "OTP expired" });
    }

    if (inputOTP !== storedOTP) {
      return res.status(400).json({ message: "Invalid OTP" });
    }

    user.isVerified = true;
    user.otp = undefined;
    user.otpExpires = undefined;
    await user.save();

    return res.json({ message: "Email verified successfully" });
  } catch (err) {
    console.error("Verify OTP error:", err);
    return res.status(500).json({ message: "Server error" });
  }
});

// RESEND OTP
router.post("/resend-otp", async (req, res) => {
  try {
    const { email } = req.body;
    if (!email) return res.status(400).json({ message: "Email required" });

    const user = await User.findOne({ email });
    if (!user) return res.status(404).json({ message: "User not found" });
    if (user.isVerified) return res.status(400).json({ message: "Already verified" });

    // new OTP
    user.generateOTP();
    await user.save();

    const html = `
      <h3>Smart Stationery - Your New OTP</h3>
      <p>Your new OTP is: <b>${user.otp}</b></p>
      <p>This OTP expires in 10 minutes.</p>
    `;
    sendEmail(user.email, "Your new OTP - Smart Stationery", html).catch((err) => {
      console.error("Resend OTP send error:", err?.message || err);
    });

    return res.json({ message: "New OTP sent" });
  } catch (err) {
    console.error("Resend OTP error:", err);
    return res.status(500).json({ message: "Server error" });
  }
});

// LOGIN - block if not verified
router.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) return res.status(400).json({ message: "Email and password required" });

    const user = await User.findOne({ email });
    if (!user) return res.status(404).json({ message: "User not found" });

    if (!user.isVerified) return res.status(403).json({ message: "Verify your email first" });

    const match = await bcrypt.compare(password, user.password);
    if (!match) return res.status(400).json({ message: "Incorrect password" });

    // return safe user
    const { password: pw, otp, otpExpires, ...safe } = user.toObject();
    return res.json({ message: "Login successful", user: safe });
  } catch (err) {
    console.error("Login error:", err);
    return res.status(500).json({ message: "Server error" });
  }
});

module.exports = router;
