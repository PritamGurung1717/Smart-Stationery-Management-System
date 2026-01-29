// backend/models/user.js
const mongoose = require("mongoose");
require('./counter');

const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const strongPasswordRegex = /^(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;

// Cart Item Schema - FIXED: Use Number type WITHOUT ref
const cartItemSchema = new mongoose.Schema({
  product: {
    type: Number, // Store integer ID
    required: true,
  },
  quantity: {
    type: Number,
    required: true,
    min: 1,
    default: 1,
  },
  price: {
    type: Number,
    required: true,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

// Cart Schema - FIXED: Use Number type WITHOUT ref
const cartSchema = new mongoose.Schema({
  user: {
    type: Number,
    required: true,
  },
  institute: {
    type: Number,
  },
  items: [cartItemSchema],
  createdAt: {
    type: Date,
    default: Date.now,
  },
  updatedAt: {
    type: Date,
    default: Date.now,
  },
});

// Institute Verification Schema
const instituteVerificationSchema = new mongoose.Schema({
  instituteName: { type: String, default: "" },
  invoiceNumber: { type: String, default: "" },
  panNumber: { type: String, default: "" },
  gstNumber: { type: String, default: "" },
  contactNumber: { type: String, default: "" },
  documents: [{ type: String }],
  verifiedBy: { type: Number },
  verifiedAt: { type: Date },
  status: {
    type: String,
    enum: ["pending", "approved", "rejected"],
    default: "pending",
  },
  comments: { type: String },
});

// Book Set Schema
const bookSetSchema = new mongoose.Schema({
  grade: { type: String },
  bookName: { type: String },
  publication: { type: String },
  quantity: { type: Number, default: 1 },
  price: { type: Number },
  status: {
    type: String,
    enum: ["pending", "approved", "rejected"],
    default: "pending",
  },
});

// Institute Info Schema
const instituteInfoSchema = new mongoose.Schema({
  schoolName: { type: String },
  type: {
    type: String,
    enum: ["school", "college", "wholesaler"],
    default: "school",
  },
  address: { type: String },
  contactPerson: { type: String },
  phone: { type: String },
  email: { type: String },
  grades: [{ type: String }],
  bookSets: [bookSetSchema],
  createdAt: { type: Date, default: Date.now },
});

// Bulk Order Schema
const bulkOrderSchema = new mongoose.Schema({
  productId: { type: Number },
  productName: { type: String },
  quantity: { type: Number },
  unitPrice: { type: Number },
  totalPrice: { type: Number },
  status: {
    type: String,
    enum: ["pending", "approved", "processing", "completed", "cancelled"],
    default: "pending",
  },
  orderDate: { type: Date, default: Date.now },
});

// Main User Schema
const userSchema = new mongoose.Schema(
  {
    id: {
      type: Number,
      unique: true
    },
    name: {
      type: String,
      required: [true, "Name required"],
      trim: true,
    },
    email: {
      type: String,
      required: [true, "Email required"],
      unique: true,
      lowercase: true,
      trim: true,
      validate: {
        validator: (v) => emailRegex.test(v),
        message: "Invalid email format",
      },
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
        message:
          "Password must contain at least one uppercase letter, one number, and one special character",
      },
    },
    role: {
      type: String,
      enum: ["personal", "institute", "admin"],
      default: "personal",
      required: true,
    },
    status: {
      type: String,
      enum: ["active", "suspended"],
      default: "active",
    },
    isVerified: {
      type: Boolean,
      default: false,
    },
    otp: { type: String },
    otpExpires: { type: Date },

    // Institute specific fields
    instituteVerification: instituteVerificationSchema,
    instituteInfo: instituteInfoSchema,

    // Bulk orders
    bulkOrders: [bulkOrderSchema],

    // Additional fields
    phone: { type: String },
    address: { type: String },

    // Cart
    cart: cartSchema,

    // Tokens for authentication
    tokens: [
      {
        token: {
          type: String,
          required: true,
        },
      },
    ],
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// Function to get next user ID
userSchema.statics.getNextUserId = async function () {
  const Counter = mongoose.model("Counter");
  const counter = await Counter.findByIdAndUpdate(
    { _id: "userId" },
    { $inc: { sequence_value: 1 } },
    { new: true, upsert: true }
  );
  return counter.sequence_value;
};

// Assign auto-increment ID before saving
userSchema.pre("save", async function (next) {
  if (this.isNew && !this.id) {
    this.id = await mongoose.model("User").getNextUserId();
  }
  next();
});

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

// Set default values for institute fields based on role
userSchema.pre("save", function (next) {
  if (this.role === "institute") {
    if (!this.instituteVerification) {
      this.instituteVerification = {
        instituteName: "",
        invoiceNumber: "",
        panNumber: "",
        gstNumber: "",
        contactNumber: "",
        documents: [],
        status: "pending",
      };
    }
    if (!this.instituteInfo) {
      this.instituteInfo = {
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
  } else {
    this.instituteVerification = undefined;
    this.instituteInfo = undefined;
  }
  next();
});

// Helper: create OTP
userSchema.methods.generateOTP = function () {
  const otp = Math.floor(100000 + Math.random() * 900000).toString();
  this.otp = otp;
  this.otpExpires = Date.now() + 10 * 60 * 1000;
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
      id: user.id,
      role: user.role,
      email: user.email,
    },
    process.env.JWT_SECRET || "your-secret-key",
    { expiresIn: "7d" }
  );

  user.tokens = user.tokens.concat({ token });
  await user.save();
  return token;
};

// Cart methods - SIMPLIFIED and WORKING
userSchema.methods.addToCart = async function (productId, quantity = 1) {
  console.log("🛒 addToCart called with productId:", productId);
  
  const Product = mongoose.model("Product");
  
  // Parse to integer
  const productIdNum = parseInt(productId);
  if (isNaN(productIdNum)) {
    throw new Error(`Invalid product ID: ${productId}`);
  }
  
  // Find product by integer ID
  const product = await Product.findOne({ id: productIdNum });
  if (!product) {
    throw new Error(`Product not found with ID: ${productIdNum}`);
  }
  
  console.log("✅ Found product:", product.name);
  
  // Check stock
  if (product.stock_quantity < quantity) {
    throw new Error(`Insufficient stock. Available: ${product.stock_quantity}`);
  }
  
  // Initialize cart if needed
  if (!this.cart) {
    this.cart = {
      user: this.id,
      items: [],
      createdAt: new Date(),
      updatedAt: new Date(),
    };
  }
  
  // Check if product already in cart
  const existingItemIndex = this.cart.items.findIndex(
    item => item.product === productIdNum
  );
  
  if (existingItemIndex > -1) {
    this.cart.items[existingItemIndex].quantity += quantity;
  } else {
    this.cart.items.push({
      product: productIdNum,
      quantity,
      price: product.price,
      createdAt: new Date(),
    });
  }
  
  this.cart.updatedAt = new Date();
  await this.save();
  
  console.log("✅ Cart saved successfully");
  return this.cart;
};

// Remove from cart
userSchema.methods.removeFromCart = async function (productId) {
  if (!this.cart) {
    throw new Error("Cart not found");
  }
  
  const productIdNum = parseInt(productId);
  this.cart.items = this.cart.items.filter(item => item.product !== productIdNum);
  this.cart.updatedAt = new Date();
  await this.save();
  return this.cart;
};

// Update cart quantity
userSchema.methods.updateCartQuantity = async function (productId, quantity) {
  if (!this.cart) {
    throw new Error("Cart not found");
  }
  
  const productIdNum = parseInt(productId);
  const itemIndex = this.cart.items.findIndex(item => item.product === productIdNum);
  
  if (itemIndex > -1) {
    if (quantity <= 0) {
      this.cart.items.splice(itemIndex, 1);
    } else {
      this.cart.items[itemIndex].quantity = quantity;
    }
    this.cart.updatedAt = new Date();
    await this.save();
  }
  
  return this.cart;
};

// Clear cart
userSchema.methods.clearCart = async function () {
  if (this.cart) {
    this.cart.items = [];
    this.cart.updatedAt = new Date();
    await this.save();
  }
  return this.cart;
};

// Calculate cart total
userSchema.virtual("cartTotal").get(function () {
  if (!this.cart || !this.cart.items.length) return 0;
  return this.cart.items.reduce((total, item) => total + (item.price * item.quantity), 0);
});

// Calculate cart item count
userSchema.virtual("cartItemCount").get(function () {
  if (!this.cart || !this.cart.items.length) return 0;
  return this.cart.items.reduce((count, item) => count + item.quantity, 0);
});

// Remove sensitive data
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
  if (!user) throw new Error("Invalid email or password");
  if (user.status === "suspended") throw new Error("Account suspended");
  
  const isMatch = await bcrypt.compare(password, user.password);
  if (!isMatch) throw new Error("Invalid email or password");
  
  return user;
};

// Static method to find user by token
userSchema.statics.findByToken = async function (token) {
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET || "your-secret-key");
    const user = await this.findOne({
      id: decoded.id,
      "tokens.token": token,
    });
    return user;
  } catch (error) {
    throw new Error("Invalid or expired token");
  }
};

module.exports = mongoose.model("User", userSchema);