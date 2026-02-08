// backend/routes/wishlistRoutes.js
const express = require('express');
const router = express.Router();
const { auth } = require('../middleware/auth'); // Destructure since it's exported as object
const Wishlist = require('../models/wishlist');
const Product = require('../models/product');

// Get user's wishlist
router.get('/wishlist', auth, async (req, res) => {
  try {
    console.log('📋 Fetching wishlist for user ID:', req.user.id);
    
    const wishlistItems = await Wishlist.find({ user: req.user.id })
      .populate('product', 'name price category image_url stock_quantity description')
      .sort({ createdAt: -1 });

    console.log(`✅ Found ${wishlistItems.length} wishlist items`);
    
    res.json({
      success: true,
      wishlist: wishlistItems,
      count: wishlistItems.length
    });
  } catch (error) {
    console.error('❌ Error fetching wishlist:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// Add to wishlist
router.post('/wishlist/add', auth, async (req, res) => {
  try {
    const { productId } = req.body;

    console.log('➕ Adding to wishlist:', { userId: req.user.id, productId });

    if (!productId) {
      return res.status(400).json({ success: false, message: 'Product ID is required' });
    }

    // Check if product exists
    const product = await Product.findById(productId);
    if (!product) {
      return res.status(404).json({ success: false, message: 'Product not found' });
    }

    console.log('✅ Product found:', product.name);

    // Check if already in wishlist
    const existing = await Wishlist.findOne({
      user: req.user.id, // Integer ID
      product: productId
    });

    if (existing) {
      return res.status(400).json({ success: false, message: 'Product already in wishlist' });
    }

    // Add to wishlist
    const wishlistItem = new Wishlist({
      user: req.user.id, // Integer ID
      product: productId
    });

    await wishlistItem.save();

    // Populate product data
    await wishlistItem.populate('product', 'name price category image_url stock_quantity description');

    console.log('✅ Added to wishlist:', wishlistItem._id);

    res.json({
      success: true,
      message: 'Product added to wishlist',
      wishlistItem
    });
  } catch (error) {
    console.error('❌ Error adding to wishlist:', error);
    
    // Handle duplicate key error
    if (error.code === 11000) {
      return res.status(400).json({ success: false, message: 'Product already in wishlist' });
    }
    
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// Remove from wishlist
router.delete('/wishlist/remove/:productId', auth, async (req, res) => {
  try {
    const { productId } = req.params;

    console.log('➖ Removing from wishlist:', { userId: req.user.id, productId });

    const wishlistItem = await Wishlist.findOneAndDelete({
      user: req.user.id, // Integer ID
      product: productId
    });

    if (!wishlistItem) {
      return res.status(404).json({ success: false, message: 'Product not found in wishlist' });
    }

    console.log('✅ Removed from wishlist');

    res.json({
      success: true,
      message: 'Product removed from wishlist'
    });
  } catch (error) {
    console.error('❌ Error removing from wishlist:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// Check if product is in wishlist
router.get('/wishlist/check/:productId', auth, async (req, res) => {
  try {
    const { productId } = req.params;

    const wishlistItem = await Wishlist.findOne({
      user: req.user.id,
      product: productId
    });

    res.json({
      success: true,
      inWishlist: !!wishlistItem
    });
  } catch (error) {
    console.error('Error checking wishlist:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// Get wishlist count
router.get('/wishlist/count', auth, async (req, res) => {
  try {
    const count = await Wishlist.countDocuments({ user: req.user.id });

    res.json({
      success: true,
      count: count
    });
  } catch (error) {
    console.error('Error getting wishlist count:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// Clear wishlist
router.delete('/wishlist/clear', auth, async (req, res) => {
  try {
    const result = await Wishlist.deleteMany({ user: req.user.id });

    res.json({
      success: true,
      message: `Cleared ${result.deletedCount} items from wishlist`
    });
  } catch (error) {
    console.error('Error clearing wishlist:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

module.exports = router;