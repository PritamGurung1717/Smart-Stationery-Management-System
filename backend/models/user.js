const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");

// simple email rule (you can adapt to require only gmail if needed)
const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

// strong password: min 8, at least one uppercase, one number, one special char
const strongPasswordRegex =
  /^(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;

const userSchema = new mongoose.Schema(
  {
    name: { type: String, required: [true, "Name required"] },
    email: {
      type: String,
      required: [true, "Email required"],
      unique: true,
      validate: {
        validator: (v) => emailRegex.test(v),
        message: "Invalid email format"
      }
    },
    password: {
      type: String,
      required: [true, "Password required"],
      minlength: [8, "Password min 8 chars"],
      validate: {
        validator: (v) => strongPasswordRegex.test(v),
        message:
          "Password must contain uppercase, number, and special character"
      }
    },
    isVerified: { type: Boolean, default: false },
    otp: { type: String },
    otpExpires: { type: Date }
  },
  { timestamps: true }
);

// hash password
userSchema.pre("save", async function (next) {
  if (!this.isModified("password")) return next();
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
  next();
});

// helper: create OTP
userSchema.methods.generateOTP = function () {
  const otp = Math.floor(100000 + Math.random() * 900000).toString(); // 6-digit
  this.otp = otp;
  this.otpExpires = Date.now() + 10 * 60 * 1000; // 10 minutes
  return otp;
};

module.exports = mongoose.model("User", userSchema);
