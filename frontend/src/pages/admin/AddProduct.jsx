// frontend/src/pages/admin/AddProduct.jsx
import React, { useState, useEffect } from "react";
import { 
  Container, Card, Form, Button, Row, Col, Spinner, Alert,
  Badge, FloatingLabel, Modal, InputGroup
} from "react-bootstrap";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { 
  FaArrowLeft, FaPlus, FaImage, FaSave, FaEye, FaEyeSlash, 
  FaExclamationTriangle, FaTimes, FaCheck, FaEdit, FaTrash 
} from "react-icons/fa";

const AddProduct = () => {
  const navigate = useNavigate();
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    category: "",
    price: "",
    stock_quantity: "",
    description: "",
    author: "",
    genre: "",
    image_url: ""
  });
  const [imagePreview, setImagePreview] = useState("");
  const [showImagePreview, setShowImagePreview] = useState(true);
  
  // Category states
  const [categories, setCategories] = useState([]);
  const [loadingCategories, setLoadingCategories] = useState(true);
  
  // Modal states
  const [showAddCategoryModal, setShowAddCategoryModal] = useState(false);
  const [newCategory, setNewCategory] = useState({ name: "", description: "" });
  const [addingCategory, setAddingCategory] = useState(false);
  
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  // Fetch categories on component mount
  useEffect(() => {
    fetchCategories();
  }, []);

  const fetchCategories = async () => {
    try {
      setLoadingCategories(true);
      const response = await axios.get("http://localhost:5000/api/categories");
      
      if (response.data.success) {
        // Use categories from API or fallback to basic ones
        const categoryList = response.data.formattedCategories || 
          response.data.categories || 
          ["book", "stationery"];
        
        // Format categories for dropdown
        const formattedCategories = categoryList.map(cat => {
          if (typeof cat === 'string') {
            return {
              value: cat,
              label: cat.charAt(0).toUpperCase() + cat.slice(1),
              description: `${cat} products`
            };
          }
          return cat; // Already formatted
        });
        
        setCategories(formattedCategories);
        
        // Set default category if none selected
        if (!formData.category && formattedCategories.length > 0) {
          setFormData(prev => ({
            ...prev,
            category: formattedCategories[0].value
          }));
        }
      }
    } catch (error) {
      console.error("Error fetching categories:", error);
      // Fallback to basic categories
      setCategories([
        { value: "book", label: "Book", description: "Books and reading materials" },
        { value: "stationery", label: "Stationery", description: "Office and school supplies" }
      ]);
      
      if (!formData.category) {
        setFormData(prev => ({ ...prev, category: "book" }));
      }
    } finally {
      setLoadingCategories(false);
    }
  };

  // Add new category function
  const handleAddCategory = async () => {
    if (!newCategory.name.trim()) {
      setError("Category name is required");
      return;
    }

    setAddingCategory(true);
    setError("");

    try {
      const token = localStorage.getItem("token");
      const response = await axios.post(
        "http://localhost:5000/api/categories",
        {
          name: newCategory.name.trim(),
          description: newCategory.description.trim()
        },
        {
          headers: { Authorization: `Bearer ${token}` }
        }
      );

      if (response.data.success) {
        // Refresh categories
        await fetchCategories();
        
        // Set the new category as selected
        setFormData(prev => ({
          ...prev,
          category: newCategory.name.trim().toLowerCase()
        }));
        
        // Close modal and reset form
        setShowAddCategoryModal(false);
        setNewCategory({ name: "", description: "" });
        
        setSuccess(`Category "${newCategory.name}" added successfully!`);
      }
    } catch (error) {
      console.error("Error adding category:", error);
      setError(error.response?.data?.message || "Failed to add category");
    } finally {
      setAddingCategory(false);
    }
  };

  // Update author/genre when category changes
  useEffect(() => {
    if (formData.category !== "book") {
      setFormData(prev => ({
        ...prev,
        author: "",
        genre: ""
      }));
    }
  }, [formData.category]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value,
    });

    if (name === "image_url") {
      setImagePreview(value);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError("");
    setSuccess("");

    try {
      // Validation
      const errors = [];
      if (!formData.name.trim()) errors.push("Product name is required");
      if (!formData.category.trim()) errors.push("Category is required");
      if (!formData.price || isNaN(formData.price) || parseFloat(formData.price) <= 0) {
        errors.push("Valid price is required");
      }
      if (!formData.stock_quantity || isNaN(formData.stock_quantity) || parseInt(formData.stock_quantity) < 0) {
        errors.push("Valid stock quantity is required");
      }
      
      // Book-specific validation
      if (formData.category === "book" && !formData.author.trim()) {
        errors.push("Author is required for books");
      }
      
      if (errors.length > 0) {
        throw new Error(errors.join(", "));
      }

      const productData = {
        name: formData.name.trim(),
        category: formData.category,
        price: parseFloat(formData.price),
        stock_quantity: parseInt(formData.stock_quantity),
        description: formData.description || "",
        author: formData.author || "",
        genre: formData.genre || "",
        image_url: formData.image_url || ""
      };

      const token = localStorage.getItem("token");
      await axios.post("http://localhost:5000/api/products", productData, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      setSuccess("Product added successfully!");
      
      // Clear form after successful submission
      setFormData({
        name: "",
        category: categories.length > 0 ? categories[0].value : "",
        price: "",
        stock_quantity: "",
        description: "",
        author: "",
        genre: "",
        image_url: ""
      });
      setImagePreview("");
      
      // Navigate after 2 seconds
      setTimeout(() => {
        navigate("/admin/products");
      }, 2000);

    } catch (error) {
      console.error("Error adding product:", error);
      
      if (error.response?.status === 400) {
        setError(error.response.data.message || "Validation failed. Please check your inputs.");
      } else if (error.response?.status === 401) {
        setError("Unauthorized. Please log in again.");
        setTimeout(() => navigate("/login"), 2000);
      } else if (error.response?.status === 500) {
        setError("Server error. Please try again later.");
      } else {
        setError(error.response?.data?.message || error.message || "Failed to add product");
      }
    } finally {
      setSaving(false);
    }
  };

  return (
    <Container className="py-4">
      {/* Header with Back Button */}
      <div className="d-flex align-items-center justify-content-between mb-4">
        <div className="d-flex align-items-center">
          <Button variant="outline-secondary" onClick={() => navigate("/admin/products")} className="me-3">
            <FaArrowLeft className="me-2" />
            Back to Products
          </Button>
          <h2 className="mb-0">Add New Product</h2>
        </div>
        <Button 
          variant="outline-primary" 
          size="sm" 
          onClick={() => setShowAddCategoryModal(true)}
        >
          <FaPlus className="me-1" /> Add New Category
        </Button>
      </div>
      
      {/* Alerts */}
      {error && <Alert variant="danger" dismissible onClose={() => setError("")}>
        <FaExclamationTriangle className="me-2" />
        {error}
      </Alert>}
      {success && <Alert variant="success" dismissible onClose={() => setSuccess("")}>
        {success}
      </Alert>}
      
      {/* Add Category Modal */}
      <Modal show={showAddCategoryModal} onHide={() => setShowAddCategoryModal(false)} centered>
        <Modal.Header closeButton>
          <Modal.Title><FaPlus className="me-2" />Add New Category</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Form.Group className="mb-3">
            <FloatingLabel label="Category Name *">
              <Form.Control
                type="text"
                placeholder="e.g., Electronics"
                value={newCategory.name}
                onChange={(e) => setNewCategory({...newCategory, name: e.target.value})}
                disabled={addingCategory}
              />
            </FloatingLabel>
            <Form.Text className="text-muted">
              Enter a name for the new category
            </Form.Text>
          </Form.Group>
          
          <Form.Group>
            <FloatingLabel label="Description (Optional)">
              <Form.Control
                as="textarea"
                rows={3}
                placeholder="Describe this category..."
                value={newCategory.description}
                onChange={(e) => setNewCategory({...newCategory, description: e.target.value})}
                disabled={addingCategory}
              />
            </FloatingLabel>
          </Form.Group>
          
          <div className="mt-4">
            <small className="text-muted">
              <FaExclamationTriangle className="me-1" />
              This category will be available for all products after creation.
            </small>
          </div>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="outline-secondary" onClick={() => setShowAddCategoryModal(false)}>
            <FaTimes className="me-1" /> Cancel
          </Button>
          <Button 
            variant="primary" 
            onClick={handleAddCategory}
            disabled={addingCategory || !newCategory.name.trim()}
          >
            {addingCategory ? (
              <>
                <Spinner animation="border" size="sm" className="me-2" />
                Adding...
              </>
            ) : (
              <>
                <FaCheck className="me-1" /> Add Category
              </>
            )}
          </Button>
        </Modal.Footer>
      </Modal>
      
      {/* Main Form Card */}
      <Card className="shadow-sm border-0">
        <Card.Header className="bg-white border-bottom py-3">
          <h5 className="mb-0 text-primary"><FaPlus className="me-2" />Product Details</h5>
          <small className="text-muted">Fields marked with * are required</small>
        </Card.Header>
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
                          <div className="d-flex justify-content-between align-items-center mb-2">
                            <FloatingLabel label="Category *">
                              <InputGroup>
                                <Form.Select
                                  name="category"
                                  value={formData.category}
                                  onChange={handleChange}
                                  required
                                  disabled={loadingCategories}
                                  style={{ height: '58px', paddingTop: '1.625rem' }}
                                >
                                  <option value="">Select a category...</option>
                                  {loadingCategories ? (
                                    <option disabled>Loading categories...</option>
                                  ) : categories.length === 0 ? (
                                    <option disabled>No categories available</option>
                                  ) : (
                                    categories.map((cat, index) => (
                                      <option key={index} value={cat.value}>
                                        {cat.label}
                                      </option>
                                    ))
                                  )}
                                </Form.Select>
                                <Button 
                                  variant="outline-secondary"
                                  onClick={() => setShowAddCategoryModal(true)}
                                  style={{ height: '58px' }}
                                >
                                  <FaPlus />
                                </Button>
                              </InputGroup>
                            </FloatingLabel>
                          </div>
                          <div className="d-flex justify-content-between align-items-center mt-1">
                            <Form.Text className="text-muted">
                              {formData.category === "book" 
                                ? "Books require author information"
                                : formData.category 
                                ? `${categories.find(c => c.value === formData.category)?.description || 'Category'}`
                                : "Select or add a category"
                              }
                            </Form.Text>
                            <Badge pill bg="info">
                              {categories.length} {categories.length === 1 ? 'category' : 'categories'}
                            </Badge>
                          </div>
                        </Form.Group>
                      </Col>
                      
                      <Col md={3}>
                        <Form.Group>
                          <FloatingLabel label="Price (₹) *">
                            <Form.Control
                              type="number"
                              step="0.01"
                              min="0"
                              name="price"
                              value={formData.price}
                              onChange={handleChange}
                              required
                              placeholder=" "
                              className="form-control-lg"
                            />
                          </FloatingLabel>
                        </Form.Group>
                      </Col>
                      
                      <Col md={3}>
                        <Form.Group>
                          <FloatingLabel label="Stock *">
                            <Form.Control
                              type="number"
                              min="0"
                              name="stock_quantity"
                              value={formData.stock_quantity}
                              onChange={handleChange}
                              required
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
                      <Form.Text className="text-muted">
                        Optional. Enter a valid image URL
                      </Form.Text>
                    </Form.Group>
                    
                    {/* Image Preview */}
                    {showImagePreview && imagePreview && (
                      <div className="mt-3">
                        <p className="text-muted mb-2">Preview:</p>
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
                        <p className="text-muted mb-0">Image preview will appear here</p>
                      </div>
                    )}
                  </Card.Body>
                </Card>
                
                {/* Product Summary */}
                <Card className="mt-3 border">
                  <Card.Body>
                    <h6 className="mb-3">Product Summary</h6>
                    <div className="d-flex justify-content-between mb-2">
                      <span className="text-muted">Category:</span>
                      <Badge bg={formData.category ? "primary" : "secondary"}>
                        {formData.category 
                          ? (categories.find(c => c.value === formData.category)?.label || formData.category)
                          : "Not selected"
                        }
                      </Badge>
                    </div>
                    <div className="d-flex justify-content-between mb-2">
                      <span className="text-muted">Required Fields:</span>
                      <Badge bg={
                        formData.name && formData.price && formData.stock_quantity && formData.category &&
                        (formData.category !== "book" || formData.author) ? "success" : "warning"
                      }>
                        {
                          formData.name && formData.price && formData.stock_quantity && formData.category &&
                          (formData.category !== "book" || formData.author) ? "Complete" : "Incomplete"
                        }
                      </Badge>
                    </div>
                    <div className="d-flex justify-content-between mb-2">
                      <span className="text-muted">Price:</span>
                      <span className="fw-bold">₹{formData.price || "0.00"}</span>
                    </div>
                    <div className="d-flex justify-content-between">
                      <span className="text-muted">Stock Status:</span>
                      <Badge bg={formData.stock_quantity > 0 ? "success" : "secondary"}>
                        {formData.stock_quantity > 0 ? "In Stock" : "Out of Stock"}
                      </Badge>
                    </div>
                  </Card.Body>
                </Card>
              </Col>
            </Row>
            
            {/* Action Buttons */}
            <div className="border-top pt-4 mt-4">
              <div className="d-flex justify-content-between">
                <Button
                  variant="outline-secondary"
                  onClick={() => navigate("/admin/products")}
                  disabled={saving}
                  className="px-4"
                >
                  Cancel
                </Button>
                
                <Button 
                  variant="primary" 
                  type="submit"
                  disabled={saving || !formData.category}
                  className="px-4"
                >
                  {saving ? (
                    <>
                      <Spinner animation="border" size="sm" className="me-2" />
                      Adding Product...
                    </>
                  ) : (
                    <>
                      <FaSave className="me-2" />
                      Add Product
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
        <p className="mb-1">
          <FaPlus className="me-1" />
          <strong>Need a new category?</strong> Click "Add New Category" button to create one.
        </p>
        <p className="mb-0">
          Books require author information. Other categories may have different requirements.
        </p>
      </div>
    </Container>
  );
};

export default AddProduct;