// backend/models/product.js - COMPLETE UPDATED
const mongoose = require("mongoose");

const productSchema = new mongoose.Schema(
  {
    id: {
      type: Number,
      unique: true,
      required: true,
    },
    name: {
      type: String,
      required: true,
      trim: true,
      maxlength: 100,
    },
    category: {
      type: String,
      required: true,
      // NO enum restriction - allows any category
      trim: true,
      lowercase: true
    },
    price: {
      type: Number,
      required: true,
      min: 0,
      max: 999999.99,
    },
    description: {
      type: String,
      trim: true,
    },
    author: {
      type: String,
      trim: true,
      maxlength: 100,
    },
    genre: {
      type: String,
      trim: true,
      maxlength: 100,
    },
    stock_quantity: {
      type: Number,
      required: true,
      min: 0,
      default: 0,
    },
    image_url: {
      type: String,
      default: "",
      maxlength: 200,
    },
    created_at: {
      type: Date,
      default: Date.now,
    },
    updated_at: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' },
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// Remove auto-increment pre-save hook (handled in routes)
// productSchema.pre("save", async function(next) {
//   if (this.isNew && !this.id) {
//     this.id = await mongoose.model("Product").getNextProductId();
//   }
//   next();
// });

// Alias for stock_quantity
productSchema.virtual("stock").get(function () {
  return this.stock_quantity;
});

productSchema.virtual("stock").set(function (value) {
  this.stock_quantity = value;
});

// Alias for image_url
productSchema.virtual("image").get(function () {
  return this.image_url;
});

productSchema.virtual("image").set(function (value) {
  this.image_url = value;
});

// Check if product is in stock
productSchema.virtual("inStock").get(function () {
  return this.stock_quantity > 0;
});

// Update timestamp before saving
productSchema.pre("save", function (next) {
  this.updated_at = new Date();
  next();
});

// Custom findById that works with both ObjectId and integer ID
productSchema.statics.findById = function(id) {
  // If it's a number or numeric string, find by custom id field
  const parsedId = parseInt(id);
  if (!isNaN(parsedId)) {
    return this.findOne({ id: parsedId });
  }
  // Otherwise use MongoDB _id
  return this.findOne({ _id: id });
};

// Helper to find by integer ID
productSchema.statics.findByIntId = function(id) {
  return this.findOne({ id: parseInt(id) });
};

module.exports = mongoose.model("Product", productSchema);