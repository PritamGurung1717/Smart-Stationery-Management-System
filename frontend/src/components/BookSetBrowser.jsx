import React, { useState, useEffect } from "react";
import { Container, Row, Col, Card, Button, Form, Badge, Spinner, Alert, Modal, Table } from "react-bootstrap";
import { FaBook, FaSchool, FaGraduationCap, FaShoppingCart, FaInfoCircle } from "react-icons/fa";
import axios from "axios";

const BookSetBrowser = () => {
  const [bookSets, setBookSets] = useState([]);
  const [filteredBookSets, setFilteredBookSets] = useState([]);
  const [schools, setSchools] = useState([]);
  const [selectedSchool, setSelectedSchool] = useState("");
  const [selectedGrade, setSelectedGrade] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [selectedBookSet, setSelectedBookSet] = useState(null);

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
      setError("Failed to load book sets. Please try again later.");
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

  const showBookSetDetails = (bookSet) => {
    setSelectedBookSet(bookSet);
    setShowDetailsModal(true);
  };

  if (loading) {
    return (
      <Container className="text-center py-5">
        <Spinner animation="border" variant="primary" />
        <p className="mt-3">Loading book sets...</p>
      </Container>
    );
  }

  return (
    <Container fluid className="py-4">
      <div style={{
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        color: 'white',
        padding: '3rem 2rem',
        borderRadius: '16px',
        marginBottom: '2rem'
      }}>
        <h2 style={{ fontSize: '2.5rem', fontWeight: 800, marginBottom: '1rem' }}>
          <FaBook style={{ marginRight: '1rem' }} />
          School Book Sets
        </h2>
        <p style={{ fontSize: '1.1rem', opacity: 0.95, marginBottom: 0 }}>
          Browse approved book sets by school and grade. Get complete book packages for your academic needs.
        </p>
      </div>

      {error && (
        <Alert variant="danger" dismissible onClose={() => setError("")}>
          {error}
        </Alert>
      )}

      {/* Filters */}
      <Card style={{ marginBottom: '2rem', border: 'none', boxShadow: '0 4px 6px rgba(0,0,0,0.1)', borderRadius: '12px' }}>
        <Card.Body>
          <h5 style={{ marginBottom: '1.5rem', fontWeight: 700 }}>
            <FaSearch style={{ marginRight: '0.5rem' }} />
            Search Book Sets
          </h5>
          <Row>
            <Col md={5}>
              <Form.Group>
                <Form.Label style={{ fontWeight: 600 }}>
                  <FaSchool style={{ marginRight: '0.5rem' }} />
                  Select School
                </Form.Label>
                <Form.Select
                  value={selectedSchool}
                  onChange={(e) => setSelectedSchool(e.target.value)}
                  style={{ borderRadius: '8px', padding: '0.75rem' }}
                >
                  <option value="">All Schools</option>
                  {schools.map(school => (
                    <option key={school} value={school}>{school}</option>
                  ))}
                </Form.Select>
              </Form.Group>
            </Col>
            <Col md={5}>
              <Form.Group>
                <Form.Label style={{ fontWeight: 600 }}>
                  <FaGraduationCap style={{ marginRight: '0.5rem' }} />
                  Select Grade
                </Form.Label>
                <Form.Select
                  value={selectedGrade}
                  onChange={(e) => setSelectedGrade(e.target.value)}
                  style={{ borderRadius: '8px', padding: '0.75rem' }}
                >
                  <option value="">All Grades</option>
                  {grades.map(grade => (
                    <option key={grade} value={grade}>Grade {grade}</option>
                  ))}
                </Form.Select>
              </Form.Group>
            </Col>
            <Col md={2} className="d-flex align-items-end">
              <Button
                variant="outline-secondary"
                onClick={() => {
                  setSelectedSchool("");
                  setSelectedGrade("");
                }}
                style={{ width: '100%', borderRadius: '8px', padding: '0.75rem' }}
              >
                Clear Filters
              </Button>
            </Col>
          </Row>
        </Card.Body>
      </Card>

      {/* Results */}
      {filteredBookSets.length === 0 ? (
        <Card style={{ border: 'none', boxShadow: '0 4px 6px rgba(0,0,0,0.1)', borderRadius: '12px' }}>
          <Card.Body className="text-center py-5">
            <div style={{ fontSize: '4rem', marginBottom: '1rem' }}>📚</div>
            <h4 style={{ fontWeight: 700, marginBottom: '0.5rem' }}>No Book Sets Available</h4>
            <p className="text-muted">
              {selectedSchool || selectedGrade
                ? "No book sets found for the selected filters. Try different options."
                : "Book sets have not been published yet. Please check back later."}
            </p>
            {(selectedSchool || selectedGrade) && (
              <Button
                variant="primary"
                onClick={() => {
                  setSelectedSchool("");
                  setSelectedGrade("");
                }}
                style={{ marginTop: '1rem' }}
              >
                View All Book Sets
              </Button>
            )}
          </Card.Body>
        </Card>
      ) : (
        <>
          <div style={{ marginBottom: '1.5rem' }}>
            <h5 style={{ fontWeight: 700 }}>
              Found {filteredBookSets.length} Book Set{filteredBookSets.length !== 1 ? 's' : ''}
            </h5>
          </div>
          <Row>
            {filteredBookSets.map(bookSet => (
              <Col key={bookSet.id} md={6} lg={4} className="mb-4">
                <Card style={{
                  border: 'none',
                  boxShadow: '0 4px 6px rgba(0,0,0,0.1)',
                  borderRadius: '12px',
                  height: '100%',
                  transition: 'transform 0.3s ease, box-shadow 0.3s ease'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = 'translateY(-4px)';
                  e.currentTarget.style.boxShadow = '0 8px 12px rgba(0,0,0,0.15)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = 'translateY(0)';
                  e.currentTarget.style.boxShadow = '0 4px 6px rgba(0,0,0,0.1)';
                }}>
                  <Card.Body>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: '1rem' }}>
                      <Badge bg="primary" style={{ fontSize: '0.9rem', padding: '0.5rem 1rem', borderRadius: '50px' }}>
                        Grade {bookSet.grade}
                      </Badge>
                      <Badge bg="success" style={{ fontSize: '0.9rem', padding: '0.5rem 1rem', borderRadius: '50px' }}>
                        {bookSet.items.length} Books
                      </Badge>
                    </div>
                    
                    <h5 style={{ fontWeight: 700, marginBottom: '0.75rem', color: '#1f2937' }}>
                      <FaSchool style={{ marginRight: '0.5rem', color: '#4f46e5' }} />
                      {bookSet.school_name}
                    </h5>
                    
                    <div style={{ marginBottom: '1rem' }}>
                      <p style={{ margin: 0, color: '#6b7280', fontSize: '0.95rem' }}>
                        <strong>Total Price:</strong> ₹{bookSet.total_price.toFixed(2)}
                      </p>
                      <p style={{ margin: 0, color: '#6b7280', fontSize: '0.9rem' }}>
                        Created: {new Date(bookSet.created_at).toLocaleDateString()}
                      </p>
                    </div>

                    <div style={{ display: 'flex', gap: '0.5rem' }}>
                      <Button
                        variant="outline-primary"
                        size="sm"
                        onClick={() => showBookSetDetails(bookSet)}
                        style={{ flex: 1, borderRadius: '8px', fontWeight: 600 }}
                      >
                        <FaInfoCircle style={{ marginRight: '0.5rem' }} />
                        View Details
                      </Button>
                      <Button
                        variant="primary"
                        size="sm"
                        onClick={() => handleAddSetToCart(bookSet)}
                        style={{ flex: 1, borderRadius: '8px', fontWeight: 600 }}
                      >
                        <FaShoppingCart style={{ marginRight: '0.5rem' }} />
                        Add Set
                      </Button>
                    </div>
                  </Card.Body>
                </Card>
              </Col>
            ))}
          </Row>
        </>
      )}

      {/* Book Set Details Modal */}
      <Modal show={showDetailsModal} onHide={() => setShowDetailsModal(false)} size="lg">
        <Modal.Header closeButton>
          <Modal.Title>
            <FaBook style={{ marginRight: '0.5rem' }} />
            Book Set Details
          </Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {selectedBookSet && (
            <>
              <div style={{ marginBottom: '1.5rem' }}>
                <h5 style={{ fontWeight: 700, marginBottom: '0.5rem' }}>
                  {selectedBookSet.school_name}
                </h5>
                <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
                  <Badge bg="primary">Grade {selectedBookSet.grade}</Badge>
                  <Badge bg="success">{selectedBookSet.items.length} Books</Badge>
                  <Badge bg="info">Total: ₹{selectedBookSet.total_price.toFixed(2)}</Badge>
                </div>
              </div>

              <h6 style={{ fontWeight: 700, marginBottom: '1rem' }}>Books in this Set:</h6>
              <Table striped bordered hover responsive>
                <thead>
                  <tr>
                    <th>#</th>
                    <th>Subject</th>
                    <th>Title</th>
                    <th>Author</th>
                    <th>Publisher</th>
                    <th>Price</th>
                  </tr>
                </thead>
                <tbody>
                  {selectedBookSet.items.map((item, index) => (
                    <tr key={index}>
                      <td>{index + 1}</td>
                      <td>{item.subject_name || '-'}</td>
                      <td>{item.title}</td>
                      <td>{item.author}</td>
                      <td>{item.publisher}</td>
                      <td>₹{item.price.toFixed(2)}</td>
                    </tr>
                  ))}
                </tbody>
                <tfoot>
                  <tr>
                    <td colSpan="5" className="text-end"><strong>Total:</strong></td>
                    <td><strong>₹{selectedBookSet.total_price.toFixed(2)}</strong></td>
                  </tr>
                </tfoot>
              </Table>
            </>
          )}
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowDetailsModal(false)}>
            Close
          </Button>
          {selectedBookSet && (
            <Button
              variant="primary"
              onClick={() => {
                handleAddSetToCart(selectedBookSet);
                setShowDetailsModal(false);
              }}
            >
              <FaShoppingCart style={{ marginRight: '0.5rem' }} />
              Add Complete Set to Cart
            </Button>
          )}
        </Modal.Footer>
      </Modal>
    </Container>
  );
};

export default BookSetBrowser;
