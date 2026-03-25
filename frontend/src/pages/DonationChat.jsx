import { useState, useEffect, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { FaChevronLeft, FaPaperPlane, FaComments } from "react-icons/fa";
import axios from "axios";
import SharedLayout from "../components/SharedLayout.jsx";

const API = "http://localhost:5000/api";
const authH = () => ({ Authorization: `Bearer ${localStorage.getItem("token")}` });

const DonationChat = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState("");
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [donation, setDonation] = useState(null);
  const [error, setError] = useState("");
  const currentUser = JSON.parse(localStorage.getItem("user") || "null");
  const bottomRef = useRef(null);

  useEffect(() => {
    fetchAll();
    const interval = setInterval(fetchMessages, 5000);
    return () => clearInterval(interval);
  }, [id]);

  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: "smooth" }); }, [messages]);

  const fetchAll = async () => {
    try {
      setLoading(true);
      const [dRes, mRes] = await Promise.all([
        axios.get(`${API}/donations/${id}`, { headers: authH() }),
        axios.get(`${API}/donations/${id}/chat`, { headers: authH() }),
      ]);
      if (dRes.data.success) setDonation(dRes.data.donation);
      if (mRes.data.success) setMessages(mRes.data.messages || []);
    } catch (err) {
      setError(err.response?.data?.message || "Failed to load chat");
    } finally { setLoading(false); }
  };

  const fetchMessages = async () => {
    try {
      const r = await axios.get(`${API}/donations/${id}/chat`, { headers: authH() });
      if (r.data.success) setMessages(r.data.messages || []);
    } catch {}
  };

  const handleSend = async (e) => {
    e.preventDefault();
    if (!newMessage.trim()) return;
    try {
      setSending(true);
      await axios.post(`${API}/donations/${id}/chat`, { message: newMessage }, { headers: authH() });
      setNewMessage("");
      fetchMessages();
    } catch (err) { alert(err.response?.data?.message || "Failed to send"); }
    finally { setSending(false); }
  };

  if (loading) return (
    <SharedLayout>
      <div style={{ minHeight: "60vh", display: "flex", alignItems: "center", justifyContent: "center" }}>
        <div style={{ width: 40, height: 40, border: "3px solid #e5e7eb", borderTopColor: "#111", borderRadius: "50%", animation: "spin 0.8s linear infinite" }} />
        <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
      </div>
    </SharedLayout>
  );

  if (error || !donation) return (
    <SharedLayout>
      <div style={{ maxWidth: 600, margin: "4rem auto", padding: "0 1.5rem", textAlign: "center" }}>
        <p style={{ color: "#ef4444", marginBottom: "1.5rem" }}>{error || "Chat not available"}</p>
        <button onClick={() => navigate("/donations")} style={{ background: "#111", color: "#fff", border: "none", borderRadius: 6, padding: "0.75rem 1.5rem", fontWeight: 700, cursor: "pointer" }}>Back to Donations</button>
      </div>
    </SharedLayout>
  );

  return (
    <SharedLayout activeLink="Donate">
      <div style={{ maxWidth: 860, margin: "0 auto", padding: "2rem 1.5rem" }}>
        {/* Back + title */}
        <button onClick={() => navigate(`/donations/${id}`)}
          style={{ background: "none", border: "none", cursor: "pointer", color: "#6b7280", fontSize: "0.9rem", display: "flex", alignItems: "center", gap: "0.4rem", marginBottom: "1.5rem", padding: 0 }}>
          <FaChevronLeft style={{ fontSize: "0.75rem" }} /> Back to Donation
        </button>

        <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", marginBottom: "1.5rem" }}>
          <FaComments style={{ fontSize: "1.25rem", color: "#3b82f6" }} />
          <div>
            <h2 style={{ margin: 0, fontWeight: 800, fontSize: "1.25rem", color: "#111" }}>{donation.title}</h2>
            <span style={{ fontSize: "0.75rem", fontWeight: 700, color: donation.status === "reserved" ? "#f59e0b" : "#16a34a", textTransform: "capitalize" }}>{donation.status}</span>
          </div>
        </div>

        {/* Chat box */}
        <div style={{ border: "1px solid #e5e7eb", borderRadius: 12, overflow: "hidden", display: "flex", flexDirection: "column", height: "calc(100vh - 340px)", minHeight: 400 }}>
          {/* Messages */}
          <div style={{ flex: 1, overflowY: "auto", padding: "1.5rem", background: "#f9fafb", display: "flex", flexDirection: "column", gap: "0.75rem" }}>
            {messages.length === 0 ? (
              <div style={{ textAlign: "center", padding: "3rem 0", color: "#9ca3af" }}>
                <FaComments style={{ fontSize: "2.5rem", marginBottom: "0.75rem", opacity: 0.4 }} />
                <p style={{ margin: 0 }}>No messages yet. Start the conversation!</p>
              </div>
            ) : messages.map(msg => {
              const isOwn = msg.sender_id === currentUser?.id;
              return (
                <div key={msg.id} style={{ display: "flex", justifyContent: isOwn ? "flex-end" : "flex-start" }}>
                  <div style={{ maxWidth: "70%", padding: "0.75rem 1rem", borderRadius: 12, background: isOwn ? "#111" : "#fff", color: isOwn ? "#fff" : "#1f2937", boxShadow: "0 2px 4px rgba(0,0,0,0.08)" }}>
                    <p style={{ margin: 0, wordBreak: "break-word", fontSize: "0.9rem" }}>{msg.message}</p>
                    <div style={{ fontSize: "0.7rem", marginTop: "0.3rem", opacity: 0.65, textAlign: isOwn ? "right" : "left" }}>
                      {new Date(msg.created_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                    </div>
                  </div>
                </div>
              );
            })}
            <div ref={bottomRef} />
          </div>

          {/* Input */}
          <form onSubmit={handleSend} style={{ padding: "1rem 1.25rem", borderTop: "1px solid #e5e7eb", background: "#fff", display: "flex", gap: "0.75rem" }}>
            <input value={newMessage} onChange={e => setNewMessage(e.target.value)} disabled={sending}
              placeholder="Type your message…"
              style={{ flex: 1, border: "1px solid #e5e7eb", borderRadius: 50, padding: "0.65rem 1.25rem", fontSize: "0.9rem", outline: "none" }} />
            <button type="submit" disabled={sending || !newMessage.trim()}
              style={{ background: "#111", color: "#fff", border: "none", borderRadius: 50, padding: "0.65rem 1.5rem", fontWeight: 700, cursor: sending ? "not-allowed" : "pointer", display: "flex", alignItems: "center", gap: "0.4rem", opacity: sending ? 0.7 : 1 }}>
              <FaPaperPlane style={{ fontSize: "0.85rem" }} /> {sending ? "…" : "Send"}
            </button>
          </form>
        </div>
      </div>
    </SharedLayout>
  );
};

export default DonationChat;
