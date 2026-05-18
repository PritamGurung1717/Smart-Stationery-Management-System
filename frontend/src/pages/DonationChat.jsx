import { useState, useEffect, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { FaChevronLeft, FaPaperPlane, FaComments, FaPaperclip, FaFileAlt, FaFileCsv } from "react-icons/fa";
import axios from "axios";
import SharedLayout from "../components/SharedLayout.jsx";
import toast from "../utils/toast.js";

const API = "http://localhost:5000/api";
const authH = () => ({ Authorization: `Bearer ${localStorage.getItem("token")}` });

/* ─── File Preview Component ──────────────────────────────────── */
const FilePreview = ({ attachment_url, attachment_type, attachment_name }) => {
  if (!attachment_url) return null;
  
  const url = attachment_url.startsWith("http") ? attachment_url : `http://localhost:5000${attachment_url}`;
  
  if (attachment_type === "image") {
    return (
      <a href={url} target="_blank" rel="noreferrer">
        <img src={url} alt={attachment_name || "image"} 
          style={{ maxWidth: 200, maxHeight: 150, borderRadius: 8, display: "block", marginTop: 6 }} />
      </a>
    );
  }
  
  const Icon = attachment_type === "csv" ? FaFileCsv : FaFileAlt;
  return (
    <a href={url} target="_blank" rel="noreferrer" download={attachment_name}
      style={{ 
        display: "flex", alignItems: "center", gap: 8, color: "inherit", textDecoration: "none",
        background: "rgba(255,255,255,0.15)", borderRadius: 8, padding: "6px 10px", marginTop: 6,
        fontSize: "0.85rem"
      }}>
      <Icon size={16} />
      <span style={{ wordBreak: "break-all" }}>{attachment_name || "Download file"}</span>
    </a>
  );
};

const DonationChat = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState("");
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [donation, setDonation] = useState(null);
  const [error, setError] = useState("");
  const currentUser = JSON.parse(localStorage.getItem("user") || "null");
  const bottomRef = useRef(null);
  const fileInputRef = useRef(null);

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
    } catch (err) { setError(err.response?.data?.message || "Failed to load chat"); }
    finally { setLoading(false); }
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
    } catch (err) { toast.error(err.response?.data?.message || "Failed to send"); }
    finally { setSending(false); }
  };

  const handleFileUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      toast.warning("File too large. Max 5 MB.");
      return;
    }

    setUploading(true);
    try {
      const fd = new FormData();
      fd.append("attachment", file);
      if (newMessage.trim()) {
        fd.append("message", newMessage.trim());
      } else {
        fd.append("message", "📎 File attachment");
      }

      await axios.post(`${API}/donations/${id}/chat`, fd, {
        headers: { ...authH(), "Content-Type": "multipart/form-data" },
      });
      
      setNewMessage("");
      fetchMessages();
    } catch (err) {
      toast.error(err.response?.data?.message || "Upload failed");
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  if (loading) return (
    <SharedLayout>
      <div className="d-flex align-items-center justify-content-center" style={{ minHeight: "60vh" }}>
        <div className="spinner-border text-dark" style={{ width: 40, height: 40, borderWidth: 3 }} role="status">
          <span className="visually-hidden">Loading…</span>
        </div>
      </div>
    </SharedLayout>
  );

  if (error || !donation) return (
    <SharedLayout>
      <div style={{ maxWidth: 600, margin: "4rem auto" }} className="px-3 text-center">
        <p className="text-danger mb-4">{error || "Chat not available"}</p>
        <button onClick={() => navigate("/donations")} className="btn btn-dark fw-bold">Back to Donations</button>
      </div>
    </SharedLayout>
  );

  return (
    <SharedLayout activeLink="Donate">
      <div style={{ maxWidth: 860, margin: "0 auto" }} className="px-3 py-4">

        <button onClick={() => navigate(`/donations/${id}`)}
          className="btn btn-link p-0 text-secondary small d-inline-flex align-items-center gap-1 mb-4 text-decoration-none">
          <FaChevronLeft style={{ fontSize: "0.75rem" }} /> Back to Donation
        </button>

        <div className="d-flex align-items-center gap-3 mb-4">
          <FaComments className="text-primary" style={{ fontSize: "1.25rem" }} />
          <div>
            <h2 className="fw-bold mb-0" style={{ fontSize: "1.25rem" }}>{donation.title}</h2>
            <span className={`fw-bold text-capitalize small ${donation.status === "reserved" ? "text-warning" : "text-success"}`}>
              {donation.status}
            </span>
          </div>
        </div>

        {/* Chat box */}
        <div className="border rounded-3 overflow-hidden d-flex flex-column" style={{ height: "calc(100vh - 340px)", minHeight: 400 }}>
          {/* Messages */}
          <div className="flex-grow-1 overflow-auto p-4 bg-light d-flex flex-column gap-3">
            {messages.length === 0 ? (
              <div className="text-center py-5 text-muted">
                <FaComments style={{ fontSize: "2.5rem", opacity: 0.4 }} className="mb-3 d-block mx-auto" />
                <p className="mb-0">No messages yet. Start the conversation!</p>
              </div>
            ) : messages.map(msg => {
              const isOwn = msg.sender_id === currentUser?.id;
              return (
                <div key={msg.id} className={`d-flex ${isOwn ? "justify-content-end" : "justify-content-start"}`}>
                  <div className="px-3 py-2 rounded-3 shadow-sm" style={{ maxWidth: "70%", background: isOwn ? "#111" : "#fff", color: isOwn ? "#fff" : "#1f2937" }}>
                    {msg.message && <p className="mb-1 small" style={{ wordBreak: "break-word" }}>{msg.message}</p>}
                    {msg.attachment_url && (
                      <FilePreview 
                        attachment_url={msg.attachment_url} 
                        attachment_type={msg.attachment_type} 
                        attachment_name={msg.attachment_name} 
                      />
                    )}
                    <div className={`text-end ${isOwn ? "text-white-50" : "text-muted"}`} style={{ fontSize: "0.7rem" }}>
                      {new Date(msg.created_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                    </div>
                  </div>
                </div>
              );
            })}
            <div ref={bottomRef} />
          </div>

          {/* Input */}
          <form onSubmit={handleSend} className="d-flex gap-2 p-3 border-top bg-white align-items-end">
            <input type="file" ref={fileInputRef} onChange={handleFileUpload} style={{ display: "none" }}
              accept=".jpg,.jpeg,.png,.gif,.webp,.pdf,.csv" />
            
            <button type="button" onClick={() => fileInputRef.current?.click()} disabled={uploading}
              className="btn btn-outline-secondary rounded-circle d-flex align-items-center justify-content-center"
              style={{ width: 40, height: 40, flexShrink: 0 }}
              title="Attach file (images, PDF, CSV — max 5MB)">
              {uploading ? <span style={{ fontSize: "0.7rem" }}>...</span> : <FaPaperclip size={16} />}
            </button>
            
            <input value={newMessage} onChange={e => setNewMessage(e.target.value)} 
              disabled={sending || uploading}
              placeholder="Type your message…"
              className="form-control rounded-pill" />
              
            <button type="submit" disabled={sending || uploading || !newMessage.trim()}
              className={`btn btn-dark rounded-pill fw-bold d-flex align-items-center gap-2 ${(sending || uploading) ? "opacity-75" : ""}`}
              style={{ flexShrink: 0 }}>
              <FaPaperPlane style={{ fontSize: "0.85rem" }} /> 
              {sending ? "Sending..." : uploading ? "Uploading..." : "Send"}
            </button>
          </form>
        </div>
      </div>
    </SharedLayout>
  );
};

export default DonationChat;
