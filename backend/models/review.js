const mongoose = require("mongoose");

const reviewSchema = new mongoose.Schema({
  product_id:  { type: Number, required: true, index: true },
  user_id:     { type: Number, required: true },
  user_name:   { type: String, required: true },
  rating:      { type: Number, required: true, min: 1, max: 5 },
  comment:     { type: String, required: true, trim: true, minlength: 3 },
  created_at:  { type: Date, default: Date.now },
});

// One review per user per product
reviewSchema.index({ product_id: 1, user_id: 1 }, { unique: true });

module.exports = mongoose.model("Review", reviewSchema);
