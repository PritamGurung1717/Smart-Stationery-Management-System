// backend/routes/productRoutes.js - COMPLETE UPDATED
const express = require("express");
const Product = require("../models/product");
const Counter = require("../models/counter");
const router = express.Router();
const { auth, adminAuth } = require("../middleware/auth");
const multer = require("multer");
const path = require("path");
const fs = require("fs");

// Configure multer for image upload
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    const uploadDir = "uploads/products/";
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    cb(
      null,
      file.fieldname + "-" + uniqueSuffix + path.extname(file.originalname)
    );
  },
});

const upload = multer({
  storage: storage,
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: function (req, file, cb) {
    const filetypes = /jpeg|jpg|png|gif|webp/;
    const extname = filetypes.test(
      path.extname(file.originalname).toLowerCase()
    );
    const mimetype = filetypes.test(file.mimetype);

    if (mimetype && extname) {
      return cb(null, true);
    } else {
      cb(new Error("Only image files are allowed!"));
    }
  },
});

// ----------------- PRODUCT ROUTES -----------------

// Get all products with filtering and pagination
router.get("/", async (req, res) => {
  try {
    const {
      category = "",
      minPrice = "",
      maxPrice = "",
      search = "",
      page = 1,
      limit = 12,
      sortBy = "created_at",
      sortOrder = "desc",
      inStock = "",
    } = req.query;

    const query = {};

    // Apply filters
    if (category) query.category = category.toLowerCase();
    if (minPrice || maxPrice) {
      query.price = {};
      if (minPrice) query.price.$gte = parseFloat(minPrice);
      if (maxPrice) query.price.$lte = parseFloat(maxPrice);
    }
    if (inStock === "true") {
      query.stock_quantity = { $gt: 0 };
    } else if (inStock === "false") {
      query.stock_quantity = { $lte: 0 };
    }

    // Enhanced search functionality
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: "i" } },
        { description: { $regex: search, $options: "i" } },
        { category: { $regex: search, $options: "i" } },
        { author: { $regex: search, $options: "i" } },
        { genre: { $regex: search, $options: "i" } },
      ];
      
      if (!isNaN(search)) {
        query.$or.push({ id: Number(search) });
      }
    }

    // Sorting
    const sort = {};
    sort[sortBy] = sortOrder === "desc" ? -1 : 1;

    // Pagination
    const skip = (parseInt(page) - 1) * parseInt(limit);

    const [products, total] = await Promise.all([
      Product.find(query)
        .sort(sort)
        .skip(skip)
        .limit(parseInt(limit)),
      Product.countDocuments(query),
    ]);

    res.json({
      success: true,
      count: products.length,
      total,
      totalPages: Math.ceil(total / parseInt(limit)),
      currentPage: parseInt(page),
      products,
    });
  } catch (error) {
    console.error("Get products error:", error);
    res.status(500).json({
      success: false,
      message: "Error fetching products",
      error: error.message,
    });
  }
});

// Get product by ID
router.get("/:id", async (req, res) => {
  try {
    const product = await Product.findOne({ id: Number(req.params.id) });

    if (!product) {
      return res.status(404).json({
        success: false,
        message: "Product not found",
      });
    }

    // Get related products (same category)
    const relatedProducts = await Product.find({
      category: product.category,
      id: { $ne: product.id },
    }).limit(4);

    res.json({
      success: true,
      product,
      relatedProducts,
    });
  } catch (error) {
    console.error("Get product by ID error:", error);
    res.status(500).json({
      success: false,
      message: "Error fetching product",
      error: error.message,
    });
  }
});

