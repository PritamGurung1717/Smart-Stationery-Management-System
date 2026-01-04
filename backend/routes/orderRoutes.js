const express = require('express');
const router = express.Router();
const Order = require('../models/order');
const Product = require('../models/product');
const { auth } = require('../middleware/auth'); // FIXED: Destructure auth from object

// Create new order (Customer)
// router.post('/', auth, async (req, res) => {
  router.get('/', async (req, res) => {  
  try {
    const { products, shippingAddress, paymentMethod, notes } = req.body;
    
    // Calculate total and validate stock
    let totalAmount = 0;
    const orderProducts = [];
    
    for (const item of products) {
      const product = await Product.findById(item.productId);
      if (!product) {
        return res.status(404).json({ 
          success: false,
          message: `Product ${item.productId} not found` 
        });
      }
      
      if (product.stock < item.quantity) {
        return res.status(400).json({ 
          success: false,
          message: `Insufficient stock for ${product.name}. Available: ${product.stock}` 
        });
      }
      
      // Update product stock
      product.stock -= item.quantity;
      await product.save();
      
      totalAmount += product.price * item.quantity;
      
      orderProducts.push({
        product: item.productId,
        quantity: item.quantity,
        price: product.price
      });
    }
    
    const order = new Order({
      user: req.user.id,
      products: orderProducts,
      totalAmount,
      shippingAddress,
      paymentMethod,
      notes,
      paymentStatus: paymentMethod === 'COD' ? 'Pending' : 'Pending'
    });
    
    const savedOrder = await order.save();
    res.status(201).json({
      success: true,
      message: 'Order created successfully',
      order: savedOrder
    });
  } catch (error) {
    console.error('Error creating order:', error);
    res.status(400).json({ 
      success: false,
      message: error.message 
    });
  }
});

// Get user orders
router.get('/my-orders', auth, async (req, res) => {
  try {
    const orders = await Order.find({ user: req.user.id })
      .populate('products.product', 'name image')
      .sort({ createdAt: -1 });
    
    res.json({
      success: true,
      orders
    });
  } catch (error) {
    console.error('Error fetching user orders:', error);
    res.status(500).json({ 
      success: false,
      message: 'Error fetching orders' 
    });
  }
});

// Get all orders (Admin only)
router.get('/', auth, async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ 
        success: false,
        message: 'Access denied. Admin privileges required.' 
      });
    }
    
    const orders = await Order.find()
      .populate('user', 'name email')
      .populate('products.product', 'name image')
      .sort({ createdAt: -1 });
    
    res.json({
      success: true,
      orders
    });
  } catch (error) {
    console.error('Error fetching all orders:', error);
    res.status(500).json({ 
      success: false,
      message: 'Error fetching orders' 
    });
  }
});

// Update order status (Admin only)
router.put('/:id/status', auth, async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ 
        success: false,
        message: 'Access denied. Admin privileges required.' 
      });
    }
    
    const order = await Order.findById(req.params.id);
    if (!order) {
      return res.status(404).json({ 
        success: false,
        message: 'Order not found' 
      });
    }
    
    order.orderStatus = req.body.status;
    order.trackingNumber = req.body.trackingNumber || order.trackingNumber;
    order.updatedAt = Date.now();
    
    const updatedOrder = await order.save();
    
    res.json({
      success: true,
      message: 'Order status updated successfully',
      order: updatedOrder
    });
  } catch (error) {
    console.error('Error updating order status:', error);
    res.status(400).json({ 
      success: false,
      message: error.message 
    });
  }
});

// Get order by ID
router.get('/:id', auth, async (req, res) => {
  try {
    const order = await Order.findById(req.params.id)
      .populate('user', 'name email')
      .populate('products.product', 'name image price');
    
    if (!order) {
      return res.status(404).json({ 
        success: false,
        message: 'Order not found' 
      });
    }
    
    // Check if user is authorized
    if (req.user.role !== 'admin' && order.user._id.toString() !== req.user.id) {
      return res.status(403).json({ 
        success: false,
        message: 'Access denied' 
      });
    }
    
    res.json({
      success: true,
      order
    });
  } catch (error) {
    console.error('Error fetching order:', error);
    res.status(500).json({ 
      success: false,
      message: 'Error fetching order details' 
    });
  }
});

module.exports = router;