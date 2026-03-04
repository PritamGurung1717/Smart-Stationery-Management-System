import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Container, Row, Col, Card, Button, Form, Table, Badge, Alert, Spinner } from "react-bootstrap";
import { FaPlus, FaTrash, FaArrowLeft, FaBook, FaCheckCircle } from "react-icons/fa";
import axios from "axios";

const InstituteBookSetRequest = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const [formData, setFormData] = useState({
    school_name: "",
    grade: "",
  });

  const [books, setBooks] = useState([
    {
      subject_name: "",
      book_title: "",
      author: "",
      publisher: "",
      publication_year: new Date().getFullYear(),
      isbn: "",
      estimated_price: "",
    },
  ]);

  const [myRequests, setMyRequests] = useState([]);
  const [loadingRequests, setLoadingRequests] = useState(true);

  useEffect(() => {
    fetchMyRequests();
  }, []);

  const fetchMyRequests = async () => {
    try {
      setLoadingRequests(true);
      const token = localStorage.getItem("token");
      const response = await axios.get(
        "http://localhost:5000/api/institute/book-set-request",
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setMyRequests(response.data.requests || []);
    } catch (err) {
      console.error("Failed to fetch requests:", err);
    } finally {
      setLoadingRequests(false);
    }
  };

  const handleInputChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleBookChange = (index, field, value) => {
    const updatedBooks = [...books];
    updatedBooks[index][field] = value;
    setBooks(updatedBooks);
  };

  const addBook = () => {
    setBooks([
      ...books,
      {
        subject_name: "",
        book_title: "",
        author: "",
        publisher: "",
        publication_year: new Date().getFullYear(),
        isbn: "",
        estimated_price: "",
      },
    ]);
  };

  const removeBook = (index) => {
    if (books.length === 1) {
      setError("At least one book is required");
      return;
    }
    const updatedBooks = books.filter((_, i) => i !== index);
    setBooks(updatedBooks);
  };

  const validateForm = () => {
    if (!formData.school_name.trim()) {
      setError("School name is required");
      return false;
    }

    if (!formData.grade.trim()) {
      setError("Grade is required");
      return false;
    }

    for (let i = 0; i < books.length; i++) {
      const book = books[i];
      if (!book.subject_name.trim()) {
        setError(`Book ${i + 1}: Subject name is required`);
        return false;
      }
      if (!book.book_title.trim()) {
        setError(`Book ${i + 1}: Book title is required`);
        return false;
      }
      if (!book.author.trim()) {
        setError(`Book ${i + 1}: Author is required`);
        return false;
      }
      if (!book.publisher.trim()) {
        setError(`Book ${i + 1}: Publisher is required`);
        return false;
      }
      if (!book.publication_year || book.publication_year < 1900 || book.publication_year > new Date().getFullYear() + 1) {
        setError(`Book ${i + 1}: Invalid publication year`);
        return false;
      }
      if (!book.estimated_price || parseFloat(book.estimated_price) <= 0) {
        setError(`Book ${i + 1}: Valid price is required`);
        return false;
      }
      if (book.isbn && !/^[\d-\s]{10,17}$/.test(book.isbn)) {
        setError(`Book ${i + 1}: Invalid ISBN format`);
        return false;
      }
    }

    return true;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");

    if (!validateForm()) {
      return;
    }

    try {
      setLoading(true);
      const token = localStorage.getItem("token");

      const requestData = {
        school_name: formData.school_name.trim(),
        grade: formData.grade.trim(),
        items: books.map(book => ({
          subject_name: book.subject_name.trim(),
          book_title: book.book_title.trim(),
          author: book.author.trim(),
          publisher: book.publisher.trim(),
          publication_year: parseInt(book.publication_year),
          isbn: book.isbn.trim(),
          estimated_price: parseFloat(book.estimated_price),
        })),
      };

      await axios.post(
        "http://localhost:5000/api/institute/book-set-request",
        requestData,
        { headers: { Authorization: `Bearer ${token}` } }
      );

      setSuccess("Book set request submitted successfully! Waiting for admin approval.");
      
      // Reset form
      setFormData({ school_name: "", grade: "" });
      setBooks([
        {
          subject_name: "",
          book_title: "",
          author: "",
          publisher: "",
          publication_year: new Date().getFullYear(),
          isbn: "",
          estimated_price: "",
        },
      ]);

      // Refresh requests list
      fetchMyRequests();

      // Scroll to top
      window.scrollTo(0, 0);

    } catch (err) {
      console.error("Submit error:", err);
      setError(err.response?.data?.message || "Failed to submit request");
    } finally {
      setLoading(false);
    }
  };

  const getTotalEstimatedPrice = () => {
    return books.reduce((total, book) => {
      const price = parseFloat(book.estimated_price) || 0;
      return total + price;
    }, 0);
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case "pending":
        return <Badge bg="warning">Pending</Badge>;
      case "approved":
        return <Badge bg="success">Approved</Badge>;
      case "rejected":
        return <Badge bg="danger">Rejected</Badge>;
      default:
        return <Badge bg="secondary">{status}</Badge>;
    }
  };

  return (
    <Container className="py-4">
      <Button variant="outline-secondary" onClick={() => navigate("/institute-dashboard")} className="mb-3">
        <FaArrowLeft className="me-2" />
        Back to Dashboard
      </Button>

      <h2 className="mb-4">
        <FaBook className="me-2" />
        Book Set Request
      </h2>

      {error && (
        <Alert variant="danger" dismissible onClose={() => setError("")}>
          {error}
        </Alert>
      )}

      {success && (
        <Alert variant="success" dismissible onClose={() => setSuccess("")}>
          <FaCheckCircle className="me-2" />
          {success}
        </Alert>
      )}

      {/* Request Form */}
      <Card className="mb-4 shadow-sm">
        <Card.Header className="bg-primary text-white">
          <h5 className="mb-0">Submit New Book Set Request</h5>
        </Card.Header>
        <Card.Body>
          <Form onSubmit={handleSubmit}>
            <Row className="mb-3">
              <Col md={6}>
                <Form.Group>
                  <Form.Label>School Name *</Form.Label>
                  <Form.Control
                    type="text"
                    name="school_name"
                    value={formData.school_name}
                    onChange={handleInputChange}
                    placeholder="Enter school name"
                    required
                  />
                </Form.Group>
              </Col>
              <Col md={6}>
                <Form.Group>
                  <Form.Label>Grade *</Form.Label>
                  <Form.Control
                    type="text"
                    name="grade"
                    value={formData.grade}
                    onChange={handleInputChange}
                    placeholder="e.g., 5, 10, 12"
                    required
                  />
                </Form.Group>
              </Col>
            </Row>

            <hr />

            <div className="d-flex justify-content-between align-items-center mb-3">
              <h5>Books in Set</h5>
              <Button variant="success" size="sm" onClick={addBook}>
                <FaPlus className="me-1" />
                Add Book
              </Button>
            </div>

            <div style={{ overflowX: "auto" }}>
              <Table bordered hover responsive>
                <thead className="table-light">
                  <tr>
                    <th>#</th>
                    <th>Subject *</th>
                    <th>Book Title *</th>
                    <th>Author *</th>
                    <th>Publisher *</th>
                    <th>Year *</th>
                    <th>ISBN</th>
                    <th>Price (₹) *</th>
                    <th>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {books.map((book, index) => (
                    <tr key={index}>
                      <td>{index + 1}</td>
                      <td>
                        <Form.Control
                          type="text"
                          value={book.subject_name}
                          onChange={(e) => handleBookChange(index, "subject_name", e.target.value)}
                          placeholder="Math, Science..."
                          size="sm"
                          required
                        />
                      </td>
                      <td>
                        <Form.Control
                          type="text"
                          value={book.book_title}
                          onChange={(e) => handleBookChange(index, "book_title", e.target.value)}
                          placeholder="Book title"
                          size="sm"
                          required
                        />
                      </td>
                      <td>
                        <Form.Control
                          type="text"
                          value={book.author}
                          onChange={(e) => handleBookChange(index, "author", e.target.value)}
                          placeholder="Author name"
                          size="sm"
                          required
                        />
                      </td>
                      <td>
                        <Form.Control
                          type="text"
                          value={book.publisher}
                          onChange={(e) => handleBookChange(index, "publisher", e.target.value)}
                          placeholder="Publisher"
                          size="sm"
                          required
                        />
                      </td>
                      <td>
                        <Form.Control
                          type="number"
                          value={book.publication_year}
                          onChange={(e) => handleBookChange(index, "publication_year", e.target.value)}
                          min="1900"
                          max={new Date().getFullYear() + 1}
                          size="sm"
                          required
                          style={{ width: "100px" }}
                        />
                      </td>
                      <td>
                        <Form.Control
                          type="text"
                          value={book.isbn}
                          onChange={(e) => handleBookChange(index, "isbn", e.target.value)}
                          placeholder="ISBN (optional)"
                          size="sm"
                          style={{ width: "150px" }}
                        />
                      </td>
                      <td>
                        <Form.Control
                          type="number"
                          value={book.estimated_price}
                          onChange={(e) => handleBookChange(index, "estimated_price", e.target.value)}
                          placeholder="0.00"
                          min="0"
                          step="0.01"
                          size="sm"
                          required
                          style={{ width: "100px" }}
                        />
                      </td>
                      <td>
                        <Button
                          variant="danger"
                          size="sm"
                          onClick={() => removeBook(index)}
                          disabled={books.length === 1}
                        >
                          <FaTrash />
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
                <tfoot>
                  <tr>
                    <td colSpan="7" className="text-end">
                      <strong>Total Estimated Price:</strong>
                    </td>
                    <td colSpan="2">
                      <strong>₹{getTotalEstimatedPrice().toFixed(2)}</strong>
                    </td>
                  </tr>
                </tfoot>
              </Table>
            </div>

            <div className="text-end mt-3">
              <Button variant="primary" type="submit" disabled={loading} size="lg">
                {loading ? (
                  <>
                    <Spinner size="sm" className="me-2" />
                    Submitting...
                  </>
                ) : (
                  "Submit Request"
                )}
              </Button>
            </div>
          </Form>
        </Card.Body>
      </Card>

      {/* My Requests */}
      <Card className="shadow-sm">
        <Card.Header className="bg-secondary text-white">
          <h5 className="mb-0">My Book Set Requests</h5>
        </Card.Header>
        <Card.Body>
          {loadingRequests ? (
            <div className="text-center py-4">
              <Spinner animation="border" />
              <p className="mt-2">Loading requests...</p>
            </div>
          ) : myRequests.length === 0 ? (
            <Alert variant="info">No requests submitted yet.</Alert>
          ) : (
            <Table striped bordered hover responsive>
              <thead className="table-dark">
                <tr>
                  <th>ID</th>
                  <th>School</th>
                  <th>Grade</th>
                  <th>Books</th>
                  <th>Total Price</th>
                  <th>Status</th>
                  <th>Submitted</th>
                  <th>Remark</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {myRequests.map((request) => (
                  <tr key={request.id}>
                    <td>{request.id}</td>
                    <td>{request.school_name}</td>
                    <td>{request.grade}</td>
                    <td>{request.item_count}</td>
                    <td>₹{request.total_estimated_price?.toFixed(2)}</td>
                    <td>{getStatusBadge(request.status)}</td>
                    <td>{new Date(request.created_at).toLocaleDateString()}</td>
                    <td>
                      {request.admin_remark ? (
                        <small className="text-danger">{request.admin_remark}</small>
                      ) : (
                        "-"
                      )}
                    </td>
                    <td>
                      <Button
                        variant="info"
                        size="sm"
                        onClick={() => navigate(`/institute/book-set-request/${request.id}`)}
                      >
                        View
                      </Button>
                      {request.status === "rejected" && (
                        <Button
                          variant="warning"
                          size="sm"
                          className="ms-2"
                          onClick={() => navigate(`/institute/book-set-request/${request.id}/edit`)}
                        >
                          Edit
                        </Button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </Table>
          )}
        </Card.Body>
      </Card>
    </Container>
  );
};

export default InstituteBookSetRequest;
