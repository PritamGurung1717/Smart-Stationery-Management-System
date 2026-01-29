const jwt = require('jsonwebtoken');
const User = require('../models/user');

const auth = async (req, res, next) => {
  try {
    // Get token from header
    const token = req.header('Authorization')?.replace('Bearer ', '');
    
    if (!token) {
      return res.status(401).json({ 
        success: false,
        message: 'Access denied. No token provided.' 
      });
    }

    // Verify token
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key');
    
    // Find user by ID
    const user = await User.findOne({ 
      id: decoded.id,
      'tokens.token': token 
    });
    
    if (!user) {
      return res.status(401).json({ 
        success: false,
        message: 'Invalid or expired token.' 
      });
    }

    // Check if user is active
    if (user.status === 'suspended') {
      return res.status(401).json({ 
        success: false,
        message: 'Your account has been suspended. Please contact admin.' 
      });
    }

    // Add user and token to request
    req.user = user;
    req.token = token;
    
    next();
  } catch (error) {
    console.error('Auth middleware error:', error);
    res.status(401).json({ 
      success: false,
      message: 'Authentication failed. Please login again.' 
    });
  }
};

// Middleware for admin-only routes
const adminAuth = async (req, res, next) => {
  try {
    await auth(req, res, () => {
      if (req.user.role !== 'admin') {
        return res.status(403).json({ 
          success: false,
          message: 'Access denied. Admin privileges required.' 
        });
      }
      next();
    });
  } catch (error) {
    console.error('Admin auth error:', error);
    res.status(500).json({ 
      success: false,
      message: 'Admin authentication failed.' 
    });
  }
};

// Middleware for institute-only routes
const instituteAuth = async (req, res, next) => {
  try {
    await auth(req, res, () => {
      if (req.user.role !== 'institute') {
        return res.status(403).json({ 
          success: false,
          message: 'Access denied. Institute account required.' 
        });
      }
      next();
    });
  } catch (error) {
    console.error('Institute auth error:', error);
    res.status(500).json({ 
      success: false,
      message: 'Institute authentication failed.' 
    });
  }
};

module.exports = { auth, adminAuth, instituteAuth };