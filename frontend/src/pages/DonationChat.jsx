import { useState, useEffect, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { FaChevronLeft, FaPaperPlane, FaComments, FaPaperclip, FaFileAlt, FaFileCsv } from "react-icons/fa";
import axios from "axios";
import SharedLayout from "../components/SharedLayout.jsx";
import toast from "../utils/toast.js";
import "../styles/landing.css";

const API = "http://localhost:5000/api";
const authH = () => ({ Authorization: `Bearer ${localStorage.getItem("token")}` });

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
  const fileInputRef = useRef(null);
  const messagesContainerRef = useRef(null);
  const initialScrollDoneRef = useRef(false);

  useEffect(() => {
    initialScrollDoneRef.current = false;
    fetchAll();
    const interval = setInterval(() => fetchMessages(true), 5000);
    return () => clearInterval(interval);
  }, [id]);

  useEffect(() => {
    if (!loading && messagesContainerRef.current && !initialScrollDoneRef.current) {
      messagesContainerRef.current.scrollTop = 0;
      initialScrollDoneRef.current = true;
    }
  }, [loading, messages]);

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

  const fetchMessages = async (preserveScroll = true) => {
    try {
      const el = messagesContainerRef.current;
      const prevScrollTop = preserveScroll && el ? el.scrollTop : 0;

      const r = await axios.get(`${API}/donations/${id}/chat`, { headers: authH() });
      if (r.data.success) {
        setMessages(r.data.messages || []);
        if (preserveScroll && el) {
          requestAnimationFrame(() => {
            if (messagesContainerRef.current) {
              messagesContainerRef.current.scrollTop = prevScrollTop;
            }
          });
        }
      }
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
      fd.append("message", newMessage.trim() || "📎 File attachment");

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
      <section style={{ background: "#F3F4F6", minHeight: "60vh" }}>
        <div className="ss-page-inner text-center py-5">
          <div className="spinner-border mb-3" style={{ width: 40, height: 40, borderWidth: 3, color: "#1D4ED8" }} role="status" />
          <p className="mb-0" style={{ color: "#4B5563" }}>Loading chat…</p>
        </div>
      </section>
    </SharedLayout>
  );

  if (error || !donation) return (
    <SharedLayout>
      <section style={{ background: "#F3F4F6", minHeight: "60vh" }}>
        <div className="ss-page-inner text-center" style={{ maxWidth: 600, paddingTop: "4rem" }}>
          <p className="text-danger mb-4">{error || "Chat not available"}</p>
          <button type="button" onClick={() => navigate("/donations")} className="landing-btn-primary border-0">Back to Donations</button>
        </div>
      </section>
    </SharedLayout>
  );

  return (
    <SharedLayout activeLink="Donate">
      <section style={{ background: "#F3F4F6", minHeight: "60vh" }}>
        <div className="ss-page-inner">
          <button type="button" onClick={() => navigate(`/donations/${id}`)} className="ss-back-link">
            <FaChevronLeft style={{ fontSize: "0.75rem" }} /> Back to Donation
          </button>

          <div className="d-flex align-items-center gap-3 mb-4">
            <div className="rounded-circle d-flex align-items-center justify-content-center"
              style={{ width: 44, height: 44, background: "#EFF6FF", color: "#1D4ED8" }}>
              <FaComments style={{ fontSize: "1.1rem" }} />
            </div>
            <div>
              <h2 className="fw-bold mb-0 ss-page-title" style={{ fontSize: "1.35rem" }}>{donation.title}</h2>
              <span className={`fw-bold text-capitalize small ${donation.status === "reserved" ? "text-warning" : "text-success"}`}>
                {donation.status}
              </span>
            </div>
          </div>

          <div className="ss-chat-panel d-flex flex-column" style={{ height: "calc(100vh - 340px)", minHeight: 400 }}>
            <div ref={messagesContainerRef} className="flex-grow-1 overflow-auto p-4 ss-chat-messages d-flex flex-column gap-3">
              {messages.length === 0 ? (
                <div className="text-center py-5" style={{ color: "#4B5563" }}>
                  <FaComments style={{ fontSize: "2.5rem", opacity: 0.35, color: "#1D4ED8" }} className="mb-3 d-block mx-auto" />
                  <p className="mb-0">No messages yet. Start the conversation!</p>
                </div>
              ) : messages.map(msg => {
                const isOwn = msg.sender_id === currentUser?.id;
                return (
                  <div key={msg.id} className={`d-flex ${isOwn ? "justify-content-end" : "justify-content-start"}`}>
                    <div className={`px-3 py-2 rounded-3 shadow-sm ${isOwn ? "ss-chat-bubble-own" : "ss-chat-bubble-other"}`}
                      style={{ maxWidth: "70%" }}>
                      {msg.message && <p className="mb-1 small" style={{ wordBreak: "break-word" }}>{msg.message}</p>}
                      {msg.attachment_url && (
                        <FilePreview
                          attachment_url={msg.attachment_url}
                          attachment_type={msg.attachment_type}
                          attachment_name={msg.attachment_name}
                        />
                      )}
                      <div className={`text-end ${isOwn ? "text-white-50" : ""}`} style={{ fontSize: "0.7rem", color: isOwn ? undefined : "#9CA3AF" }}>
                        {new Date(msg.created_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            <form onSubmit={handleSend} className="d-flex gap-2 p-3 border-top bg-white align-items-end" style={{ borderColor: "#E5E7EB" }}>
              <input type="file" ref={fileInputRef} onChange={handleFileUpload} style={{ display: "none" }}
                accept=".jpg,.jpeg,.png,.gif,.webp,.pdf,.csv" />

              <button type="button" onClick={() => fileInputRef.current?.click()} disabled={uploading}
                className="ss-btn-outline rounded-circle d-flex align-items-center justify-content-center"
                style={{ width: 40, height: 40, flexShrink: 0 }}
                title="Attach file (images, PDF, CSV — max 5MB)">
                {uploading ? <span style={{ fontSize: "0.7rem" }}>...</span> : <FaPaperclip size={16} />}
              </button>

              <input value={newMessage} onChange={e => setNewMessage(e.target.value)}
                disabled={sending || uploading}
                placeholder="Type your message…"
                className="form-control rounded-pill"
                style={{ borderColor: "#E5E7EB" }} />

              <button type="submit" disabled={sending || uploading || !newMessage.trim()}
                className={`landing-btn-primary border-0 rounded-pill fw-bold d-flex align-items-center gap-2 ${(sending || uploading) ? "opacity-75" : ""}`}
                style={{ flexShrink: 0 }}>
                <FaPaperPlane style={{ fontSize: "0.85rem" }} />
                {sending ? "Sending..." : uploading ? "Uploading..." : "Send"}
              </button>
            </form>
          </div>
        </div>
      </section>
    </SharedLayout>
  );
};

export default DonationChat;
