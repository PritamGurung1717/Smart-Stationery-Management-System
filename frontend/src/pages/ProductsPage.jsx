// frontend/src/pages/ProductsPage.jsx
import React, { useState, useEffect } from "react";
import axios from "axios";
import { Container, Row, Col, Card, Button, Form, Spinner, Badge, InputGroup, Pagination } from "react-bootstrap";
import { FaSearch, FaShoppingCart, FaFilter, FaSort } from "react-icons/fa";

const ProductsPage = () => {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [category, setCategory] = useState("all");
  const [minPrice, setMinPrice] = useState("");
  const [maxPrice, setMaxPrice] = useState("");
  const [inStock, setInStock] = useState("all");
  const [sortBy, setSortBy] = useState("name");
  const [sortOrder, setSortOrder] = useState("asc");
  
  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalProducts, setTotalProducts] = useState(0);
  const productsPerPage = 12;

  useEffect(() => {
    fetchProducts(1);
  }, []);

  const fetchProducts = async (page = 1) => {
    try {
      setLoading(true);
      let url = `http://localhost:5000/api/products?page=${page}&limit=${productsPerPage}`;
      
      const params = [];
      if (searchTerm) params.push(`search=${encodeURIComponent(searchTerm)}`);
      if (category && category !== "all") params.push(`category=${category}`);
      if (minPrice) params.push(`minPrice=${minPrice}`);
      if (maxPrice) params.push(`maxPrice=${maxPrice}`);
      if (inStock !== "all") params.push(`inStock=${inStock === "inStock"}`);
      params.push(`sortBy=${sortBy}`);
      params.push(`sortOrder=${sortOrder}`);
      
      if (params.length > 0) {
        url += `&${params.join("&")}`;
      }
      
      const response = await axios.get(url);
      setProducts(response.data.products || []);
      setTotalPages(response.data.totalPages || 1);
      setTotalProducts(response.data.total || 0);
      setCurrentPage(page);
    } catch (error) {
      console.error("Error fetching products:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = () => {
    fetchProducts(1);
  };

  const handleSortChange = (field) => {
    if (sortBy === field) {
      setSortOrder(sortOrder === "asc" ? "desc" : "asc");
    } else {
      setSortBy(field);
      setSortOrder("asc");
    }
    fetchProducts(1);
  };

  const addToCart = async (productId) => {
    try {
      const token = localStorage.getItem("token");
      if (!token) {
        alert("Please login to add items to cart!");
        return;
      }
      
      await axios.post(
        "http://localhost:5000/api/users/cart/add",
        { productId, quantity: 1 },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      alert("Product added to cart!");
    } catch (error) {
      console.error("Error adding to cart:", error);
      alert(error.response?.data?.message || "Failed to add to cart");
    }
  };

  const clearFilters = () => {
    setSearchTerm("");
    setCategory("all");
    setMinPrice("");
    setMaxPrice("");
    setInStock("all");
    setSortBy("name");
    setSortOrder("asc");
    fetchProducts(1);
  };

  return (
    <Container className="py-5">
      <h1 className="mb-4">Products</h1>
      
      {/* Search and Filters */}
      <Card className="mb-4 p-3 shadow-sm">
        <Row className="g-3">
          <Col md={4}>
            <InputGroup>
              <InputGroup.Text>
                <FaSearch />
              </InputGroup.Text>
              <Form.Control
                placeholder="Search products by name, category, author..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
              />
              <Button variant="primary" onClick={handleSearch}>
                Search
              </Button>
            </InputGroup>
          </Col>
          <Col md={2}>
            <Form.Select value={category} onChange={(e) => {
              setCategory(e.target.value);
              fetchProducts(1);
            }}>
              <option value="all">All Categories</option>
              <option value="book">Books</option>
              <option value="stationery">Stationery</option>
            </Form.Select>
          </Col>
          <Col md={2}>
            <Form.Select value={inStock} onChange={(e) => {
              setInStock(e.target.value);
              fetchProducts(1);
            }}>
              <option value="all">All Stock</option>
              <option value="inStock">In Stock</option>
              <option value="outOfStock">Out of Stock</option>
            </Form.Select>
          </Col>
          <Col md={2}>
            <Form.Select value={sortBy} onChange={(e) => {
              setSortBy(e.target.value);
              fetchProducts(1);
            }}>
              <option value="name">Sort by Name</option>
              <option value="price">Sort by Price</option>
              <option value="created_at">Sort by Newest</option>
            </Form.Select>
          </Col>
          <Col md={2}>
            <Button 
              variant="outline-secondary" 
              onClick={clearFilters}
              className="w-100"
            >
              Clear Filters
            </Button>
          </Col>
        </Row>
        
        {/* Price Range */}
        <Row className="g-3 mt-2">
          <Col md={3}>
            <Form.Control
              type="number"
              placeholder="Min Price"
              value={minPrice}
              onChange={(e) => setMinPrice(e.target.value)}
              onBlur={() => fetchProducts(1)}
            />
          </Col>
          <Col md={3}>
            <Form.Control
              type="number"
              placeholder="Max Price"
              value={maxPrice}
              onChange={(e) => setMaxPrice(e.target.value)}
              onBlur={() => fetchProducts(1)}
            />
          </Col>
          <Col md={6}>
            <div className="d-flex align-items-center">
              <small className="text-muted me-2">
                Showing {products.length} of {totalProducts} products
              </small>
              <div className="ms-auto">
                <Button 
                  variant={sortOrder === "asc" ? "outline-primary" : "outline-secondary"}
                  size="sm"
                  onClick={() => {
                    setSortOrder(sortOrder === "asc" ? "desc" : "asc");
                    fetchProducts(1);
                  }}
                >
                  <FaSort className="me-1" />
                  {sortOrder === "asc" ? "Ascending" : "Descending"}
                </Button>
              </div>
            </div>
          </Col>
        </Row>
      </Card>

      {loading ? (
        <div className="text-center py-5">
          <Spinner animation="border" />
          <p className="mt-2">Loading products...</p>
        </div>
      ) : (
        <>
          <Row xs={1} sm={2} md={3} lg={4} className="g-4">
            {products.map(product => (
              <Col key={product.id}>
                <Card className="h-100 shadow-sm">
                  {product.image_url && (
                    <Card.Img 
                      variant="top" 
                      src={product.image_url} 
                      style={{ height: "200px", objectFit: "contain", padding: "10px" }}
                      onError={(e) => {
                        e.target.onerror = null;
                        e.target.src = "https://via.placeholder.com/200x200?text=No+Image";
                      }}
                    />
                  )}
                  <Card.Body className="d-flex flex-column">
                    <Card.Title className="h6">{product.name}</Card.Title>
                    <Card.Subtitle className="mb-2 text-muted">
                      <Badge bg={product.category === "book" ? "info" : "primary"}>
                        {product.category}
                      </Badge>
                      {product.category === "book" && product.author && (
                        <small className="ms-2">by {product.author}</small>
                      )}
                    </Card.Subtitle>
                    <Card.Text className="mb-1 fs-5 fw-bold">₹{product.price}</Card.Text>
                    <Card.Text className="mb-2">
                      <Badge bg={(product.stock_quantity || product.stock || 0) > 0 ? "success" : "danger"}>
                        {(product.stock_quantity || product.stock || 0) > 0 ? "In Stock" : "Out of Stock"}
                      </Badge>
                      {(product.stock_quantity || product.stock || 0) > 0 && (
                        <small className="ms-2 text-muted">
                          {product.stock_quantity || product.stock} available
                        </small>
                      )}
                    </Card.Text>
                    {product.description && (
                      <Card.Text className="small text-muted mb-3">
                        {product.description.length > 80 
                          ? `${product.description.substring(0, 80)}...` 
                          : product.description}
                      </Card.Text>
                    )}
                    <div className="mt-auto">
                      <Button
                        variant="primary"
                        className="w-100"
                        onClick={() => addToCart(product.id)}
                        disabled={(product.stock_quantity || product.stock || 0) === 0}
                      >
                        <FaShoppingCart className="me-2" />
                        {(product.stock_quantity || product.stock || 0) > 0 ? "Add to Cart" : "Out of Stock"}
                      </Button>
                    </div>
                  </Card.Body>
                </Card>
              </Col>
            ))}
          </Row>
          
          {/* Pagination */}
          {totalPages > 1 && (
            <div className="d-flex justify-content-center mt-5">
              <Pagination>
                <Pagination.First onClick={() => fetchProducts(1)} disabled={currentPage === 1} />
                <Pagination.Prev onClick={() => fetchProducts(currentPage - 1)} disabled={currentPage === 1} />
                
                {[...Array(totalPages)].map((_, i) => {
                  const pageNum = i + 1;
                  if (
                    pageNum === 1 || 
                    pageNum === totalPages || 
                    (pageNum >= currentPage - 2 && pageNum <= currentPage + 2)
                  ) {
                    return (
                      <Pagination.Item
                        key={pageNum}
                        active={pageNum === currentPage}
                        onClick={() => fetchProducts(pageNum)}
                      >
                        {pageNum}
                      </Pagination.Item>
                    );
                  } else if (
                    pageNum === currentPage - 3 ||
                    pageNum === currentPage + 3
                  ) {
                    return <Pagination.Ellipsis key={pageNum} />;
                  }
                  return null;
                })}
                
                <Pagination.Next onClick={() => fetchProducts(currentPage + 1)} disabled={currentPage === totalPages} />
                <Pagination.Last onClick={() => fetchProducts(totalPages)} disabled={currentPage === totalPages} />
              </Pagination>
            </div>
          )}
        </>
      )}
      
      {!loading && products.length === 0 && (
        <div className="text-center py-5">
          <h4>No products found</h4>
          <p className="text-muted">Try adjusting your search or filters</p>
          <Button variant="outline-primary" onClick={clearFilters}>
            Clear All Filters
          </Button>
        </div>
      )}
    </Container>
  );
};

export default ProductsPage;