// Create product (Admin only) - UPDATED WITH DEBUG
router.post(
  "/",
  adminAuth,
  upload.single("image"),
  async (req, res) => {
    try {
      console.log("=== CREATE PRODUCT REQUEST ===");
      console.log("Body:", req.body);
      console.log("File:", req.file);
      
      const { name, category, price, description, author, genre, stock_quantity, image_url } =
        req.body;

      // Validate required fields
      if (!name || !category || !price || stock_quantity === undefined) {
        console.log("Validation failed - missing fields");
        return res.status(400).json({
          success: false,
          message: "Name, category, price, and stock quantity are required",
        });
      }

      console.log("Category from request:", category);

      // Get next product ID from counter
      console.log("Getting next product ID...");
      let nextId;
      try {
        const counter = await Counter.findByIdAndUpdate(
          { _id: "productId" },
          { $inc: { sequence_value: 1 } },
          { new: true, upsert: true }
        );
        nextId = counter.sequence_value;
        console.log("Next ID from counter:", nextId);
      } catch (counterError) {
        console.error("Counter error:", counterError.message);
        // Fallback: get max ID + 1
        const maxProduct = await Product.findOne().sort({ id: -1 });
        nextId = maxProduct ? maxProduct.id + 1 : 1;
        console.log("Fallback ID:", nextId);
        
        // Create counter if it doesn't exist
        await Counter.findByIdAndUpdate(
          { _id: "productId" },
          { $set: { sequence_value: nextId + 1 } },
          { upsert: true }
        );
      }

      // Dynamic category validation
      const categoryLower = category.toLowerCase().trim();
      console.log("Category after processing:", categoryLower);
      
      if (!categoryLower) {
        return res.status(400).json({
          success: false,
          message: "Category is required",
        });
      }

      const productData = {
        id: nextId,
        name: name.trim(),
        category: categoryLower,
        price: parseFloat(price),
        stock_quantity: parseInt(stock_quantity),
        description: description || "",
        author: author || "",
        genre: genre || "",
        image_url: image_url || ""
      };

      console.log("Product data to save:", productData);

      // Handle image upload if exists
      if (req.file) {
        productData.image_url = `/uploads/products/${req.file.filename}`;
        console.log("Image added:", productData.image_url);
      }

      const product = new Product(productData);
      console.log("Product object created, attempting to save...");
      
      await product.save();
      console.log("✅ Product saved successfully. ID:", product.id);

      res.status(201).json({
        success: true,
        message: "Product created successfully",
        product,
      });
    } catch (error) {
      console.error("❌ CREATE PRODUCT ERROR:", error);
      console.error("Error name:", error.name);
      console.error("Error code:", error.code);
      console.error("Error message:", error.message);
      console.error("Error stack:", error.stack);
      
      // Clean up uploaded file if error occurs
      if (req.file) {
        fs.unlink(req.file.path, (err) => {
          if (err) console.error("Error deleting file:", err);
        });
      }
      
      // Check for duplicate key error
      if (error.code === 11000 || error.message.includes("duplicate")) {
        return res.status(400).json({
          success: false,
          message: "Product ID already exists or duplicate entry",
          error: error.message,
        });
      }
      
      // Check for validation error
      if (error.name === 'ValidationError') {
        return res.status(400).json({
          success: false,
          message: "Validation failed",
          error: error.message,
          errors: error.errors
        });
      }
      
      res.status(500).json({
        success: false,
        message: "Product creation failed",
        error: error.message,
      });
    }
  }
);

