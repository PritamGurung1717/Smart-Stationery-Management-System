import React, { useState, useEffect, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Container, Card, Form, Button, Spinner, Alert, Badge } from "react-bootstrap";
import { FaArrowLeft, FaPaperPlane, FaComments } from "react-icons/fa";
import axios from "axios";

const DonationChat = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState("");
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState("");
  const [donation, setDonation] = useState(null);
  const [currentUser, setCurrentUser] = useState(null);
  const messagesEndRef = useRef(null);

  useEffect(() => {
    const user = JSON.parse(localStorage.getItem("user"));
    setCurrentUser(user);
    fetchDonationAndMessages();
    
    // Poll for new messages every 5 seconds
    const interval = setInterval(fetchMessages, 5000);
    return () => clearInterval(interval);
  }, [id]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  const fetchDonationAndMessages = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem("token");
      const headers = { Authorization: `Bearer ${token}` };

      const [donationRes, messagesRes] = await Promise.all([
        axios.get(`http://localhost:5000/api/donations/${id}`, { headers }),
        axios.get(`http://localhost:5000/api/donations/${id}/chat`, { headers })
      ]);

      if (donationRes.data.success) {
        setDonation(donationRes.data.donation);
      }

      if (messagesRes.data.success) {
        setMessages(messagesRes.data.messages || []);
      }
    } catch (err) {
      console.error("Error fetching data:", err);
      setError(err.response?.data?.message || "Failed to load chat");
    } finally {
      setLoading(false);
    }
  };

  const fetchMessages = async () => {
    try {
      const token = localStorage.getItem("token");
      const headers = { Authorization: `Bearer ${token}` };
      const response = await axios.get(`http://localhost:5000/api/donations/${id}/chat`, { headers });

      if (response.data.success) {
        setMessages(response.data.messages || []);
      }
    } catch (err) {
      console.error("Error fetching messages:", err);
    }
  };

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!newMessage.trim()) return;

    try {
      setSending(true);
      const token = localStorage.getItem("token");
      const headers = { Authorization: `Bearer ${token}` };

      await axios.post(
        `http://localhost:5000/api/donations/${id}/chat`,
        { message: newMessage },
        { headers }
      );

      setNewMessage("");
      fetchMessages();
    } catch (err) {
      console.error("Error sending message:", err);
      alert(err.response?.data?.message || "Failed to send message");
    } finally {
      setSending(false);
    }
  };

  if (loading) {
    return (
      <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center" }}>
        <Spinner animation="border" />
      </div>
    );
  }

  if (error || !donation) {
    return (
      <div style={{ minHeight: "100vh", background: "linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%)", padding: "2rem" }}>
        <Container>
          <Alert variant="danger">{error || "Chat not available"}</Alert>
          <Button variant="primary" onClick={() => navigate("/donations")}>
            <FaArrowLeft style={{ marginRight: "0.5rem" }} />
            Back to Donations
          </Button>
        </Container>
      </div>
    );
  }

  return (
    <div style={{ minHeight: "100vh", background: "linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%)" }}>
      {/* Header */}
      <div style={{ background: "linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)", color: "white", padding: "1.5rem 0", boxShadow: "0 4px 6px rgba(0,0,0,0.1)" }}>
        <Container>
          <Button
            variant="link"
            onClick={() => navigate(`/donations/${id}`)}
            style={{ color: "white", textDecoration: "none", fontSize: "1rem", fontWeight: 600, padding: "0.5rem 1rem", marginBottom: "0.5rem", display: "inline-flex", alignItems: "center", gap: "0.5rem" }}
          >
            <FaArrowLeft /> Back to Donation
          </Button>
          <div style={{ display: "flex", alignItems: "center", gap: "1rem" }}>
            <FaComments style={{ fontSize: "2rem" }} />
            <div>
              <h2 style={{ fontSize: "1.5rem", fontWeight: 800, margin: 0 }}>{donation.title}</h2>
              <Badge bg="light" text="dark" style={{ marginTop: "0.25rem" }}>
                {donation.status}
              </Badge>
            </div>
          </div>
        </Container>
      </div>

      <Container style={{ maxWidth: "900px", paddingTop: "2rem", paddingBottom: "2rem" }}>
        <Card style={{ border: "none", borderRadius: "16px", boxShadow: "0 4px 12px rgba(0,0,0,0.1)", height: "calc(100vh - 250px)", display: "flex", flexDirection: "column" }}>
          {/* Messages */}
          <div style={{ flex: 1, overflowY: "auto", padding: "1.5rem", background: "#f9fafb" }}>
            {messages.length === 0 ? (
              <div className="text-center text-muted py-5">
                <FaComments style={{ fontSize: "3rem", marginBottom: "1rem", opacity: 0.5 }} />
                <p>No messages yet. Start the conversation!</p>
              </div>
            ) : (
              messages.map((msg) => {
                const isOwn = msg.sender_id === currentUser?.id;
                return (
                  <div
                    key={msg.id}
                    style={{
                      display: "flex",
                      justifyContent: isOwn ? "flex-end" : "flex-start",
                      marginBottom: "1rem"
                    }}
                  >
                    <div
                      style={{
                        maxWidth: "70%",
                        padding: "0.75rem 1rem",
                        borderRadius: "12px",
                        background: isOwn ? "linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)" : "white",
                        color: isOwn ? "white" : "#1f2937",
                        boxShadow: "0 2px 4px rgba(0,0,0,0.1)"
                      }}
                    >
                      <p style={{ margin: 0, wordBreak: "break-word" }}>{msg.message}</p>
                      <div style={{ fontSize: "0.75rem", marginTop: "0.25rem", opacity: 0.8 }}>
                        {new Date(msg.created_at).toLocaleTimeString()}
                      </div>
                    </div>
                  </div>
                );
              })
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Input */}
          <div style={{ padding: "1.5rem", borderTop: "1px solid #e5e7eb", background: "white" }}>
            <Form onSubmit={handleSendMessage}>
              <div style={{ display: "flex", gap: "1rem" }}>
                <Form.Control
                  type="text"
                  placeholder="Type your message..."
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  disabled={sending}
                  style={{ borderRadius: "50px", padding: "0.75rem 1.5rem", border: "2px solid #e5e7eb" }}
                />
                <Button
                  type="submit"
                  disabled={sending || !newMessage.trim()}
                  style={{
                    borderRadius: "50px",
                    padding: "0.75rem 2rem",
                    fontWeight: 600,
                    background: "linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)",
                    border: "none",
                    display: "flex",
                    alignItems: "center",
                    gap: "0.5rem"
                  }}
                >
                  <FaPaperPlane />
                  {sending ? "Sending..." : "Send"}
                </Button>
              </div>
            </Form>
          </div>
        </Card>
      </Container>
    </div>
  );
};

export default DonationChat;
