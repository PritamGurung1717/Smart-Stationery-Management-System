// backend/models/wishlist.js
const mongoose = require('mongoose');

const wishlistSchema = new mongoose.Schema({
  user: {
    type: Number,  // INTEGER user ID (matches user.id)
    required: true,
    ref: 'User'
  },
  product: {
    type: mongoose.Schema.Types.ObjectId, // Product uses MongoDB _id
    ref: 'Product',
    required: true
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

// Ensure a user can't add the same product twice to wishlist
wishlistSchema.index({ user: 1, product: 1 }, { unique: true });

const Wishlist = mongoose.model('Wishlist', wishlistSchema);

module.exports = Wishlist;