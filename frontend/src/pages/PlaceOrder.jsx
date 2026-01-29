import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

const PlaceOrder = () => {
  const [products, setProducts] = useState([]);
  const [cart, setCart] = useState([]);
  const [shippingAddress, setShippingAddress] = useState({
    address: '',
    city: '',
    state: '',
    zipCode: '',
    country: 'India'
  });
  const [paymentMethod, setPaymentMethod] = useState('COD');
  const [loading, setLoading] = useState(false);

  const navigate = useNavigate();

  useEffect(() => {
    fetchProducts();
    const savedCart = JSON.parse(localStorage.getItem('cart')) || [];
    setCart(savedCart);
  }, []);

  const fetchProducts = async () => {
    try {
      const res = await axios.get('http://localhost:5000/api/products');
      setProducts(res.data);
    } catch (error) {
      console.error('Error fetching products:', error);
    }
  };

  const addToCart = (product) => {
    const existingItem = cart.find(item => item.productId === product.id);
    if (existingItem) {
      setCart(cart.map(item =>
        item.productId === product.id
          ? { ...item, quantity: item.quantity + 1 }
          : item
      ));
    } else {
      setCart([...cart, {
        productId: product.id,
        name: product.name,
        price: product.price,
        quantity: 1,
        image: product.image
      }]);
    }
  };

  const removeFromCart = (productId) => {
    setCart(cart.filter(item => item.productId !== productId));
  };

  const updateQuantity = (productId, quantity) => {
    if (quantity < 1) {
      removeFromCart(productId);
      return;
    }
    setCart(cart.map(item =>
      item.productId === productId
        ? { ...item, quantity }
        : item
    ));
  };

  const calculateTotal = () => {
    return cart.reduce((total, item) => total + (item.price * item.quantity), 0);
  };

  const handlePlaceOrder = async () => {
    if (cart.length === 0) {
      alert('Your cart is empty!');
      return;
    }
    if (!shippingAddress.address || !shippingAddress.city || !shippingAddress.zipCode) {
      alert('Please fill in all shipping details');
      return;
    }
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const orderData = {
        products: cart.map(item => ({ productId: item.productId, quantity: item.quantity })),
        shippingAddress,
        paymentMethod,
        notes: ''
      };
      await axios.post('http://localhost:5000/api/orders', orderData, {
        headers: { Authorization: `Bearer ${token}` }
      });
      localStorage.removeItem('cart');
      alert('Order placed successfully!');
      navigate('/my-orders');
    } catch (error) {
      alert('Error placing order: ' + (error.response?.data?.message || error.message));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container my-5">
      <h1 className="mb-4">Place Order</h1>

      <div className="row">
        {/* Products Section */}
        <div className="col-lg-7 mb-4">
          <h2 className="h5 mb-3">Available Products</h2>
          <div className="row row-cols-1 row-cols-md-2 g-3">
            {products.map(product => (
              <div key={product.id} className="col">
                <div className="card h-100 shadow-sm">
                  {product.image && <img src={product.image} className="card-img-top" alt={product.name} />}
                  <div className="card-body d-flex flex-column">
                    <h5 className="card-title">{product.name}</h5>
                    <p className="card-text mb-1">{product.category}</p>
                    <p className="card-text mb-1">₹{product.price}</p>
                    <p className="card-text mb-2">Stock: {product.stock}</p>
                    <button
                      className="btn btn-primary mt-auto"
                      onClick={() => addToCart(product)}
                      disabled={product.stock === 0}
                    >
                      {product.stock === 0 ? 'Out of Stock' : 'Add to Cart'}
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Cart & Checkout Section */}
        <div className="col-lg-5">
          {/* Cart */}
          <div className="card mb-4 shadow-sm">
            <div className="card-body">
              <h2 className="h5">Your Cart ({cart.length})</h2>
              {cart.length === 0 ? (
                <p className="text-muted">Your cart is empty</p>
              ) : (
                <>
                  {cart.map(item => (
                    <div key={item.productId} className="d-flex justify-content-between align-items-center border-bottom py-2">
                      <div>
                        <h6 className="mb-1">{item.name}</h6>
                        <small>₹{item.price} × {item.quantity}</small>
                      </div>
                      <div className="d-flex align-items-center gap-1">
                        <button className="btn btn-sm btn-outline-secondary" onClick={() => updateQuantity(item.productId, item.quantity - 1)}>-</button>
                        <span>{item.quantity}</span>
                        <button className="btn btn-sm btn-outline-secondary" onClick={() => updateQuantity(item.productId, item.quantity + 1)}>+</button>
                        <button className="btn btn-sm btn-danger" onClick={() => removeFromCart(item.productId)}>Remove</button>
                      </div>
                    </div>
                  ))}
                  <div className="mt-3 text-end">
                    <h5>Total: ₹{calculateTotal()}</h5>
                  </div>
                </>
              )}
            </div>
          </div>

          {/* Shipping & Payment */}
          <div className="card shadow-sm">
            <div className="card-body">
              <h2 className="h5 mb-3">Shipping Address</h2>
              <div className="mb-3">
                <input
                  type="text"
                  className="form-control mb-2"
                  placeholder="Full Address"
                  value={shippingAddress.address}
                  onChange={e => setShippingAddress({ ...shippingAddress, address: e.target.value })}
                  required
                />
                <div className="row g-2">
                  <div className="col-6">
                    <input
                      type="text"
                      className="form-control"
                      placeholder="City"
                      value={shippingAddress.city}
                      onChange={e => setShippingAddress({ ...shippingAddress, city: e.target.value })}
                      required
                    />
                  </div>
                  <div className="col-6">
                    <input
                      type="text"
                      className="form-control"
                      placeholder="State"
                      value={shippingAddress.state}
                      onChange={e => setShippingAddress({ ...shippingAddress, state: e.target.value })}
                      required
                    />
                  </div>
                </div>
                <div className="row g-2 mt-2">
                  <div className="col-6">
                    <input
                      type="text"
                      className="form-control"
                      placeholder="ZIP Code"
                      value={shippingAddress.zipCode}
                      onChange={e => setShippingAddress({ ...shippingAddress, zipCode: e.target.value })}
                      required
                    />
                  </div>
                  <div className="col-6">
                    <input
                      type="text"
                      className="form-control"
                      placeholder="Country"
                      value={shippingAddress.country}
                      onChange={e => setShippingAddress({ ...shippingAddress, country: e.target.value })}
                    />
                  </div>
                </div>
              </div>

              <h2 className="h5 mb-2">Payment Method</h2>
              <div className="mb-3">
                <div className="form-check">
                  <input
                    type="radio"
                    id="cod"
                    name="payment"
                    value="COD"
                    className="form-check-input"
                    checked={paymentMethod === 'COD'}
                    onChange={e => setPaymentMethod(e.target.value)}
                  />
                  <label className="form-check-label" htmlFor="cod">Cash on Delivery</label>
                </div>
                <div className="form-check">
                  <input
                    type="radio"
                    id="online"
                    name="payment"
                    value="Online"
                    className="form-check-input"
                    checked={paymentMethod === 'Online'}
                    onChange={e => setPaymentMethod(e.target.value)}
                  />
                  <label className="form-check-label" htmlFor="online">Online Payment</label>
                </div>
              </div>

              <button
                className="btn btn-success w-100"
                onClick={handlePlaceOrder}
                disabled={loading || cart.length === 0}
              >
                {loading ? 'Processing...' : 'Place Order'}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PlaceOrder;
