import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Row, Col, Card, Button, Form, Badge, Spinner, Alert } from "react-bootstrap";
import { FaShoppingCart } from "react-icons/fa";
import axios from "axios";

const BookSetSection = () => {
  const navigate = useNavigate();
  const [bookSets, setBookSets] = useState([]);
  const [filteredBookSets, setFilteredBookSets] = useState([]);
  const [schools, setSchools] = useState([]);
  const [selectedSchool, setSelectedSchool] = useState("");
  const [selectedGrade, setSelectedGrade] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const grades = [
    "Nursery", "LKG", "UKG",
    "1", "2", "3", "4", "5", "6", "7", "8", "9", "10", "11", "12"
  ];

  useEffect(() => {
    fetchBookSets();
  }, []);

  useEffect(() => {
    filterBookSets();
  }, [selectedSchool, selectedGrade, bookSets]);

  const fetchBookSets = async () => {
    try {
      setLoading(true);
      setError("");
      
      const token = localStorage.getItem("token");
      const headers = token ? { Authorization: `Bearer ${token}` } : {};
      
      const response = await axios.get("http://localhost:5000/api/book-sets", { headers });
      
      if (response.data.success) {
        setBookSets(response.data.bookSets || []);
        
        // Extract unique schools
        const uniqueSchools = [...new Set(response.data.bookSets.map(bs => bs.school_name))];
        setSchools(uniqueSchools.sort());
      }
    } catch (err) {
      console.error("Error fetching book sets:", err);
      setError("Failed to load book sets.");
    } finally {
      setLoading(false);
    }
  };

  const filterBookSets = () => {
    let filtered = bookSets;

    if (selectedSchool) {
      filtered = filtered.filter(bs => bs.school_name === selectedSchool);
    }

    if (selectedGrade) {
      filtered = filtered.filter(bs => bs.grade === selectedGrade);
    }

    setFilteredBookSets(filtered);
  };

  const handleAddSetToCart = async (bookSet) => {
    try {
      const token = localStorage.getItem("token");
      if (!token) {
        alert("Please login to add items to cart");
        return;
      }

      let addedCount = 0;
      let skippedCount = 0;

      // Try to add all books from the set to cart
      for (const item of bookSet.items) {
        if (item.product_id) {
          try {
            await axios.post("http://localhost:5000/api/users/cart/add", {
              productId: item.product_id,
              quantity: 1
            }, {
              headers: { Authorization: `Bearer ${token}` }
            });
            addedCount++;
          } catch (err) {
            console.error(`Failed to add ${item.title}:`, err);
            skippedCount++;
          }
        } else {
          skippedCount++;
        }
      }

      if (addedCount > 0) {
        alert(`Successfully added ${addedCount} book(s) to cart!${skippedCount > 0 ? `\n${skippedCount} book(s) are not available as products yet.` : ''}`);
      } else {
        alert("These books are not available as individual products yet. They are part of a book set catalog.\n\nPlease contact the institute or admin to make these books available for purchase.");
      }
    } catch (error) {
      console.error("Error adding book set to cart:", error);
      alert("Failed to add items to cart. Please try again.");
    }
  };

  const calculateDiscount = (bookSet) => {
    // Calculate a sample discount percentage (you can adjust this logic)
    const discount = Math.floor(Math.random() * 20) + 10; // 10-30% discount
    return discount;
  };

  const calculateOriginalPrice = (currentPrice, discount) => {
    return (currentPrice / (1 - discount / 100)).toFixed(0);
  };

  if (loading) {
    return (
      <div className="text-center py-5">
        <Spinner animation="border" variant="primary" />
        <p className="mt-3">Loading book sets...</p>
      </div>
    );
  }

  return (
    <div style={{ 
      background: 'linear-gradient(to bottom, #fef3e2 0%, #f5e6d3 100%)',
      padding: '3rem 2rem',
      borderRadius: '16px',
      marginTop: '2rem'
    }}>
      {/* Header */}
      <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
        <Badge 
          bg="warning" 
          text="dark"
          style={{ 
            fontSize: '0.9rem', 
            padding: '0.5rem 1.5rem',
            borderRadius: '50px',
            marginBottom: '1rem',
            fontWeight: 600
          }}
        >
          Complete Book Sets
        </Badge>
        <h2 style={{ 
          fontSize: '2.5rem', 
          fontWeight: 800, 
          color: '#1a1a2e',
          marginBottom: '0.75rem' 
        }}>
          School Book Sets
        </h2>
        <p style={{ 
          fontSize: '1.1rem', 
          color: '#6b7280',
          maxWidth: '700px',
          margin: '0 auto'
        }}>
          Get complete book sets for your child's class with a single click. Select your school and grade to find the perfect set.
        </p>
      </div>

      {error && (
        <Alert variant="danger" dismissible onClose={() => setError("")}>
          {error}
        </Alert>
      )}

      {/* Filters */}
      <div style={{ 
        display: 'flex', 
        gap: '1rem', 
        justifyContent: 'center',
        marginBottom: '2rem',
        flexWrap: 'wrap'
      }}>
        <Form.Select
          value={selectedGrade}
          onChange={(e) => setSelectedGrade(e.target.value)}
          style={{ 
            maxWidth: '200px',
            borderRadius: '8px',
            padding: '0.75rem 1rem',
            border: '2px solid #e5e7eb',
            fontWeight: 600
          }}
        >
          <option value="">Select Grade</option>
          {grades.map(grade => (
            <option key={grade} value={grade}>Class {grade}</option>
          ))}
        </Form.Select>

        <Form.Select
          value={selectedSchool}
          onChange={(e) => setSelectedSchool(e.target.value)}
          style={{ 
            maxWidth: '300px',
            borderRadius: '8px',
            padding: '0.75rem 1rem',
            border: '2px solid #e5e7eb',
            fontWeight: 600
          }}
        >
          <option value="">Select School</option>
          {schools.map(school => (
            <option key={school} value={school}>{school}</option>
          ))}
        </Form.Select>

        <Button
          variant="primary"
          style={{
            borderRadius: '8px',
            padding: '0.75rem 2rem',
            fontWeight: 600,
            background: '#16a085',
            border: 'none'
          }}
          onClick={() => {
            // Trigger search/filter
            filterBookSets();
          }}
        >
          Search Sets
        </Button>
      </div>

      {/* Results */}
      {filteredBookSets.length === 0 ? (
        <Card style={{ 
          border: 'none', 
          boxShadow: '0 4px 6px rgba(0,0,0,0.1)', 
          borderRadius: '12px',
          background: 'white'
        }}>
          <Card.Body className="text-center py-5">
            <div style={{ fontSize: '4rem', marginBottom: '1rem' }}>📚</div>
            <h4 style={{ fontWeight: 700, marginBottom: '0.5rem' }}>No Book Sets Available</h4>
            <p className="text-muted">
              {selectedSchool || selectedGrade
                ? "No book sets found for the selected filters. Try different options."
                : "Book sets have not been published yet. Please check back later."}
            </p>
          </Card.Body>
        </Card>
      ) : (
        <>
          <Row className="g-4">
            {filteredBookSets.slice(0, 4).map(bookSet => {
              const discount = calculateDiscount(bookSet);
              const originalPrice = calculateOriginalPrice(bookSet.total_price, discount);
              
              return (
                <Col key={bookSet.id} md={6} lg={3}>
                  <Card 
                    onClick={() => navigate(`/book-sets/${bookSet.id}`)}
                    style={{
                      border: 'none',
                      boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
                      borderRadius: '12px',
                      height: '100%',
                      background: 'white',
                      transition: 'transform 0.3s ease, box-shadow 0.3s ease',
                      overflow: 'hidden',
                      cursor: 'pointer'
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.transform = 'translateY(-8px)';
                      e.currentTarget.style.boxShadow = '0 8px 20px rgba(0,0,0,0.15)';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.transform = 'translateY(0)';
                      e.currentTarget.style.boxShadow = '0 4px 12px rgba(0,0,0,0.1)';
                    }}>
                    {/* Discount Badge */}
                    <div style={{
                      position: 'absolute',
                      top: '12px',
                      left: '12px',
                      background: '#ff6b6b',
                      color: 'white',
                      padding: '0.4rem 0.8rem',
                      borderRadius: '8px',
                      fontSize: '0.85rem',
                      fontWeight: 700,
                      zIndex: 1
                    }}>
                      -{discount}%
                    </div>

                    {/* Grade Badge */}
                    <div style={{
                      position: 'absolute',
                      top: '12px',
                      right: '12px',
                      background: '#4f46e5',
                      color: 'white',
                      padding: '0.4rem 0.8rem',
                      borderRadius: '8px',
                      fontSize: '0.85rem',
                      fontWeight: 700,
                      zIndex: 1
                    }}>
                      Class {bookSet.grade}
                    </div>

                    <Card.Body style={{ padding: '1.5rem' }}>
                      <div style={{ marginTop: '2rem', marginBottom: '1rem' }}>
                        <h5 style={{ 
                          fontWeight: 700, 
                          marginBottom: '0.5rem',
                          fontSize: '1.1rem',
                          color: '#1a1a2e',
                          minHeight: '2.5rem'
                        }}>
                          {bookSet.school_name}
                        </h5>
                        <p style={{ 
                          margin: 0, 
                          color: '#6b7280', 
                          fontSize: '0.9rem' 
                        }}>
                          Complete set with {bookSet.items.length} books
                        </p>
                      </div>

                      {/* Price Section */}
                      <div style={{ marginBottom: '1rem' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                          <span style={{
                            fontSize: '1.75rem',
                            fontWeight: 800,
                            color: '#1a1a2e'
                          }}>
                            ₹{bookSet.total_price.toFixed(0)}
                          </span>
                          <span style={{
                            fontSize: '1rem',
                            color: '#9ca3af',
                            textDecoration: 'line-through'
                          }}>
                            ₹{originalPrice}
                          </span>
                        </div>
                      </div>

                      {/* Action Buttons */}
                      <div style={{ display: 'flex', gap: '0.5rem' }}>
                        <Button
                          variant="outline-primary"
                          onClick={(e) => {
                            e.stopPropagation();
                            navigate(`/book-sets/${bookSet.id}`);
                          }}
                          style={{
                            flex: 1,
                            borderRadius: '8px',
                            padding: '0.75rem',
                            fontWeight: 600,
                            border: '2px solid #16a085',
                            color: '#16a085',
                            fontSize: '0.9rem'
                          }}
                        >
                          View Details
                        </Button>
                        <Button
                          variant="primary"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleAddSetToCart(bookSet);
                          }}
                          style={{
                            flex: 1,
                            borderRadius: '8px',
                            padding: '0.75rem',
                            fontWeight: 600,
                            background: '#16a085',
                            border: 'none',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            gap: '0.5rem',
                            fontSize: '0.9rem'
                          }}
                        >
                          <FaShoppingCart />
                          Add
                        </Button>
                      </div>
                    </Card.Body>
                  </Card>
                </Col>
              );
            })}
          </Row>

          {/* View All Button */}
          {filteredBookSets.length > 4 && (
            <div style={{ textAlign: 'center', marginTop: '2rem' }}>
              <Button
                variant="outline-dark"
                size="lg"
                onClick={() => navigate("/book-sets")}
                style={{
                  borderRadius: '50px',
                  padding: '0.875rem 2.5rem',
                  fontWeight: 600,
                  border: '2px solid #1a1a2e'
                }}
              >
                View All School Sets
              </Button>
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default BookSetSection;
