// In your cart routes file (backend/routes/cart.js)
router.get('/', auth, async (req, res) => {
  try {
    const user = req.user;
    
    if (!user.cart) {
      return res.json({ 
        items: [], 
        cartTotal: 0, 
        cartItemCount: 0 
      });
    }
    
    // If you need product details, fetch them manually
    const Product = mongoose.model('Product');
    const productIds = user.cart.items.map(item => item.product);
    const products = await Product.find({ id: { $in: productIds } });
    
    // Create a map for easy lookup
    const productMap = {};
    products.forEach(product => {
      productMap[product.id] = product;
    });
    
    // Add product details to items
    const itemsWithDetails = user.cart.items.map(item => {
      const product = productMap[item.product];
      return {
        ...item.toObject(),
        productDetails: product ? {
          id: product.id,
          name: product.name,
          image_url: product.image_url,
          category: product.category,
          price: product.price
        } : null
      };
    });
    
    res.json({
      ...user.cart.toObject(),
      items: itemsWithDetails,
      cartTotal: user.cartTotal,
      cartItemCount: user.cartItemCount
    });
    
  } catch (error) {
    console.error('Get cart error:', error);
    res.status(500).json({ error: error.message });
  }
});