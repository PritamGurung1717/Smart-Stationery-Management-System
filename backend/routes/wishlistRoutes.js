const express = require('express');
const router = express.Router();
const { auth } = require('../middleware/auth');
const Wishlist = require('../models/wishlist');
const Product = require('../models/product');

// Get user's wishlist
router.get('/wishlist', auth, async (req, res) => {
  try {
    console.log('📋 Fetching wishlist for user ID:', req.user.id);
    const wishlistItems = await Wishlist.find({ user: req.user.id }).sort({ createdAt: -1 });

    // Manually populate products by integer id
    const productIds = wishlistItems.map(i => i.product);
    const products = await Product.find({ id: { $in: productIds } });
    const productMap = {};
    products.forEach(p => { productMap[p.id] = p; });

    const populated = wishlistItems.map(i => ({
      _id: i._id,
      user: i.user,
      product: productMap[i.product] || null,
      createdAt: i.createdAt
    }));

    console.log(`✅ Found ${populated.length} wishlist items`);
    res.json({ success: true, wishlist: populated, count: populated.length });
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

    if (!productId) return res.status(400).json({ success: false, message: 'Product ID is required' });

    const product = await Product.findOne({ id: parseInt(productId) });
    if (!product) return res.status(404).json({ success: false, message: 'Product not found' });

    const existing = await Wishlist.findOne({ user: req.user.id, product: parseInt(productId) });
    if (existing) return res.status(400).json({ success: false, message: 'Product already in wishlist' });

    const wishlistItem = new Wishlist({ user: req.user.id, product: parseInt(productId) });
    await wishlistItem.save();

    console.log('✅ Added to wishlist');
    res.json({ success: true, message: 'Product added to wishlist', wishlistItem: { ...wishlistItem.toObject(), product } });
  } catch (error) {
    console.error('❌ Error adding to wishlist:', error);
    if (error.code === 11000) return res.status(400).json({ success: false, message: 'Product already in wishlist' });
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// Remove from wishlist
router.delete('/wishlist/remove/:productId', auth, async (req, res) => {
  try {
    const productId = parseInt(req.params.productId);
    console.log('➖ Removing from wishlist:', { userId: req.user.id, productId });

    const wishlistItem = await Wishlist.findOneAndDelete({ user: req.user.id, product: productId });
    if (!wishlistItem) return res.status(404).json({ success: false, message: 'Product not found in wishlist' });

    console.log('✅ Removed from wishlist');
    res.json({ success: true, message: 'Product removed from wishlist' });
  } catch (error) {
    console.error('❌ Error removing from wishlist:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// Check if product is in wishlist
router.get('/wishlist/check/:productId', auth, async (req, res) => {
  try {
    const wishlistItem = await Wishlist.findOne({ user: req.user.id, product: parseInt(req.params.productId) });
    res.json({ success: true, inWishlist: !!wishlistItem });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// Get wishlist count
router.get('/wishlist/count', auth, async (req, res) => {
  try {
    const count = await Wishlist.countDocuments({ user: req.user.id });
    res.json({ success: true, count });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// Clear wishlist
router.delete('/wishlist/clear', auth, async (req, res) => {
  try {
    const result = await Wishlist.deleteMany({ user: req.user.id });
    res.json({ success: true, message: `Cleared ${result.deletedCount} items from wishlist` });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

module.exports = router;
