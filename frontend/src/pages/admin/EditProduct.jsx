// frontend/src/pages/admin/EditProduct.jsx - FIXED VERSION
import React, { useState, useEffect } from 'react';
import { 
  Form, Button, Container, Row, Col, Card, Alert, Spinner,
  Badge, FloatingLabel
} from 'react-bootstrap';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { FaArrowLeft, FaSave, FaTrash, FaImage, FaExclamationTriangle, FaEye, FaEyeSlash } from 'react-icons/fa';

const EditProduct = () => {
  const { id } = useParams(); // Using 'id' to match your App.jsx route
  const navigate = useNavigate();
  
  const [formData, setFormData] = useState({
    name: '',
    category: 'book',
    price: '',
    description: '',
    author: '',
    genre: '',
    stock_quantity: '',
    image_url: ''
  });

  const [categories] = useState([
    { value: "book", label: "Book" },
    { value: "stationery", label: "Stationery" }
  ]);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [imagePreview, setImagePreview] = useState('');
  const [showImagePreview, setShowImagePreview] = useState(true);
  const [product, setProduct] = useState(null);

  // Fetch product data
  useEffect(() => {
    const fetchProduct = async () => {
      try {
        setLoading(true);
        setError('');
        
        console.log("Fetching product with ID:", id);
        
        if (!id) {
          setError('No product ID provided');
          setLoading(false);
          return;
        }
        
        // Fetch product data
        const response = await axios.get(`http://localhost:5000/api/products/${id}`);
        
        console.log("API Response:", response.data);
        
        // Handle different response formats
        let productData = response.data.product || response.data;
        
        if (!productData) {
          throw new Error('Product not found in response');
        }
        
        setProduct(productData);
        
        // Map the data correctly
        const data = {
          name: productData.name || '',
          category: productData.category || 'book',
          price: productData.price || '',
          description: productData.description || '',
          author: productData.author || '',
          genre: productData.genre || '',
          stock_quantity: productData.stock_quantity || productData.stock || '',
          image_url: productData.image_url || productData.image || ''
        };
        
        console.log("Form Data after mapping:", data);
        
        setFormData(data);
        if (data.image_url) {
          setImagePreview(data.image_url);
        }
        
        setLoading(false);
      } catch (err) {
        console.error('Error fetching product:', err);
        setError(`Failed to load product: ${err.response?.data?.message || err.message || 'Unknown error'}`);
        setLoading(false);
      }
    };

    fetchProduct();
  }, [id]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    
    if (name === 'image_url') {
      setImagePreview(value);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError('');
    setSuccess('');

    try {
      // Validation
      const errors = [];
      if (!formData.name.trim()) errors.push('Product name is required');
      if (!formData.category.trim()) errors.push('Category is required');
      if (!formData.price || isNaN(formData.price) || parseFloat(formData.price) <= 0) {
        errors.push('Valid price is required');
      }
      if (!formData.stock_quantity || isNaN(formData.stock_quantity) || parseInt(formData.stock_quantity) < 0) {
        errors.push('Valid stock quantity is required');
      }
      
      // Book-specific validation
      if (formData.category === 'book' && !formData.author.trim()) {
        errors.push('Author is required for books');
      }
      
      if (errors.length > 0) {
        throw new Error(errors.join(', '));
      }

      const productData = {
        name: formData.name.trim(),
        category: formData.category,
        price: parseFloat(formData.price),
        stock_quantity: parseInt(formData.stock_quantity),
        description: formData.description || '',
        author: formData.author || '',
        genre: formData.genre || '',
        image_url: formData.image_url || ''
      };

      console.log("Sending update data:", productData);
      
      const token = localStorage.getItem('token');
      const response = await axios.put(
        `http://localhost:5000/api/products/${id}`, 
        productData, 
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      console.log("Update response:", response.data);
      
      setSuccess('Product updated successfully!');
      setProduct(response.data.product || productData);
      
    } catch (err) {
      console.error('Error updating product:', err);
      setError(err.response?.data?.message || err.message || 'Failed to update product');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!window.confirm('Are you sure you want to delete this product? This action cannot be undone.')) {
      return;
    }

    try {
      const token = localStorage.getItem('token');
      await axios.delete(`http://localhost:5000/api/products/${id}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      
      setSuccess('Product deleted successfully!');
      setTimeout(() => {
        navigate('/admin-dashboard');
      }, 1500);
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Failed to delete product');
    }
  };

  if (loading) {
    return (
      <Container className="d-flex flex-column justify-content-center align-items-center" style={{ minHeight: '80vh' }}>
        <Spinner animation="border" variant="primary" size="lg" />
        <span className="mt-3 fs-5">Loading product data...</span>
        <small className="text-muted mt-2">Product ID: {id || 'Not found'}</small>
      </Container>
    );
  }

  if (error && !product) {
    return (
      <Container className="py-5">
        <Alert variant="danger">
          <h4>Error Loading Product</h4>
          <p>{error}</p>
          <p className="text-muted">Product ID: {id || 'Not found'}</p>
          <Button variant="outline-danger" onClick={() => navigate('/admin-dashboard')}>
            <FaArrowLeft className="me-2" />
            Back to Dashboard
          </Button>
        </Alert>
      </Container>
    );
  }

  const isOutOfStock = parseInt(formData.stock_quantity) === 0;
  const isLowStock = parseInt(formData.stock_quantity) > 0 && parseInt(formData.stock_quantity) < 10;

  return (
    <Container className="py-4">
      {/* Header with Back Button */}
      <div className="d-flex align-items-center mb-4">
        <Button variant="outline-secondary" onClick={() => navigate('/admin-dashboard')} className="me-3">
          <FaArrowLeft className="me-2" />
          Back to Dashboard
        </Button>
        <h2 className="mb-0">Edit Product</h2>
      </div>
      
      {/* Product ID Card */}
      <Card className="shadow-sm border-0 mb-4">
        <Card.Header className="bg-white border-bottom py-3">
          <div className="d-flex justify-content-between align-items-center">
            <h5 className="mb-0 text-primary">Product ID: {id}</h5>
            <div>
              {isOutOfStock && (
                <Badge bg="danger" className="fs-6 px-3 py-2">
                  <FaExclamationTriangle className="me-2" />
                  OUT OF STOCK
                </Badge>
              )}
              {isLowStock && !isOutOfStock && (
                <Badge bg="warning" className="fs-6 px-3 py-2">
                  LOW STOCK
                </Badge>
              )}
            </div>
          </div>
        </Card.Header>
      </Card>
      
      {/* Alerts */}
      {error && <Alert variant="danger" dismissible onClose={() => setError('')}>{error}</Alert>}
      {success && <Alert variant="success" dismissible onClose={() => setSuccess('')}>{success}</Alert>}
      
      {/* Main Form Card */}
      <Card className="shadow-sm border-0">
        <Card.Body className="p-4">
          <Form onSubmit={handleSubmit}>
            <Row className="g-4">
              {/* Left Column - Main Info */}
              <Col lg={8}>
                <Card className="mb-4 border">
                  <Card.Body>
                    <h6 className="mb-3 border-bottom pb-2">Basic Information</h6>
                    
                    {/* Product Name */}
                    <Form.Group className="mb-3">
                      <FloatingLabel label="Product Name *" className="mb-3">
                        <Form.Control
                          type="text"
                          name="name"
                          value={formData.name}
                          onChange={handleChange}
                          required
                          placeholder=" "
                          className="form-control-lg"
                        />
                      </FloatingLabel>
                    </Form.Group>
                    
                    {/* Category, Price, and Stock */}
                    <Row className="g-3 mb-3">
                      <Col md={6}>
                        <Form.Group>
                          <FloatingLabel label="Category *">
                            <Form.Select
                              name="category"
                              value={formData.category}
                              onChange={handleChange}
                              required
                              style={{ height: '58px', paddingTop: '1.625rem' }}
                            >
                              {categories.map((cat, index) => (
                                <option key={index} value={cat.value}>
                                  {cat.label}
                                </option>
                              ))}
                            </Form.Select>
                          </FloatingLabel>
                          <Form.Text className="text-muted">
                            {formData.category === "book" 
                              ? "Books require author information"
                              : "Stationery items"
                            }
                          </Form.Text>
                        </Form.Group>
                      </Col>
                      
                      <Col md={3}>
                        <Form.Group>
                          <FloatingLabel label="Price (₹) *">
                            <Form.Control
                              type="number"
                              name="price"
                              value={formData.price}
                              onChange={handleChange}
                              required
                              min="0"
                              step="0.01"
                              placeholder=" "
                              className="form-control-lg"
                            />
                          </FloatingLabel>
                        </Form.Group>
                      </Col>
                      
                      <Col md={3}>
                        <Form.Group>
                          <FloatingLabel label="Stock Quantity *">
                            <Form.Control
                              type="number"
                              name="stock_quantity"
                              value={formData.stock_quantity}
                              onChange={handleChange}
                              required
                              min="0"
                              placeholder=" "
                              className="form-control-lg"
                            />
                          </FloatingLabel>
                        </Form.Group>
                      </Col>
                    </Row>
                    
                    {/* Author and Genre for Books */}
                    {formData.category === "book" && (
                      <Row className="g-3 mb-3">
                        <Col md={6}>
                          <Form.Group>
                            <FloatingLabel label="Author *">
                              <Form.Control
                                type="text"
                                name="author"
                                value={formData.author}
                                onChange={handleChange}
                                required={formData.category === "book"}
                                placeholder=" "
                              />
                            </FloatingLabel>
                          </Form.Group>
                        </Col>
                        <Col md={6}>
                          <Form.Group>
                            <FloatingLabel label="Genre">
                              <Form.Control
                                type="text"
                                name="genre"
                                value={formData.genre}
                                onChange={handleChange}
                                placeholder=" "
                              />
                            </FloatingLabel>
                          </Form.Group>
                        </Col>
                      </Row>
                    )}
                    
                    {/* Description */}
                    <Form.Group>
                      <FloatingLabel label="Description" className="mb-3">
                        <Form.Control
                          as="textarea"
                          rows={4}
                          name="description"
                          value={formData.description}
                          onChange={handleChange}
                          placeholder=" "
                          style={{ height: '120px' }}
                        />
                      </FloatingLabel>
                    </Form.Group>
                  </Card.Body>
                </Card>
              </Col>
              
              {/* Right Column - Image */}
              <Col lg={4}>
                <Card className="border">
                  <Card.Body>
                    <div className="d-flex justify-content-between align-items-center mb-3">
                      <h6 className="mb-0"><FaImage className="me-2" />Product Image</h6>
                      <Button 
                        variant="outline-secondary" 
                        size="sm"
                        onClick={() => setShowImagePreview(!showImagePreview)}
                      >
                        {showImagePreview ? <FaEyeSlash /> : <FaEye />}
                      </Button>
                    </div>
                    
                    {/* Image URL */}
                    <Form.Group className="mb-3">
                      <FloatingLabel label="Image URL">
                        <Form.Control
                          type="text"
                          name="image_url"
                          value={formData.image_url}
                          onChange={handleChange}
                          placeholder=" "
                        />
                      </FloatingLabel>
                    </Form.Group>
                    
                    {/* Image Preview */}
                    {showImagePreview && imagePreview && (
                      <div className="mt-3">
                        <p className="text-muted mb-2">Current Image:</p>
                        <div className="border rounded p-3 bg-light text-center">
                          <img
                            src={imagePreview}
                            alt="Preview"
                            className="img-fluid rounded"
                            style={{
                              maxHeight: '200px',
                              objectFit: 'contain'
                            }}
                            onError={(e) => {
                              e.target.style.display = "none";
                              e.target.parentElement.innerHTML = 
                                '<div class="text-muted p-4">' +
                                '<FaImage className="fs-1 mb-2" /><br/>' +
                                '<small>Invalid image URL</small></div>';
                            }}
                          />
                        </div>
                      </div>
                    )}
                    
                    {showImagePreview && !imagePreview && (
                      <div className="text-center border rounded p-5 bg-light">
                        <FaImage className="fs-1 text-muted mb-2" />
                        <p className="text-muted mb-0">No image available</p>
                      </div>
                    )}
                  </Card.Body>
                </Card>
                
                {/* Product Status */}
                <Card className="mt-3 border">
                  <Card.Body>
                    <h6 className="mb-3">Product Status</h6>
                    <div className="d-flex justify-content-between mb-2">
                      <span className="text-muted">Stock Status:</span>
                      {isOutOfStock ? (
                        <Badge bg="danger">Out of Stock</Badge>
                      ) : isLowStock ? (
                        <Badge bg="warning">Low Stock</Badge>
                      ) : (
                        <Badge bg="success">In Stock</Badge>
                      )}
                    </div>
                    <div className="d-flex justify-content-between mb-2">
                      <span className="text-muted">Current Stock:</span>
                      <span className="fw-bold">{formData.stock_quantity}</span>
                    </div>
                    <div className="d-flex justify-content-between mb-2">
                      <span className="text-muted">Price:</span>
                      <span className="fw-bold">₹{formData.price}</span>
                    </div>
                    <div className="d-flex justify-content-between">
                      <span className="text-muted">Category:</span>
                      <Badge bg={formData.category === "book" ? "info" : "primary"}>
                        {formData.category === "book" ? "Book" : "Stationery"}
                      </Badge>
                    </div>
                  </Card.Body>
                </Card>
              </Col>
            </Row>
            
            {/* Action Buttons */}
            <div className="border-top pt-4 mt-4">
              <div className="d-flex justify-content-between">
                <div>
                  <Button 
                    variant="outline-secondary" 
                    onClick={() => navigate('/admin-dashboard')}
                    disabled={saving}
                    className="me-2 px-4"
                  >
                    Cancel
                  </Button>
                  <Button
                    variant="danger"
                    onClick={handleDelete}
                    disabled={saving}
                    className="px-4"
                  >
                    <FaTrash className="me-2" />
                    Delete Product
                  </Button>
                </div>
                
                <Button 
                  variant="primary" 
                  type="submit"
                  disabled={saving}
                  className="px-4"
                >
                  {saving ? (
                    <>
                      <Spinner size="sm" className="me-2" />
                      Saving Changes...
                    </>
                  ) : (
                    <>
                      <FaSave className="me-2" />
                      Update Product
                    </>
                  )}
                </Button>
              </div>
            </div>
          </Form>
        </Card.Body>
      </Card>
      
      {/* Help Text */}
      <div className="mt-4 text-muted small">
        <p className="mb-1"><strong>Note:</strong> Based on ERD, products can only be "book" or "stationery".</p>
        <p className="mb-0">Changes will be reflected immediately in the store.</p>
      </div>
    </Container>
  );
};

export default EditProduct;