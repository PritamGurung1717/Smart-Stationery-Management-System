// backend/models/bookSetRequest.js
const mongoose = require("mongoose");
require('./counter');

// Book Set Request Item Schema
const bookSetRequestItemSchema = new mongoose.Schema({
  subject_name: {
    type: String,
    required: [true, "Subject name is required"],
    trim: true,
    maxlength: 100,
  },
  book_title: {
    type: String,
    required: [true, "Book title is required"],
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
    validate: {
      validator: function(v) {
        // ISBN-10 or ISBN-13 format validation
        if (!v) return true; // Optional field
        const isbn = v.replace(/[-\s]/g, '');
        return /^(\d{10}|\d{13})$/.test(isbn);
      },
      message: 'Invalid ISBN format. Must be 10 or 13 digits.'
    }
  },
  estimated_price: {
    type: Number,
    required: [true, "Estimated price is required"],
    min: 0,
    max: 999999.99,
  },
  created_at: {
    type: Date,
    default: Date.now,
  },
});

// Main Book Set Request Schema
const bookSetRequestSchema = new mongoose.Schema(
  {
    id: {
      type: Number,
      unique: true,
      required: false,
    },
    institute_id: {
      type: Number,
      required: [true, "Institute ID is required"],
      index: true,
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
    status: {
      type: String,
      enum: ["pending", "approved", "rejected"],
      default: "pending",
      index: true,
    },
    admin_remark: {
      type: String,
      trim: true,
      maxlength: 500,
    },
    approved_by: {
      type: Number,
      index: true,
    },
    approved_at: {
      type: Date,
    },
    rejected_by: {
      type: Number,
    },
    rejected_at: {
      type: Date,
    },
    items: [bookSetRequestItemSchema],
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

// Compound index for preventing duplicate pending requests
bookSetRequestSchema.index(
  { institute_id: 1, school_name: 1, grade: 1, status: 1 },
  { 
    unique: true,
    partialFilterExpression: { status: "pending" },
    name: "unique_pending_request"
  }
);

// Virtual for total estimated price
bookSetRequestSchema.virtual("total_estimated_price").get(function () {
  if (!this.items || this.items.length === 0) return 0;
  return this.items.reduce((total, item) => total + item.estimated_price, 0);
});

// Assign auto-increment ID before saving
bookSetRequestSchema.pre("save", async function (next) {
  if (this.isNew && !this.id) {
    try {
      const Counter = mongoose.model("Counter");
      const counter = await Counter.findByIdAndUpdate(
        { _id: "bookSetRequestId" },
        { $inc: { sequence_value: 1 } },
        { new: true, upsert: true }
      );
      this.id = counter.sequence_value;
      next();
    } catch (error) {
      console.error("Error generating book set request ID:", error);
      next(error);
    }
  } else {
    next();
  }
});

// Update timestamp before saving
bookSetRequestSchema.pre("save", function (next) {
  this.updated_at = new Date();
  next();
});

// Validate at least one item
bookSetRequestSchema.pre("save", function (next) {
  if (this.isNew && (!this.items || this.items.length === 0)) {
    next(new Error("At least one book item is required"));
  } else {
    next();
  }
});

// Custom findById that works with integer ID
bookSetRequestSchema.statics.findById = function(id) {
  if (typeof id === "string" && /^[a-f\d]{24}$/i.test(id)) {
    return this.findOne({ _id: id });
  }
  const mongoose = require("mongoose");
  if (id instanceof mongoose.Types.ObjectId) {
    return this.findOne({ _id: id });
  }
  const parsedId = parseInt(id);
  if (!isNaN(parsedId)) {
    return this.findOne({ id: parsedId });
  }
  return this.findOne({ _id: id });
};

module.exports = mongoose.model("BookSetRequest", bookSetRequestSchema);

// Virtual for item count
bookSetRequestSchema.virtual("item_count").get(function () {
  return this.items ? this.items.length : 0;
});
