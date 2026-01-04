const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const strongPasswordRegex = /^(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;

const instituteVerificationSchema = new mongoose.Schema({
  instituteName: { type: String, required: true },
  invoiceNumber: { type: String, required: true },
  panNumber: { type: String, required: true },
  gstNumber: { type: String },
  contactNumber: { type: String, required: true },
  documents: [{ type: String }],
  verifiedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  verifiedAt: { type: Date },
  status: {
    type: String,
    enum: ["pending", "approved", "rejected"],
    default: "pending"
  },
  comments: { type: String }
});

const bookSetSchema = new mongoose.Schema({
  grade: { type: String, required: true },
  bookName: { type: String, required: true },
  publication: { type: String, required: true },
  quantity: { type: Number, required: true, default: 1 },
  price: { type: Number },
  status: { 
    type: String, 
    enum: ["pending", "approved", "rejected"], 
    default: "pending" 
  }
});

const schoolInfoSchema = new mongoose.Schema({
  schoolName: { type: String },
  type: { 
    type: String, 
    enum: ["school", "college", "wholesaler"], 
    default: "school" 
  },
  address: { type: String },
  contactPerson: { type: String },
  phone: { type: String },
  email: { type: String },
  grades: [{ type: String }],
  bookSets: [bookSetSchema],
  createdAt: { type: Date, default: Date.now }
});

const userSchema = new mongoose.Schema(
  {
    name: { 
      type: String, 
      required: [true, "Name required"],
      trim: true
    },
    email: {
      type: String,
      required: [true, "Email required"],
      unique: true,
      lowercase: true,
      trim: true,
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
        validator: function (v) {
          if (this.isNew || this.isModified("password")) {
            return strongPasswordRegex.test(v);
          }
          return true;
        },
        message: "Password must contain at least one uppercase letter, one number, and one special character"
      }
    },
    role: {
      type: String,
      enum: ["personal", "institute", "admin"],
      default: "personal",
      required: true
    },
    status: {
      type: String,
      enum: ["active", "suspended"],
      default: "active"
    },
    isVerified: { 
      type: Boolean, 
      default: false 
    },
    otp: { type: String },
    otpExpires: { type: Date },
    
    // Institute specific fields
    instituteVerification: instituteVerificationSchema,
    instituteInfo: schoolInfoSchema,
    
    bulkOrders: [{
      productId: { type: String },
      productName: { type: String },
      quantity: { type: Number },
      unitPrice: { type: Number },
      totalPrice: { type: Number },
      status: { 
        type: String, 
        enum: ["pending", "approved", "processing", "completed", "cancelled"], 
        default: "pending" 
      },
      orderDate: { type: Date, default: Date.now }
    }],
    
    // Additional fields
    phone: { type: String },
    address: { type: String },
    
    // Tokens for authentication
    tokens: [{
      token: {
        type: String,
        required: true
      }
    }]
  },
  { 
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
  }
);

// Hash password before save
userSchema.pre("save", async function (next) {
  if (!this.isModified("password")) return next();
  try {
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (error) {
    next(error);
  }
});

// Helper: create OTP
userSchema.methods.generateOTP = function () {
  const otp = Math.floor(100000 + Math.random() * 900000).toString();
  this.otp = otp;
  this.otpExpires = Date.now() + 10 * 60 * 1000; // 10 minutes
  return otp;
};

// Helper: compare password
userSchema.methods.comparePassword = async function (candidatePassword) {
  return await bcrypt.compare(candidatePassword, this.password);
};

// Generate auth token
userSchema.methods.generateAuthToken = async function () {
  const user = this;
  const token = jwt.sign(
    { 
      _id: user._id.toString(),
      role: user.role,
      email: user.email 
    }, 
    process.env.JWT_SECRET || 'your-secret-key',
    { expiresIn: '7d' }
  );
  
  user.tokens = user.tokens.concat({ token });
  await user.save();
  
  return token;
};

// Remove sensitive data when converting to JSON
userSchema.methods.toJSON = function () {
  const user = this.toObject();
  delete user.password;
  delete user.tokens;
  delete user.otp;
  delete user.otpExpires;
  return user;
};

// Static method to find user by credentials
userSchema.statics.findByCredentials = async function (email, password) {
  const user = await this.findOne({ email });
  
  if (!user) {
    throw new Error('Invalid email or password');
  }
  
  if (user.status === 'suspended') {
    throw new Error('Your account has been suspended. Please contact admin.');
  }
  
  const isMatch = await user.comparePassword(password);
  
  if (!isMatch) {
    throw new Error('Invalid email or password');
  }
  
  return user;
};

// Static method to find user by token
userSchema.statics.findByToken = async function (token) {
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key');
    const user = await this.findOne({ 
      _id: decoded._id,
      'tokens.token': token 
    });
    
    return user;
  } catch (error) {
    throw new Error('Invalid or expired token');
  }
};

module.exports = mongoose.model("User", userSchema);