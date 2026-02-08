import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Container, Row, Col, Card, Button, Badge, Form, Spinner, InputGroup, Dropdown, Modal } from "react-bootstrap";
import axios from "axios";
import { 
  FaSearch, FaShoppingCart, FaUser, FaHeart, FaBox, FaTruck, 
  FaShieldAlt, FaHeadset, FaStar, FaEdit, FaHistory, FaKey, 
  FaSignOutAlt, FaTimes 
} from "react-icons/fa";

const Dashboard = ({ setUser }) => {
  const navigate = useNavigate();
  const [user, setLocalUser] = useState(null);
  const [cart, setCart] = useState({ items: [] });
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [products, setProducts] = useState([]);
  const [allProducts, setAllProducts] = useState([]);
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [quantities, setQuantities] = useState({});
  const [searchQuery, setSearchQuery] = useState("");
  const [wishlist, setWishlist] = useState([]);
  const [wishlistLoading, setWishlistLoading] = useState({});
  const [showWishlistModal, setShowWishlistModal] = useState(false);
  
  const categories = [
    { id: "all", name: "All Products", icon: "📦" },
    { id: "book", name: "Books", icon: "📚" },
    { id: "stationery", name: "Stationery", icon: "✏️" },
    { id: "electronics", name: "Electronics", icon: "💻" },
    { id: "sports", name: "Sports", icon: "⚽" }
  ];

  useEffect(() => {
    const token = localStorage.getItem("token");
    const storedUser = JSON.parse(localStorage.getItem("user"));
    
    if (!storedUser) {
      navigate("/login");
      return;
    }

    if (storedUser.role === "admin") {
      navigate("/admin-dashboard");
      return;
    }

    if (storedUser.role === "institute") {
      navigate("/institute-dashboard");
      return;
    }

    setLocalUser(storedUser);
    
    if (token) {
      axios.defaults.headers.common["Authorization"] = `Bearer ${token}`;
    }

    fetchDashboardData();
    fetchWishlist();
  }, [navigate]);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      
      const token = localStorage.getItem("token");
      if (!token) return;

      const headers = { Authorization: `Bearer ${token}` };

      const [allProductsRes, cartRes, ordersRes] = await Promise.all([
        axios.get("http://localhost:5000/api/products", { headers })
          .catch(err => ({ data: { products: [] } })),
        axios.get("http://localhost:5000/api/users/cart", { headers })
          .catch(err => ({ data: { cart: { items: [] } } })),
        axios.get("http://localhost:5000/api/orders/my-orders?limit=5", { headers })
          .catch(err => ({ data: { orders: [] } }))
      ]);

      setAllProducts(allProductsRes.data.products || []);
      setProducts(allProductsRes.data.products || []);
      setCart(cartRes.data.cart || { items: [] });
      setOrders(ordersRes.data.orders || []);
      
      const initialQuantities = {};
      (allProductsRes.data.products || []).forEach(product => {
        initialQuantities[product.id] = 1;
      });
      setQuantities(initialQuantities);

    } catch (error) {
      console.error("Error fetching dashboard data:", error);
    } finally {
      setLoading(false);
    }
  };

  const fetchWishlist = async () => {
    try {
      const token = localStorage.getItem("token");
      if (!token) {
        // Try to get from localStorage if no token
        const storedWishlist = JSON.parse(localStorage.getItem("wishlist") || "[]");
        setWishlist(storedWishlist);
        return;
      }

      const headers = { Authorization: `Bearer ${token}` };
      
      try {
        const response = await axios.get("http://localhost:5000/api/users/wishlist", { headers });
        if (response.data.success) {
          setWishlist(response.data.wishlist);
          localStorage.setItem("wishlist", JSON.stringify(response.data.wishlist));
        }
      } catch (apiError) {
        // If API doesn't exist, use localStorage
        console.log("Using localStorage for wishlist");
        const storedWishlist = JSON.parse(localStorage.getItem("wishlist") || "[]");
        setWishlist(storedWishlist);
      }
    } catch (error) {
      console.error("Error fetching wishlist:", error);
      const storedWishlist = JSON.parse(localStorage.getItem("wishlist") || "[]");
      setWishlist(storedWishlist);
    }
  };

  const addToWishlist = async (product) => {
    try {
      setWishlistLoading(prev => ({ ...prev, [product.id]: true }));
      
      const token = localStorage.getItem("token");
      const productId = product.id;
      
      if (token) {
        try {
          await axios.post("http://localhost:5000/api/users/wishlist/add", 
            { productId }, 
            { headers: { Authorization: `Bearer ${token}` } }
          );
        } catch (apiError) {
          // If API fails, use localStorage
          console.log("Using localStorage for wishlist");
        }
      }
      
      // Add to local state and localStorage
      const updatedWishlist = [...wishlist, { ...product, product_id: productId }];
      setWishlist(updatedWishlist);
      localStorage.setItem("wishlist", JSON.stringify(updatedWishlist));
      
    } catch (error) {
      console.error("Error adding to wishlist:", error);
      alert("Failed to add to wishlist");
    } finally {
      setWishlistLoading(prev => ({ ...prev, [product.id]: false }));
    }
  };

  const removeFromWishlist = async (productId) => {
    try {
      setWishlistLoading(prev => ({ ...prev, [productId]: true }));
      
      const token = localStorage.getItem("token");
      
      if (token) {
        try {
          await axios.delete(`http://localhost:5000/api/users/wishlist/remove/${productId}`, 
            { headers: { Authorization: `Bearer ${token}` } }
          );
        } catch (apiError) {
          // If API fails, use localStorage
          console.log("Using localStorage for wishlist");
        }
      }
      
      // Remove from local state and localStorage
      const updatedWishlist = wishlist.filter(item => 
        (item.id !== productId) && (item.product_id !== productId)
      );
      setWishlist(updatedWishlist);
      localStorage.setItem("wishlist", JSON.stringify(updatedWishlist));
      
    } catch (error) {
      console.error("Error removing from wishlist:", error);
      alert("Failed to remove from wishlist");
    } finally {
      setWishlistLoading(prev => ({ ...prev, [productId]: false }));
    }
  };

  const isInWishlist = (productId) => {
    return wishlist.some(item => 
      item.id === productId || item.product_id === productId
    );
  };

  const addToCart = async (productId, quantity = 1) => {
    try {
      const product = products.find(p => p.id === productId);
      if (!product) {
        alert("Product not found!");
        return;
      }
      
      if (quantity > product.stock_quantity) {
        alert(`Only ${product.stock_quantity} items available in stock!`);
        return;
      }
      
      const token = localStorage.getItem("token");
      await axios.post("http://localhost:5000/api/users/cart/add", {
        productId: productId,
        quantity: quantity
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      const cartRes = await axios.get("http://localhost:5000/api/users/cart", {
        headers: { Authorization: `Bearer ${token}` }
      });
      setCart(cartRes.data.cart || { items: [] });
      
      alert(`Added ${quantity} item(s) to cart successfully!`);
    } catch (error) {
      console.error("Error adding to cart:", error);
      alert(error.response?.data?.message || "Failed to add to cart");
    }
  };

  const getCartItemCount = () => {
    return cart.items.reduce((count, item) => count + item.quantity, 0);
  };

  const handleSearch = (query) => {
    setSearchQuery(query);
    if (query.trim() === "") {
      setProducts(allProducts);
      setSelectedCategory("all");
    } else {
      const lowerQuery = query.toLowerCase();
      const filtered = allProducts
        .map(product => {
          let score = 0;
          const name = product.name.toLowerCase();
          const category = product.category.toLowerCase();
          const description = product.description?.toLowerCase() || "";
          
          // Exact match gets highest score
          if (name === lowerQuery) score += 100;
          if (category === lowerQuery) score += 50;
          
          // Starts with query gets high score
          if (name.startsWith(lowerQuery)) score += 30;
          if (category.startsWith(lowerQuery)) score += 20;
          
          // Contains query gets lower score
          if (name.includes(lowerQuery)) score += 10;
          if (category.includes(lowerQuery)) score += 5;
          if (description.includes(lowerQuery)) score += 2;
          
          return { ...product, score };
        })
        .filter(product => product.score > 0)
        .sort((a, b) => b.score - a.score)
        .map(({ score, ...product }) => product);
      
      setProducts(filtered);
      setSelectedCategory("all");
    }
  };

  const handleCategoryChange = (category) => {
    setSelectedCategory(category);
    setSearchQuery("");
    if (category === "all") {
      setProducts(allProducts);
    } else {
      setProducts(allProducts.filter(p => p.category === category));
    }
  };

  const handleLogout = () => {
    localStorage.removeItem("user");
    localStorage.removeItem("token");
    // Keep wishlist in localStorage for persistence
    setUser(null);
    navigate("/login", { replace: true });
  };

  const handleQuantityChange = (productId, value) => {
    const quantity = parseInt(value) || 1;
    const product = products.find(p => p.id === productId);
    
    if (product && quantity > product.stock_quantity) {
      setQuantities(prev => ({ ...prev, [productId]: product.stock_quantity }));
      return;
    }
    if (quantity < 1) {
      setQuantities(prev => ({ ...prev, [productId]: 1 }));
      return;
    }
    
    setQuantities(prev => ({ ...prev, [productId]: quantity }));
  };

  const toggleWishlist = async (product) => {
    const productId = product.id;
    
    if (isInWishlist(productId)) {
      await removeFromWishlist(productId);
    } else {
      await addToWishlist(product);
    }
  };

  const moveWishlistToCart = async (product) => {
    const productId = product.id || product.product_id;
    await addToCart(productId, 1);
    await removeFromWishlist(productId);
    setShowWishlistModal(false);
  };

  if (loading) {
    return (
      <div style={{
        minHeight: '100vh',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        color: 'white'
      }}>
        <Spinner animation="border" variant="light" />
        <p style={{ marginTop: '1rem', fontSize: '1.1rem', fontWeight: '500' }}>
          Loading your dashboard...
        </p>
      </div>
    );
  }

  if (!user) return null;

  return (
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%)',
      fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif"
    }}>
      
      {/* Navigation Header */}
      <nav style={{
        background: 'white',
        padding: '1rem 0',
        boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)',
        position: 'sticky',
        top: 0,
        zIndex: 1000,
        borderBottom: '1px solid #e5e7eb'
      }}>
        <Container>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: '2rem',
            flexWrap: 'wrap'
          }}>
            {/* Brand */}
            <div style={{ flexShrink: 0 }}>
              <h2 style={{
                fontSize: '1.75rem',
                fontWeight: 800,
                background: 'linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                margin: 0,
                lineHeight: 1.2
              }}>
                Smart Stationery
              </h2>
              <p style={{
                fontSize: '0.75rem',
                color: '#6b7280',
                margin: 0,
                fontWeight: 500
              }}>
                Your One-Stop Shop
              </p>
            </div>
            
            {/* Search Bar */}
            <div style={{ flex: 1, maxWidth: '500px' }}>
              <InputGroup style={{
                borderRadius: '50px',
                overflow: 'hidden',
                boxShadow: '0 1px 2px 0 rgb(0 0 0 / 0.05)'
              }}>
                <InputGroup.Text style={{
                  background: 'white',
                  border: 'none',
                  color: '#6b7280',
                  paddingLeft: '1rem'
                }}>
                  <FaSearch />
                </InputGroup.Text>
                <Form.Control
                  type="text"
                  placeholder="Search for products, categories..."
                  value={searchQuery}
                  onChange={(e) => handleSearch(e.target.value)}
                  style={{
                    border: 'none',
                    padding: '0.75rem 1rem',
                    fontSize: '0.95rem'
                  }}
                />
              </InputGroup>
            </div>

            {/* Actions */}
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '1rem'
            }}>
              <Button 
                variant="link" 
                onClick={() => setShowWishlistModal(true)}
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  gap: '0.25rem',
                  color: '#1f2937',
                  textDecoration: 'none',
                  padding: '0.5rem 1rem',
                  borderRadius: '12px',
                  position: 'relative'
                }}
              >
                <FaHeart style={{ 
                  fontSize: '1.5rem',
                  color: wishlist.length > 0 ? '#ef4444' : '#6b7280'
                }} />
                <span style={{ fontSize: '0.75rem', fontWeight: 600 }}>Wishlist</span>
                {wishlist.length > 0 && (
                  <Badge 
                    bg="danger" 
                    style={{
                      position: 'absolute',
                      top: '0.25rem',
                      right: '0.5rem',
                      fontSize: '0.65rem',
                      padding: '0.25rem 0.5rem'
                    }}
                  >
                    {wishlist.length}
                  </Badge>
                )}
              </Button>
              
              <Button 
                variant="link"
                onClick={() => navigate("/cart")}
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  gap: '0.25rem',
                  color: '#1f2937',
                  textDecoration: 'none',
                  padding: '0.5rem 1rem',
                  borderRadius: '12px',
                  position: 'relative'
                }}
              >
                <FaShoppingCart style={{ fontSize: '1.5rem' }} />
                <span style={{ fontSize: '0.75rem', fontWeight: 600 }}>Cart</span>
                {getCartItemCount() > 0 && (
                  <Badge 
                    bg="danger" 
                    style={{
                      position: 'absolute',
                      top: '0.25rem',
                      right: '0.5rem',
                      fontSize: '0.65rem',
                      padding: '0.25rem 0.5rem'
                    }}
                  >
                    {getCartItemCount()}
                  </Badge>
                )}
              </Button>
              
              {/* User Dropdown */}
              <Dropdown>
                <Dropdown.Toggle 
                  variant="link"
                  style={{
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    gap: '0.25rem',
                    color: '#1f2937',
                    textDecoration: 'none',
                    padding: '0.5rem 1rem',
                    borderRadius: '12px',
                    border: 'none'
                  }}
                >
                  <FaUser style={{ fontSize: '1.5rem' }} />
                  <span style={{ fontSize: '0.75rem', fontWeight: 600 }}>{user.name}</span>
                </Dropdown.Toggle>

                <Dropdown.Menu style={{ 
                  marginTop: '0.5rem',
                  border: 'none',
                  boxShadow: '0 10px 25px rgba(0,0,0,0.1)',
                  borderRadius: '12px',
                  padding: '0.5rem'
                }}>
                  <Dropdown.Item 
                    onClick={() => navigate("/profile")}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.75rem',
                      padding: '0.75rem 1rem',
                      borderRadius: '8px',
                      fontSize: '0.95rem',
                      fontWeight: 500
                    }}
                  >
                    <FaEdit style={{ color: '#6b7280' }} />
                    Edit Profile
                  </Dropdown.Item>
                  <Dropdown.Item 
                    onClick={() => navigate("/my-orders")}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.75rem',
                      padding: '0.75rem 1rem',
                      borderRadius: '8px',
                      fontSize: '0.95rem',
                      fontWeight: 500
                    }}
                  >
                    <FaHistory style={{ color: '#6b7280' }} />
                    My Orders
                  </Dropdown.Item>
                  <Dropdown.Item 
                    onClick={() => navigate("/change-password")}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.75rem',
                      padding: '0.75rem 1rem',
                      borderRadius: '8px',
                      fontSize: '0.95rem',
                      fontWeight: 500
                    }}
                  >
                    <FaKey style={{ color: '#6b7280' }} />
                    Change Password
                  </Dropdown.Item>
                  <Dropdown.Divider />
                  <Dropdown.Item 
                    onClick={handleLogout}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.75rem',
                      padding: '0.75rem 1rem',
                      borderRadius: '8px',
                      fontSize: '0.95rem',
                      fontWeight: 500,
                      color: '#ef4444'
                    }}
                  >
                    <FaSignOutAlt />
                    Logout
                  </Dropdown.Item>
                </Dropdown.Menu>
              </Dropdown>
            </div>
          </div>
        </Container>
      </nav>

      {/* Wishlist Modal */}
      <Modal show={showWishlistModal} onHide={() => setShowWishlistModal(false)} size="lg">
        <Modal.Header closeButton>
          <Modal.Title style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <FaHeart style={{ color: '#ef4444' }} />
            My Wishlist ({wishlist.length} items)
          </Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {wishlist.length === 0 ? (
            <div className="text-center py-4">
              <FaHeart style={{ fontSize: '3rem', color: '#e5e7eb', marginBottom: '1rem' }} />
              <h5>Your wishlist is empty</h5>
              <p className="text-muted">Add items you love to your wishlist</p>
              <Button variant="primary" onClick={() => setShowWishlistModal(false)}>
                Continue Shopping
              </Button>
            </div>
          ) : (
            <Row>
              {wishlist.map(item => (
                <Col md={6} key={item.id || item.product_id}>
                  <Card style={{ marginBottom: '1rem' }}>
                    <Card.Body>
                      <div style={{ display: 'flex', gap: '1rem' }}>
                        <img 
                          src={item.image_url || "https://via.placeholder.com/100"} 
                          alt={item.name}
                          style={{ width: '80px', height: '80px', objectFit: 'cover', borderRadius: '8px' }}
                        />
                        <div style={{ flex: 1 }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                            <h6 style={{ margin: 0, fontWeight: 600 }}>{item.name}</h6>
                            <Button 
                              variant="link" 
                              onClick={() => removeFromWishlist(item.id || item.product_id)}
                              disabled={wishlistLoading[item.id || item.product_id]}
                              style={{ padding: 0, color: '#6b7280' }}
                            >
                              <FaTimes />
                            </Button>
                          </div>
                          <p className="text-muted" style={{ fontSize: '0.9rem', margin: '0.25rem 0' }}>
                            {item.category}
                          </p>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <strong style={{ color: '#4f46e5' }}>₹{item.price}</strong>
                            <div style={{ display: 'flex', gap: '0.5rem' }}>
                              <Button 
                                size="sm" 
                                variant="outline-primary"
                                onClick={() => moveWishlistToCart(item)}
                              >
                                Add to Cart
                              </Button>
                            </div>
                          </div>
                        </div>
                      </div>
                    </Card.Body>
                  </Card>
                </Col>
              ))}
            </Row>
          )}
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowWishlistModal(false)}>
            Close
          </Button>
          {wishlist.length > 0 && (
            <Button 
              variant="primary"
              onClick={() => {
                // Add all wishlist items to cart
                wishlist.forEach(item => {
                  addToCart(item.id || item.product_id, 1);
                });
                setShowWishlistModal(false);
              }}
            >
              Add All to Cart
            </Button>
          )}
        </Modal.Footer>
      </Modal>

      {/* Hero Section */}
      <section style={{
        padding: '4rem 0',
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        color: 'white',
        position: 'relative',
        overflow: 'hidden'
      }}>
        <Container>
          <Row className="align-items-center">
            <Col lg={6}>
              <div style={{ position: 'relative', zIndex: 1 }}>
                <h1 style={{
                  fontSize: '3rem',
                  fontWeight: 800,
                  marginBottom: '1.5rem',
                  lineHeight: 1.2
                }}>
                  Welcome back, {user.name}! 👋
                </h1>
                <p style={{
                  fontSize: '1.25rem',
                  marginBottom: '2rem',
                  opacity: 0.95,
                  maxWidth: '500px'
                }}>
                  Discover premium stationery, books, and electronics for all your needs. 
                  Quality products at unbeatable prices.
                </p>
                
                {/* Stats */}
                <div style={{
                  display: 'flex',
                  gap: '3rem',
                  marginBottom: '2rem'
                }}>
                  <div>
                    <div style={{
                      fontSize: '2.5rem',
                      fontWeight: 800,
                      lineHeight: 1
                    }}>
                      {allProducts.length}+
                    </div>
                    <div style={{
                      fontSize: '0.9rem',
                      opacity: 0.9,
                      fontWeight: 500
                    }}>
                      Products
                    </div>
                  </div>
                  <div>
                    <div style={{
                      fontSize: '2.5rem',
                      fontWeight: 800,
                      lineHeight: 1
                    }}>
                      {orders.length}
                    </div>
                    <div style={{
                      fontSize: '0.9rem',
                      opacity: 0.9,
                      fontWeight: 500
                    }}>
                      Orders
                    </div>
                  </div>
                  <div>
                    <div style={{
                      fontSize: '2.5rem',
                      fontWeight: 800,
                      lineHeight: 1
                    }}>
                      {getCartItemCount()}
                    </div>
                    <div style={{
                      fontSize: '0.9rem',
                      opacity: 0.9,
                      fontWeight: 500
                    }}>
                      Cart Items
                    </div>
                  </div>
                  <div>
                    <div style={{
                      fontSize: '2.5rem',
                      fontWeight: 800,
                      lineHeight: 1
                    }}>
                      {wishlist.length}
                    </div>
                    <div style={{
                      fontSize: '0.9rem',
                      opacity: 0.9,
                      fontWeight: 500
                    }}>
                      Wishlist
                    </div>
                  </div>
                </div>
                
                {/* Action Buttons */}
                <div style={{
                  display: 'flex',
                  gap: '1rem',
                  flexWrap: 'wrap'
                }}>
                  <Button 
                    variant="primary" 
                    size="lg"
                    onClick={() => navigate("/products")}
                    style={{
                      padding: '0.875rem 2rem',
                      borderRadius: '50px',
                      fontWeight: 600,
                      background: 'white',
                      color: '#4f46e5',
                      border: '2px solid white'
                    }}
                  >
                    Shop Now
                  </Button>
                  <Button 
                    variant="outline-light" 
                    size="lg"
                    onClick={() => navigate("/cart")}
                    style={{
                      padding: '0.875rem 2rem',
                      borderRadius: '50px',
                      fontWeight: 600,
                      border: '2px solid white'
                    }}
                  >
                    View Cart
                  </Button>
                  {wishlist.length > 0 && (
                    <Button 
                      variant="outline-light" 
                      size="lg"
                      onClick={() => setShowWishlistModal(true)}
                      style={{
                        padding: '0.875rem 2rem',
                        borderRadius: '50px',
                        fontWeight: 600,
                        border: '2px solid white'
                      }}
                    >
                      View Wishlist
                    </Button>
                  )}
                </div>
              </div>
            </Col>
            <Col lg={6}>
              <div style={{ position: 'relative', zIndex: 1 }}>
                <img 
                  src="https://images.unsplash.com/photo-1524995997946-a1c2e315a42f?w=800" 
                  alt="Stationery" 
                  style={{
                    width: '100%',
                    borderRadius: '1rem',
                    boxShadow: '0 25px 50px rgba(0, 0, 0, 0.3)',
                    border: '8px solid rgba(255, 255, 255, 0.2)'
                  }}
                />
              </div>
            </Col>
          </Row>
        </Container>
      </section>

      {/* Features Section */}
      <section style={{ padding: '4rem 0', background: 'white' }}>
        <Container>
          <Row className="g-4">
            {[
              { icon: FaTruck, title: 'Free Delivery', text: 'On orders over ₹500' },
              { icon: FaShieldAlt, title: 'Secure Payment', text: '100% secure transactions' },
              { icon: FaBox, title: 'Easy Returns', text: '7-day return policy' },
              { icon: FaHeadset, title: '24/7 Support', text: 'Dedicated customer care' }
            ].map((feature, idx) => (
              <Col md={3} sm={6} key={idx}>
                <Card style={{
                  border: 'none',
                  borderRadius: '16px',
                  padding: '1rem',
                  background: '#f9fafb',
                  boxShadow: '0 1px 2px 0 rgb(0 0 0 / 0.05)',
                  height: '100%',
                  transition: 'transform 0.3s ease'
                }}>
                  <Card.Body className="text-center">
                    <div style={{
                      fontSize: '3rem',
                      color: '#4f46e5',
                      marginBottom: '1rem'
                    }}>
                      <feature.icon />
                    </div>
                    <h5 style={{ fontWeight: 700, marginBottom: '0.5rem' }}>
                      {feature.title}
                    </h5>
                    <p style={{ color: '#6b7280', margin: 0, fontSize: '0.9rem' }}>
                      {feature.text}
                    </p>
                  </Card.Body>
                </Card>
              </Col>
            ))}
          </Row>
        </Container>
      </section>

      {/* Categories Section */}
      <section style={{
        padding: '3rem 0',
        background: 'linear-gradient(to bottom, white, #f9fafb)'
      }}>
        <Container>
          <h2 style={{
            fontSize: '2rem',
            fontWeight: 800,
            color: '#1f2937',
            marginBottom: '2rem',
            textAlign: 'center'
          }}>
            Shop by Category
          </h2>
          <div style={{
            display: 'flex',
            gap: '1rem',
            flexWrap: 'wrap',
            justifyContent: 'center'
          }}>
            {categories.map(cat => (
              <Button
                key={cat.id}
                onClick={() => handleCategoryChange(cat.id)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.75rem',
                  padding: '0.75rem 1.5rem',
                  borderRadius: '50px',
                  border: '2px solid #e5e7eb',
                  background: selectedCategory === cat.id ? '#4f46e5' : 'white',
                  color: selectedCategory === cat.id ? 'white' : '#1f2937',
                  fontWeight: 600,
                  boxShadow: selectedCategory === cat.id ? '0 0 0 4px #eef2ff' : '0 1px 2px 0 rgb(0 0 0 / 0.05)',
                  transition: 'all 0.3s ease'
                }}
              >
                <span style={{ fontSize: '1.5rem' }}>{cat.icon}</span>
                <span>{cat.name}</span>
              </Button>
            ))}
          </div>
        </Container>
      </section>

      {/* Products Section */}
      <section style={{
        padding: '4rem 0',
        background: '#f9fafb',
        minHeight: '60vh'
      }}>
        <Container>
          <div style={{ marginBottom: '3rem' }}>
            <h2 style={{
              fontSize: '2rem',
              fontWeight: 800,
              color: '#1f2937',
              marginBottom: '0.5rem',
              textAlign: 'center'
            }}>
              {searchQuery ? `Search Results for "${searchQuery}"` : 
               selectedCategory === "all" ? "All Products" : 
               categories.find(c => c.id === selectedCategory)?.name}
            </h2>
            <p style={{
              textAlign: 'center',
              color: '#6b7280',
              marginBottom: '1.5rem'
            }}>
              {products.length} products found
            </p>
          </div>

          {products.length === 0 ? (
            <Card style={{
              border: 'none',
              borderRadius: '16px',
              background: 'white',
              boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)'
            }}>
              <Card.Body className="text-center py-5">
                <div style={{ fontSize: '5rem', marginBottom: '1rem' }}>🔍</div>
                <h4 style={{ color: '#1f2937', fontWeight: 700, marginBottom: '0.5rem' }}>
                  No products found
                </h4>
                <p style={{ color: '#6b7280' }}>
                  Try adjusting your search or browse all categories
                </p>
                <Button 
                  variant="primary" 
                  onClick={() => handleSearch("")}
                  style={{ marginTop: '1rem' }}
                >
                  View All Products
                </Button>
              </Card.Body>
            </Card>
          ) : (
            <Row xs={1} sm={2} md={3} lg={4} xl={5} className="g-4">
              {products.map(product => (
                <Col key={product.id}>
                  <Card style={{
                    border: 'none',
                    borderRadius: '16px',
                    overflow: 'hidden',
                    background: 'white',
                    boxShadow: '0 1px 2px 0 rgb(0 0 0 / 0.05)',
                    height: '100%',
                    display: 'flex',
                    flexDirection: 'column',
                    transition: 'all 0.3s ease',
                    position: 'relative'
                  }}>
                    {/* Wishlist Heart Button */}
                    <Button
                      variant="link"
                      onClick={() => toggleWishlist(product)}
                      disabled={wishlistLoading[product.id]}
                      style={{
                        position: 'absolute',
                        top: '10px',
                        left: '10px',
                        zIndex: 2,
                        padding: '0.5rem',
                        borderRadius: '50%',
                        background: 'rgba(255, 255, 255, 0.9)',
                        boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
                      }}
                    >
                      <FaHeart style={{
                        color: isInWishlist(product.id) ? '#ef4444' : '#9ca3af',
                        fontSize: '1.25rem'
                      }} />
                    </Button>
                    
                    {/* Product Image */}
                    <div style={{
                      position: 'relative',
                      width: '100%',
                      height: '200px',
                      overflow: 'hidden',
                      background: '#f9fafb'
                    }}>
                      {product.image_url ? (
                        <img 
                          src={product.image_url} 
                          alt={product.name}
                          style={{
                            width: '100%',
                            height: '100%',
                            objectFit: 'cover'
                          }}
                          onError={(e) => {
                            e.target.src = "https://via.placeholder.com/300x300?text=No+Image";
                          }}
                        />
                      ) : (
                        <div style={{
                          width: '100%',
                          height: '100%',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          background: 'linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%)',
                          color: '#6b7280',
                          fontWeight: 600
                        }}>
                          No Image
                        </div>
                      )}
                      {product.stock_quantity < 10 && product.stock_quantity > 0 && (
                        <Badge 
                          bg="warning"
                          style={{
                            position: 'absolute',
                            top: '0.75rem',
                            right: '0.75rem',
                            padding: '0.375rem 0.75rem',
                            fontSize: '0.75rem',
                            fontWeight: 700,
                            borderRadius: '50px'
                          }}
                        >
                          Only {product.stock_quantity} left
                        </Badge>
                      )}
                      {product.stock_quantity === 0 && (
                        <Badge 
                          bg="danger"
                          style={{
                            position: 'absolute',
                            top: '0.75rem',
                            right: '0.75rem',
                            padding: '0.375rem 0.75rem',
                            fontSize: '0.75rem',
                            fontWeight: 700,
                            borderRadius: '50px'
                          }}
                        >
                          Out of Stock
                        </Badge>
                      )}
                    </div>
                    
                    {/* Product Info */}
                    <Card.Body style={{
                      padding: '1.25rem',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '0.75rem',
                      flex: 1
                    }}>
                      <Badge 
                        bg="light" 
                        text="dark"
                        style={{
                          fontSize: '0.7rem',
                          fontWeight: 600,
                          padding: '0.25rem 0.75rem',
                          textTransform: 'uppercase',
                          letterSpacing: '0.5px',
                          width: 'fit-content',
                          borderRadius: '50px'
                        }}
                      >
                        {product.category}
                      </Badge>
                      
                      <Card.Title style={{
                        fontSize: '1rem',
                        fontWeight: 700,
                        color: '#1f2937',
                        margin: 0,
                        minHeight: '2.5rem',
                        display: '-webkit-box',
                        WebkitLineClamp: 2,
                        WebkitBoxOrient: 'vertical',
                        overflow: 'hidden'
                      }}>
                        {product.name}
                      </Card.Title>
                      
                      {product.description && (
                        <Card.Text style={{
                          fontSize: '0.85rem',
                          color: '#6b7280',
                          margin: 0
                        }}>
                          {product.description.substring(0, 60)}...
                        </Card.Text>
                      )}
                      
                      {/* Rating */}
                      <div style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.25rem'
                      }}>
                        <FaStar style={{ color: '#fbbf24', fontSize: '0.875rem' }} />
                        <FaStar style={{ color: '#fbbf24', fontSize: '0.875rem' }} />
                        <FaStar style={{ color: '#fbbf24', fontSize: '0.875rem' }} />
                        <FaStar style={{ color: '#fbbf24', fontSize: '0.875rem' }} />
                        <FaStar style={{ color: '#d1d5db', fontSize: '0.875rem' }} />
                        <span style={{
                          fontSize: '0.8rem',
                          color: '#6b7280',
                          marginLeft: '0.5rem'
                        }}>
                          (4.0)
                        </span>
                      </div>
                      
                      {/* Price */}
                      <div style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.75rem'
                      }}>
                        <span style={{
                          fontSize: '1.5rem',
                          fontWeight: 800,
                          color: '#4f46e5'
                        }}>
                          ₹{product.price}
                        </span>
                      </div>
                      
                      {/* Add to Cart */}
                      {product.stock_quantity > 0 ? (
                        <div style={{
                          display: 'flex',
                          gap: '0.5rem',
                          marginTop: 'auto'
                        }}>
                          <Form.Control
                            type="number"
                            min="1"
                            max={product.stock_quantity}
                            value={quantities[product.id] || 1}
                            onChange={(e) => handleQuantityChange(product.id, e.target.value)}
                            style={{
                              width: '70px',
                              textAlign: 'center',
                              fontWeight: 600,
                              borderRadius: '8px',
                              border: '2px solid #e5e7eb'
                            }}
                          />
                          <Button
                            variant="primary"
                            onClick={() => addToCart(product.id, quantities[product.id] || 1)}
                            style={{
                              flex: 1,
                              borderRadius: '8px',
                              fontWeight: 600,
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              gap: '0.5rem',
                              padding: '0.625rem 1rem',
                              background: '#4f46e5',
                              border: 'none'
                            }}
                          >
                            <FaShoppingCart /> Add
                          </Button>
                        </div>
                      ) : (
                        <Button 
                          variant="secondary" 
                          disabled 
                          className="w-100"
                          style={{ marginTop: 'auto' }}
                        >
                          Out of Stock
                        </Button>
                      )}
                    </Card.Body>
                  </Card>
                </Col>
              ))}
            </Row>
          )}
        </Container>
      </section>

      {/* Footer */}
      <footer style={{
        background: 'linear-gradient(135deg, #1f2937 0%, #111827 100%)',
        color: 'white',
        padding: '4rem 0 2rem',
        marginTop: '4rem'
      }}>
        <Container>
          <Row className="g-4">
            <Col lg={4} md={6}>
              <h4 style={{
                fontSize: '1.75rem',
                fontWeight: 800,
                marginBottom: '1rem',
                background: 'linear-gradient(135deg, #60a5fa 0%, #a78bfa 100%)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent'
              }}>
                Smart Stationery
              </h4>
              <p style={{
                color: '#9ca3af',
                lineHeight: 1.7,
                marginBottom: '1.5rem'
              }}>
                Your trusted partner for quality stationery, books, and educational supplies. 
                We provide the best products to support your learning and creativity.
              </p>
              <div style={{ display: 'flex', gap: '0.5rem' }}>
                {['Facebook', 'Twitter', 'Instagram', 'LinkedIn'].map(social => (
                  <Button 
                    key={social}
                    variant="link"
                    style={{
                      color: '#9ca3af',
                      textDecoration: 'none',
                      padding: '0.5rem 1rem',
                      borderRadius: '8px',
                      fontSize: '0.9rem'
                    }}
                  >
                    {social}
                  </Button>
                ))}
              </div>
            </Col>
            
            <Col lg={2} md={6}>
              <h5 style={{
                fontSize: '1.1rem',
                fontWeight: 700,
                marginBottom: '1.5rem'
              }}>
                Quick Links
              </h5>
              <ul style={{ listStyle: 'none', padding: 0 }}>
                {[
                  { label: 'Products', path: '/products' },
                  { label: 'Cart', path: '/cart' },
                  { label: 'My Orders', path: '/my-orders' },
                  { label: 'Profile', path: '/profile' },
                  { label: 'Wishlist', path: '#', onClick: () => setShowWishlistModal(true) }
                ].map((link, index) => (
                  <li key={index} style={{ marginBottom: '0.75rem' }}>
                    <Button 
                      variant="link"
                      onClick={link.onClick || (() => navigate(link.path))}
                      style={{
                        color: '#9ca3af',
                        textDecoration: 'none',
                        padding: 0,
                        fontSize: '0.95rem'
                      }}
                    >
                      {link.label}
                    </Button>
                  </li>
                ))}
              </ul>
            </Col>
            
            <Col lg={2} md={6}>
              <h5 style={{
                fontSize: '1.1rem',
                fontWeight: 700,
                marginBottom: '1.5rem'
              }}>
                Categories
              </h5>
              <ul style={{ listStyle: 'none', padding: 0 }}>
                {categories.filter(cat => cat.id !== "all").map(cat => (
                  <li key={cat.id} style={{ marginBottom: '0.75rem' }}>
                    <Button 
                      variant="link"
                      onClick={() => handleCategoryChange(cat.id)}
                      style={{
                        color: '#9ca3af',
                        textDecoration: 'none',
                        padding: 0,
                        fontSize: '0.95rem',
                        textTransform: 'capitalize'
                      }}
                    >
                      {cat.name}
                    </Button>
                  </li>
                ))}
              </ul>
            </Col>
            
            <Col lg={4} md={6}>
              <h5 style={{
                fontSize: '1.1rem',
                fontWeight: 700,
                marginBottom: '1.5rem'
              }}>
                Newsletter
              </h5>
              <p style={{
                color: '#9ca3af',
                fontSize: '0.9rem',
                marginBottom: '1rem'
              }}>
                Subscribe to get special offers and updates
              </p>
              <InputGroup style={{
                borderRadius: '8px',
                overflow: 'hidden',
                marginBottom: '1rem'
              }}>
                <Form.Control
                  placeholder="Enter your email"
                  type="email"
                  style={{
                    background: 'rgba(255, 255, 255, 0.1)',
                    border: '1px solid rgba(255, 255, 255, 0.2)',
                    color: 'white',
                    padding: '0.75rem 1rem'
                  }}
                />
                <Button variant="primary" style={{ padding: '0.75rem 1.5rem', fontWeight: 600 }}>
                  Subscribe
                </Button>
              </InputGroup>
              <div>
                <p style={{ color: '#9ca3af', fontSize: '0.9rem', marginBottom: '0.5rem' }}>
                  <strong style={{ color: 'white' }}>Email:</strong> support@smartstationery.com
                </p>
                <p style={{ color: '#9ca3af', fontSize: '0.9rem', marginBottom: '0.5rem' }}>
                  <strong style={{ color: 'white' }}>Phone:</strong> +91 1234567890
                </p>
              </div>
            </Col>
          </Row>
          
          <hr style={{
            borderColor: 'rgba(255, 255, 255, 0.1)',
            margin: '2rem 0'
          }} />
          
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            flexWrap: 'wrap',
            gap: '1rem'
          }}>
            <p style={{
              color: '#9ca3af',
              margin: 0,
              fontSize: '0.9rem'
            }}>
              © 2024 Smart Stationery Management System. All rights reserved.
            </p>
            <div style={{ display: 'flex', gap: '1rem' }}>
              {['Privacy Policy', 'Terms of Service', 'Cookie Policy'].map(policy => (
                <Button 
                  key={policy}
                  variant="link"
                  style={{
                    color: '#9ca3af',
                    textDecoration: 'none',
                    padding: 0,
                    fontSize: '0.9rem'
                  }}
                >
                  {policy}
                </Button>
              ))}
            </div>
          </div>
        </Container>
      </footer>
    </div>
  );
};

export default Dashboard;