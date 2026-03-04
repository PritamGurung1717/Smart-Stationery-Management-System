// backend/models/bookSet.js
const mongoose = require("mongoose");
require('./counter');

// Book Set Item Schema
const bookSetItemSchema = new mongoose.Schema({
  product_id: {
    type: Number,
    index: true,
  },
  title: {
    type: String,
    required: [true, "Title is required"],
    trim: true,
    maxlength: 200,
  },
  author: {
    type: String,
    required: [true, "Author is required"],
    trim: true,
    maxlength: 100,
  },
  publisher: {
    type: String,
    required: [true, "Publisher is required"],
    trim: true,
    maxlength: 100,
  },
  publication_year: {
    type: Number,
    required: [true, "Publication year is required"],
    min: 1900,
    max: new Date().getFullYear() + 1,
  },
  isbn: {
    type: String,
    trim: true,
  },
  price: {
    type: Number,
    required: [true, "Price is required"],
    min: 0,
    max: 999999.99,
  },
  subject_name: {
    type: String,
    trim: true,
    maxlength: 100,
  },
  created_at: {
    type: Date,
    default: Date.now,
  },
});

// Main Book Set Schema
const bookSetSchema = new mongoose.Schema(
  {
    id: {
      type: Number,
      unique: true,
      required: false,
    },
    school_name: {
      type: String,
      required: [true, "School name is required"],
      trim: true,
      maxlength: 200,
      index: true,
    },
    grade: {
      type: String,
      required: [true, "Grade is required"],
      trim: true,
      maxlength: 50,
      index: true,
    },
    created_by: {
      type: Number,
      required: false,
      index: true,
    },
    created_from_request_id: {
      type: Number,
      index: true,
    },
    total_price: {
      type: Number,
      required: true,
      min: 0,
      default: 0,
    },
    is_active: {
      type: Boolean,
      default: true,
      index: true,
    },
    items: [bookSetItemSchema],
    created_at: {
      type: Date,
      default: Date.now,
      index: true,
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

// Compound index for school + grade
bookSetSchema.index({ school_name: 1, grade: 1 });

// Index for active book sets
bookSetSchema.index({ is_active: 1, school_name: 1, grade: 1 });

// Virtual for item count
bookSetSchema.virtual("item_count").get(function () {
  return this.items ? this.items.length : 0;
});

// Assign auto-increment ID before saving
bookSetSchema.pre("save", async function (next) {
  if (this.isNew && !this.id) {
    try {
      const Counter = mongoose.model("Counter");
      const counter = await Counter.findByIdAndUpdate(
        { _id: "bookSetId" },
        { $inc: { sequence_value: 1 } },
        { new: true, upsert: true }
      );
      this.id = counter.sequence_value;
      next();
    } catch (error) {
      console.error("Error generating book set ID:", error);
      next(error);
    }
  } else {
    next();
  }
});

// Calculate total price before saving
bookSetSchema.pre("save", function (next) {
  if (this.items && this.items.length > 0) {
    this.total_price = this.items.reduce((total, item) => total + item.price, 0);
  }
  this.updated_at = new Date();
  next();
});

// Validate at least one item
bookSetSchema.pre("save", function (next) {
  if (this.isNew && (!this.items || this.items.length === 0)) {
    next(new Error("At least one book item is required"));
  } else {
    next();
  }
});

// Custom findById that works with integer ID
bookSetSchema.statics.findById = function(id) {
  const parsedId = parseInt(id);
  if (!isNaN(parsedId)) {
    return this.findOne({ id: parsedId });
  }
  return this.findOne({ _id: id });
};

module.exports = mongoose.model("BookSet", bookSetSchema);
