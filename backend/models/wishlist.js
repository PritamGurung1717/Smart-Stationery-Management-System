const mongoose = require('mongoose');

const wishlistSchema = new mongoose.Schema({
  user: {
    type: Number,
    required: true,
    ref: 'User'
  },
  product: {
    type: Number,  // integer id matching product.id
    ref: 'Product',
    required: true
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
}, { timestamps: true });

wishlistSchema.index({ user: 1, product: 1 }, { unique: true });

module.exports = mongoose.model('Wishlist', wishlistSchema);