// Update product (Admin only)
router.put(
  "/:id",
  adminAuth,
  upload.single("image"),
  async (req, res) => {
    try {
      const product = await Product.findOne({ id: Number(req.params.id) });

      if (!product) {
        return res.status(404).json({
          success: false,
          message: "Product not found",
        });
      }

      const { name, category, price, description, author, genre, stock_quantity, image_url } =
        req.body;

      // Update fields
      if (name !== undefined) product.name = name.trim();
      
      if (category !== undefined) {
        const categoryLower = category.toLowerCase().trim();
        
        if (!categoryLower) {
          return res.status(400).json({
            success: false,
            message: "Category cannot be empty",
          });
        }
        
        product.category = categoryLower;
      }
      
      if (price !== undefined) product.price = parseFloat(price);
      if (stock_quantity !== undefined) product.stock_quantity = parseInt(stock_quantity);
      if (description !== undefined) product.description = description;
      if (author !== undefined) product.author = author;
      if (genre !== undefined) product.genre = genre;

      // Handle image update
      if (req.file) {
        // Delete old image if exists and was uploaded
        if (product.image_url && product.image_url.startsWith('/uploads/products/') && 
            fs.existsSync(`.${product.image_url}`)) {
          fs.unlink(`.${product.image_url}`, (err) => {
            if (err) console.error("Error deleting old image:", err);
          });
        }
        product.image_url = `/uploads/products/${req.file.filename}`;
      } else if (image_url !== undefined) {
        if (image_url !== product.image_url && 
            product.image_url && product.image_url.startsWith('/uploads/products/') && 
            fs.existsSync(`.${product.image_url}`)) {
          fs.unlink(`.${product.image_url}`, (err) => {
            if (err) console.error("Error deleting old image:", err);
          });
        }
        product.image_url = image_url;
      }

      product.updated_at = new Date();
      await product.save();

      res.json({
        success: true,
        message: "Product updated successfully",
        product,
      });
    } catch (error) {
      // Clean up uploaded file if error occurs
      if (req.file) {
        fs.unlink(req.file.path, (err) => {
          if (err) console.error("Error deleting file:", err);
        });
      }
      console.error("Update product error:", error);
      res.status(500).json({
        success: false,
        message: "Error updating product",
        error: error.message,
      });
    }
  }
);

// Delete product (Admin only)
router.delete("/:id", adminAuth, async (req, res) => {
  try {
    const product = await Product.findOne({ id: Number(req.params.id) });

    if (!product) {
      return res.status(404).json({
        success: false,
        message: "Product not found",
      });
    }

    // Delete associated image
    if (product.image_url && product.image_url.startsWith('/uploads/products/') && 
        fs.existsSync(`.${product.image_url}`)) {
      fs.unlink(`.${product.image_url}`, (err) => {
        if (err) console.error("Error deleting image:", err);
      });
    }

    await Product.findOneAndDelete({ id: Number(req.params.id) });

    res.json({
      success: true,
      message: "Product deleted successfully",
    });
  } catch (error) {
    console.error("Delete product error:", error);
    res.status(500).json({
      success: false,
      message: "Error deleting product",
      error: error.message,
    });
  }
});

// Get products by category (dynamic categories)
router.get("/category/:category", async (req, res) => {
  try {
    const { page = 1, limit = 12, sortBy = "created_at", sortOrder = "desc", search = "" } =
      req.query;

    const category = req.params.category.toLowerCase();
    
    const query = { category: category };

    if (search) {
      query.$or = [
        { name: { $regex: search, $options: "i" } },
        { description: { $regex: search, $options: "i" } },
        { author: { $regex: search, $options: "i" } },
        { genre: { $regex: search, $options: "i" } },
      ];
      
      if (!isNaN(search)) {
        query.$or.push({ id: Number(search) });
      }
    }

    const [products, total] = await Promise.all([
      Product.find(query)
        .sort({ [sortBy]: sortOrder === "desc" ? -1 : 1 })
        .skip((parseInt(page) - 1) * parseInt(limit))
        .limit(parseInt(limit)),
      Product.countDocuments(query),
    ]);

    res.json({
      success: true,
      category: category,
      count: products.length,
      total,
      totalPages: Math.ceil(total / parseInt(limit)),
      currentPage: parseInt(page),
      products,
    });
  } catch (error) {
    console.error("Get products by category error:", error);
    res.status(500).json({
      success: false,
      message: "Error fetching category products",
      error: error.message,
    });
  }
});

// Get all unique categories (for dropdowns/filtering)
router.get("/categories/all", async (req, res) => {
  try {
    const categories = await Product.distinct("category");
    
    const sortedCategories = categories.sort((a, b) => a.localeCompare(b));
    
    res.json({
      success: true,
      categories: sortedCategories,
      count: categories.length
    });
  } catch (error) {
    console.error("Get all categories error:", error);
    res.status(500).json({
      success: false,
      message: "Error fetching categories",
      error: error.message,
    });
  }
});

module.exports = router;