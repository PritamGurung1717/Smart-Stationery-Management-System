import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Container, Row, Col, Card, Button, Badge, Table, Spinner, Alert } from "react-bootstrap";
import { FaArrowLeft, FaShoppingCart, FaBook, FaSchool, FaGraduationCap } from "react-icons/fa";
import axios from "axios";

const BookSetDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [bookSet, setBookSet] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    fetchBookSetDetails();
  }, [id]);

  const fetchBookSetDetails = async () => {
    try {
      setLoading(true);
      setError("");
      
      const token = localStorage.getItem("token");
      const headers = token ? { Authorization: `Bearer ${token}` } : {};
      
      const response = await axios.get(`http://localhost:5000/api/book-sets/${id}`, { headers });
      
      if (response.data.success) {
        setBookSet(response.data.bookSet);
      }
    } catch (err) {
      console.error("Error fetching book set details:", err);
      setError("Failed to load book set details. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleAddSetToCart = async () => {
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
        const message = `Successfully added ${addedCount} book(s) to cart!${skippedCount > 0 ? `\n\n${skippedCount} book(s) are not available as products yet.` : ''}`;
        alert(message);
        navigate("/cart");
      } else {
        alert("These books are not available as individual products yet. They are part of a book set catalog.\n\nTo make these books available for purchase:\n1. Admin needs to create products for each book\n2. Or contact your institute administrator");
      }
    } catch (error) {
      console.error("Error adding book set to cart:", error);
      alert("Failed to add items to cart. Please try again.");
    }
  };

  if (loading) {
    return (
      <div style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%)'
      }}>
        <div className="text-center">
          <Spinner animation="border" variant="primary" style={{ width: '3rem', height: '3rem' }} />
          <p style={{ marginTop: '1rem', fontSize: '1.1rem', fontWeight: 600 }}>Loading book set details...</p>
        </div>
      </div>
    );
  }

  if (error || !bookSet) {
    return (
      <div style={{
        minHeight: '100vh',
        background: 'linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%)',
        padding: '2rem'
      }}>
        <Container>
          <Alert variant="danger">
            {error || "Book set not found"}
          </Alert>
          <Button variant="primary" onClick={() => navigate(-1)}>
            <FaArrowLeft style={{ marginRight: '0.5rem' }} />
            Go Back
          </Button>
        </Container>
      </div>
    );
  }

  return (
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%)',
      paddingBottom: '3rem'
    }}>
      {/* Header */}
      <div style={{
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        color: 'white',
        padding: '2rem 0',
        marginBottom: '2rem',
        boxShadow: '0 4px 6px rgba(0,0,0,0.1)'
      }}>
        <Container>
          <Button
            variant="link"
            onClick={() => navigate(-1)}
            style={{
              color: 'white',
              textDecoration: 'none',
              fontSize: '1rem',
              fontWeight: 600,
              padding: '0.5rem 1rem',
              marginBottom: '1rem',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.5rem'
            }}
          >
            <FaArrowLeft />
            Back to Book Sets
          </Button>
          <h1 style={{
            fontSize: '2.5rem',
            fontWeight: 800,
            marginBottom: '0.5rem',
            display: 'flex',
            alignItems: 'center',
            gap: '1rem'
          }}>
            <FaBook />
            Book Set Details
          </h1>
          <p style={{ fontSize: '1.1rem', opacity: 0.95, margin: 0 }}>
            Complete information about this book set
          </p>
        </Container>
      </div>

      <Container>
        {/* School Info Card */}
        <Card style={{
          border: 'none',
          borderRadius: '16px',
          boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
          marginBottom: '2rem',
          overflow: 'hidden'
        }}>
          <div style={{
            background: 'linear-gradient(135deg, #fef3e2 0%, #f5e6d3 100%)',
            padding: '2rem'
          }}>
            <Row className="align-items-center">
              <Col lg={8}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1rem' }}>
                  <FaSchool style={{ fontSize: '2.5rem', color: '#4f46e5' }} />
                  <h2 style={{
                    fontSize: '2rem',
                    fontWeight: 800,
                    color: '#1a1a2e',
                    margin: 0
                  }}>
                    {bookSet.school_name}
                  </h2>
                </div>
                <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
                  <Badge
                    bg="primary"
                    style={{
                      fontSize: '1.1rem',
                      padding: '0.75rem 1.5rem',
                      borderRadius: '8px',
                      fontWeight: 700,
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.5rem'
                    }}
                  >
                    <FaGraduationCap />
                    Class {bookSet.grade}
                  </Badge>
                  <Badge
                    bg="success"
                    style={{
                      fontSize: '1.1rem',
                      padding: '0.75rem 1.5rem',
                      borderRadius: '8px',
                      fontWeight: 700,
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.5rem'
                    }}
                  >
                    <FaBook />
                    {bookSet.items.length} Books
                  </Badge>
                  <Badge
                    bg="info"
                    style={{
                      fontSize: '1.1rem',
                      padding: '0.75rem 1.5rem',
                      borderRadius: '8px',
                      fontWeight: 700
                    }}
                  >
                    Created: {new Date(bookSet.created_at).toLocaleDateString()}
                  </Badge>
                </div>
              </Col>
              <Col lg={4} className="text-lg-end mt-3 mt-lg-0">
                <div style={{ marginBottom: '1rem' }}>
                  <div style={{ fontSize: '0.9rem', color: '#6b7280', marginBottom: '0.25rem' }}>
                    Total Price
                  </div>
                  <div style={{
                    fontSize: '3rem',
                    fontWeight: 800,
                    color: '#16a085',
                    lineHeight: 1
                  }}>
                    ₹{bookSet.total_price.toFixed(2)}
                  </div>
                </div>
                <Button
                  variant="primary"
                  size="lg"
                  onClick={handleAddSetToCart}
                  style={{
                    borderRadius: '12px',
                    padding: '1rem 2rem',
                    fontWeight: 700,
                    fontSize: '1.1rem',
                    background: 'linear-gradient(135deg, #16a085 0%, #0d7a68 100%)',
                    border: 'none',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '0.75rem',
                    boxShadow: '0 4px 12px rgba(22, 160, 133, 0.3)'
                  }}
                >
                  <FaShoppingCart style={{ fontSize: '1.2rem' }} />
                  Add Complete Set to Cart
                </Button>
              </Col>
            </Row>
          </div>
        </Card>

        {/* Books Table */}
        <Card style={{
          border: 'none',
          borderRadius: '16px',
          boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
          overflow: 'hidden'
        }}>
          <Card.Header style={{
            background: 'linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%)',
            color: 'white',
            padding: '1.5rem 2rem',
            border: 'none'
          }}>
            <h3 style={{
              fontSize: '1.5rem',
              fontWeight: 800,
              margin: 0,
              display: 'flex',
              alignItems: 'center',
              gap: '0.75rem'
            }}>
              📚 Books in this Set
            </h3>
          </Card.Header>
          <Card.Body style={{ padding: 0 }}>
            <div style={{ overflowX: 'auto' }}>
              <Table hover responsive style={{ marginBottom: 0 }}>
                <thead style={{
                  background: '#f8f9fa',
                  borderBottom: '2px solid #e5e7eb'
                }}>
                  <tr>
                    <th style={{
                      fontWeight: 700,
                      padding: '1.25rem',
                      fontSize: '1rem',
                      color: '#1a1a2e',
                      width: '60px',
                      textAlign: 'center'
                    }}>
                      #
                    </th>
                    <th style={{
                      fontWeight: 700,
                      padding: '1.25rem',
                      fontSize: '1rem',
                      color: '#1a1a2e',
                      minWidth: '250px'
                    }}>
                      Book Name
                    </th>
                    <th style={{
                      fontWeight: 700,
                      padding: '1.25rem',
                      fontSize: '1rem',
                      color: '#1a1a2e',
                      minWidth: '150px'
                    }}>
                      Subject
                    </th>
                    <th style={{
                      fontWeight: 700,
                      padding: '1.25rem',
                      fontSize: '1rem',
                      color: '#1a1a2e',
                      minWidth: '180px'
                    }}>
                      Author
                    </th>
                    <th style={{
                      fontWeight: 700,
                      padding: '1.25rem',
                      fontSize: '1rem',
                      color: '#1a1a2e',
                      minWidth: '180px'
                    }}>
                      Publisher
                    </th>
                    <th style={{
                      fontWeight: 700,
                      padding: '1.25rem',
                      fontSize: '1rem',
                      color: '#1a1a2e',
                      width: '100px',
                      textAlign: 'center'
                    }}>
                      Year
                    </th>
                    <th style={{
                      fontWeight: 700,
                      padding: '1.25rem',
                      fontSize: '1rem',
                      color: '#1a1a2e',
                      width: '120px',
                      textAlign: 'right'
                    }}>
                      Price
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {bookSet.items.map((item, index) => (
                    <tr key={index} style={{
                      background: index % 2 === 0 ? 'white' : '#f9fafb',
                      transition: 'background 0.2s ease'
                    }}>
                      <td style={{
                        fontWeight: 700,
                        padding: '1.25rem',
                        textAlign: 'center',
                        color: '#6b7280',
                        fontSize: '1rem'
                      }}>
                        {index + 1}
                      </td>
                      <td style={{
                        fontWeight: 600,
                        padding: '1.25rem',
                        color: '#1a1a2e',
                        fontSize: '1rem'
                      }}>
                        {item.title}
                      </td>
                      <td style={{
                        padding: '1.25rem',
                        color: '#4b5563',
                        fontSize: '0.95rem'
                      }}>
                        {item.subject_name || '-'}
                      </td>
                      <td style={{
                        padding: '1.25rem',
                        color: '#4b5563',
                        fontSize: '0.95rem'
                      }}>
                        {item.author}
                      </td>
                      <td style={{
                        padding: '1.25rem',
                        color: '#4b5563',
                        fontSize: '0.95rem'
                      }}>
                        {item.publisher}
                      </td>
                      <td style={{
                        padding: '1.25rem',
                        textAlign: 'center',
                        color: '#4b5563',
                        fontSize: '0.95rem'
                      }}>
                        {item.publication_year}
                      </td>
                      <td style={{
                        textAlign: 'right',
                        fontWeight: 700,
                        padding: '1.25rem',
                        color: '#16a085',
                        fontSize: '1.1rem'
                      }}>
                        ₹{item.price.toFixed(2)}
                      </td>
                    </tr>
                  ))}
                </tbody>
                <tfoot>
                  <tr style={{
                    background: 'linear-gradient(135deg, #fef3e2 0%, #f5e6d3 100%)',
                    borderTop: '3px solid #16a085'
                  }}>
                    <td
                      colSpan="6"
                      style={{
                        textAlign: 'right',
                        fontWeight: 800,
                        fontSize: '1.5rem',
                        padding: '1.5rem',
                        color: '#1a1a2e'
                      }}
                    >
                      Total Amount:
                    </td>
                    <td style={{
                      textAlign: 'right',
                      fontWeight: 800,
                      fontSize: '1.75rem',
                      color: '#16a085',
                      padding: '1.5rem'
                    }}>
                      ₹{bookSet.total_price.toFixed(2)}
                    </td>
                  </tr>
                </tfoot>
              </Table>
            </div>
          </Card.Body>
        </Card>

        {/* Action Buttons */}
        <div style={{
          marginTop: '2rem',
          display: 'flex',
          gap: '1rem',
          justifyContent: 'center',
          flexWrap: 'wrap'
        }}>
          <Button
            variant="outline-secondary"
            size="lg"
            onClick={() => navigate(-1)}
            style={{
              borderRadius: '12px',
              padding: '1rem 2rem',
              fontWeight: 700,
              fontSize: '1.1rem',
              border: '2px solid #6b7280',
              display: 'flex',
              alignItems: 'center',
              gap: '0.75rem'
            }}
          >
            <FaArrowLeft />
            Back to Book Sets
          </Button>
          <Button
            variant="primary"
            size="lg"
            onClick={handleAddSetToCart}
            style={{
              borderRadius: '12px',
              padding: '1rem 2rem',
              fontWeight: 700,
              fontSize: '1.1rem',
              background: 'linear-gradient(135deg, #16a085 0%, #0d7a68 100%)',
              border: 'none',
              display: 'flex',
              alignItems: 'center',
              gap: '0.75rem',
              boxShadow: '0 4px 12px rgba(22, 160, 133, 0.3)'
            }}
          >
            <FaShoppingCart style={{ fontSize: '1.2rem' }} />
            Add Complete Set to Cart
          </Button>
        </div>
      </Container>
    </div>
  );
};

export default BookSetDetails;
