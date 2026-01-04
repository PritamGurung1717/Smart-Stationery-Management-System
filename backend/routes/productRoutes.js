const express = require('express');
const router = express.Router();
const Product = require('../models/product');
const { auth, adminAuth } = require('../middleware/auth');

// Get all products (Public access)
router.get('/', async (req, res) => { 
  try {
    const { 
      page = 1, 
      limit = 20, 
      search = '', 
      category = '', 
      sortBy = 'createdAt', 
      sortOrder = 'desc',
      inStock = ''
    } = req.query;

    // Build query
    const query = {};
    
    // Search by product name
    if (search) {
      query.name = { $regex: search, $options: 'i' };
    }
    
    // Filter by category
    if (category) {
      query.category = category;
    }
    
    // Filter by stock availability
    if (inStock === 'true') {
      query.stock = { $gt: 0 };
    } else if (inStock === 'false') {
      query.stock = 0;
    }

    // Build sort object
    const sort = {};
    sort[sortBy] = sortOrder === 'desc' ? -1 : 1;

    // Execute query with pagination
    const products = await Product.find(query)
      .sort(sort)
      .limit(parseInt(limit))
      .skip((parseInt(page) - 1) * parseInt(limit));

    // Get total count for pagination info
    const total = await Product.countDocuments(query);
    const totalPages = Math.ceil(total / parseInt(limit));

    res.json({
      success: true,
      products,
      pagination: {
        currentPage: parseInt(page),
        totalPages,
        totalProducts: total,
        hasNextPage: parseInt(page) < totalPages,
        hasPrevPage: parseInt(page) > 1
      }
    });
  } catch (error) {
    console.error('Error fetching products:', error);
    res.status(500).json({ 
      success: false,
      message: 'Error fetching products' 
    });
  }
});

// Get single product (Public access)
router.get('/:id', async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);
    
    if (!product) {
      return res.status(404).json({ 
        success: false,
        message: 'Product not found' 
      });
    }

    res.json({
      success: true,
      product
    });
  } catch (error) {
    console.error('Error fetching product:', error);
    res.status(500).json({ 
      success: false,
      message: 'Error fetching product details' 
    });
  }
});

// Create product (Admin only)
router.post('/', adminAuth, async (req, res) => {
  try {
    // Validate required fields
    const { name, category, price, stock, description, image } = req.body;
    
    if (!name || !category || !price) {
      return res.status(400).json({ 
        success: false,
        message: 'Name, category, and price are required fields' 
      });
    }

    // Create new product
    const product = new Product({
      name: name.trim(),
      category: category.trim(),
      price: parseFloat(price),
      stock: parseInt(stock) || 0,
      description: description ? description.trim() : '',
      image: image || '',
      createdAt: new Date(),
      updatedAt: new Date()
    });

    // Validate product data
    const validationError = product.validateSync();
    if (validationError) {
      const errors = {};
      Object.keys(validationError.errors).forEach(key => {
        errors[key] = validationError.errors[key].message;
      });
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors
      });
    }

    const savedProduct = await product.save();
    
    res.status(201).json({
      success: true,
      message: 'Product created successfully',
      product: savedProduct
    });
  } catch (error) {
    console.error('Error creating product:', error);
    
    if (error.name === 'ValidationError') {
      const errors = {};
      Object.keys(error.errors).forEach(key => {
        errors[key] = error.errors[key].message;
      });
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors
      });
    }
    
    res.status(500).json({ 
      success: false,
      message: 'Error creating product' 
    });
  }
});

// Update product (Admin only)
router.put('/:id', adminAuth, async (req, res) => {
  try {
    const { id } = req.params;
    
    // Check if product exists
    const existingProduct = await Product.findById(id);
    if (!existingProduct) {
      return res.status(404).json({ 
        success: false,
        message: 'Product not found' 
      });
    }

    // Prepare update data
    const updateData = {
      ...req.body,
      updatedAt: new Date()
    };

    // Handle specific field updates
    if (req.body.price) {
      updateData.price = parseFloat(req.body.price);
    }
    if (req.body.stock !== undefined) {
      updateData.stock = parseInt(req.body.stock);
    }
    if (req.body.name) {
      updateData.name = req.body.name.trim();
    }
    if (req.body.description !== undefined) {
      updateData.description = req.body.description.trim();
    }
    if (req.body.category) {
      updateData.category = req.body.category.trim();
    }

    // Update product
    const updatedProduct = await Product.findByIdAndUpdate(
      id,
      updateData,
      { 
        new: true,
        runValidators: true
      }
    );

    res.json({
      success: true,
      message: 'Product updated successfully',
      product: updatedProduct
    });
  } catch (error) {
    console.error('Error updating product:', error);
    
    if (error.name === 'ValidationError') {
      const errors = {};
      Object.keys(error.errors).forEach(key => {
        errors[key] = error.errors[key].message;
      });
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors
      });
    }
    
    if (error.name === 'CastError') {
      return res.status(400).json({ 
        success: false,
        message: 'Invalid product ID' 
      });
    }
    
    res.status(500).json({ 
      success: false,
      message: 'Error updating product' 
    });
  }
});

// Delete product (Admin only)
router.delete('/:id', adminAuth, async (req, res) => {
  try {
    const { id } = req.params;
    
    // Check if product exists
    const product = await Product.findById(id);
    if (!product) {
      return res.status(404).json({ 
        success: false,
        message: 'Product not found' 
      });
    }

    // Delete product
    await Product.findByIdAndDelete(id);

    res.json({
      success: true,
      message: 'Product deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting product:', error);
    
    if (error.name === 'CastError') {
      return res.status(400).json({ 
        success: false,
        message: 'Invalid product ID' 
      });
    }
    
    res.status(500).json({ 
      success: false,
      message: 'Error deleting product' 
    });
  }
});

// Get product statistics (Admin only)
router.get('/stats/summary', adminAuth, async (req, res) => {
  try {
    const totalProducts = await Product.countDocuments();
    const outOfStock = await Product.countDocuments({ stock: 0 });
    const lowStock = await Product.countDocuments({ stock: { $gt: 0, $lte: 10 } });
    const inStock = totalProducts - outOfStock;
    
    // Get total value of inventory
    const inventoryValue = await Product.aggregate([
      {
        $group: {
          _id: null,
          totalValue: { $sum: { $multiply: ['$price', '$stock'] } }
        }
      }
    ]);

    // Get products by category
    const categoryStats = await Product.aggregate([
      {
        $group: {
          _id: '$category',
          count: { $sum: 1 },
          totalStock: { $sum: '$stock' }
        }
      },
      { $sort: { count: -1 } }
    ]);

    res.json({
      success: true,
      stats: {
        totalProducts,
        outOfStock,
        lowStock,
        inStock,
        inventoryValue: inventoryValue[0]?.totalValue || 0,
        categoryStats
      }
    });
  } catch (error) {
    console.error('Error fetching product stats:', error);
    res.status(500).json({ 
      success: false,
      message: 'Error fetching product statistics' 
    });
  }
});

// Get all categories
router.get('/categories/all', async (req, res) => {
  try {
    const categories = await Product.distinct('category');
    
    res.json({
      success: true,
      categories: categories.filter(cat => cat).sort()
    });
  } catch (error) {
    console.error('Error fetching categories:', error);
    res.status(500).json({ 
      success: false,
      message: 'Error fetching categories' 
    });
  }
});

module.exports = router;