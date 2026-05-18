// frontend/src/pages/ChatPage.jsx
import { useState, useEffect, useRef, useCallback } from "react";
import axios from "axios";
import { FaPaperPlane, FaPaperclip, FaSearch, FaTimes, FaFileAlt, FaFileCsv, FaCircle, FaPlus } from "react-icons/fa";
import { connectSocket } from "../services/socketService";
import toast from "../utils/toast.js";

const API = "http://localhost:5000/api";
const authH = () => ({ Authorization: `Bearer ${localStorage.getItem("token")}` });

/* ─── Helpers ───────────────────────────────────────────────── */
const fmtTime = (d) => {
  const dt = new Date(d);
  return dt.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
};
const fmtDate = (d) => {
  const dt = new Date(d);
  const today = new Date();
  if (dt.toDateString() === today.toDateString()) return "Today";
  const yesterday = new Date(today); yesterday.setDate(today.getDate() - 1);
  if (dt.toDateString() === yesterday.toDateString()) return "Yesterday";
  return dt.toLocaleDateString();
};

/* ─── File Preview ──────────────────────────────────────────── */
const FilePreview = ({ file_url, file_type, file_name }) => {
  const url = file_url.startsWith("http") ? file_url : `http://localhost:5000${file_url}`;
  if (file_type === "image") {
    return (
      <a href={url} target="_blank" rel="noreferrer">
        <img src={url} alt={file_name || "image"} style={{ maxWidth: 220, maxHeight: 180, borderRadius: 8, display: "block", marginTop: 4 }} />
      </a>
    );
  }
  const Icon = file_type === "csv" ? FaFileCsv : FaFileAlt;
  return (
    <a href={url} target="_blank" rel="noreferrer" download={file_name}
      style={{ display: "flex", alignItems: "center", gap: 8, color: "inherit", textDecoration: "none",
        background: "rgba(255,255,255,0.15)", borderRadius: 8, padding: "6px 10px", marginTop: 4 }}>
      <Icon size={18} />
      <span style={{ fontSize: "0.82rem", wordBreak: "break-all" }}>{file_name || "Download file"}</span>
    </a>
  );
};

/* ─── Message Bubble ────────────────────────────────────────── */
const MessageBubble = ({ msg, isMine }) => (
  <div style={{ display: "flex", justifyContent: isMine ? "flex-end" : "flex-start", marginBottom: 8 }}>
    <div style={{
      maxWidth: "70%", padding: "10px 14px", borderRadius: isMine ? "18px 18px 4px 18px" : "18px 18px 18px 4px",
      background: isMine ? "#111" : "#f3f4f6", color: isMine ? "#fff" : "#111",
      boxShadow: "0 1px 3px rgba(0,0,0,0.08)",
    }}>
      {msg.message_text && <p style={{ margin: 0, fontSize: "0.9rem", lineHeight: 1.5, whiteSpace: "pre-wrap", wordBreak: "break-word" }}>{msg.message_text}</p>}
      {msg.file_url && <FilePreview file_url={msg.file_url} file_type={msg.file_type} file_name={msg.file_name} />}
      <div style={{ display: "flex", alignItems: "center", gap: 4, justifyContent: "flex-end", marginTop: 4 }}>
        <span style={{ fontSize: "0.7rem", opacity: 0.6 }}>{fmtTime(msg.created_at)}</span>
        {isMine && <span style={{ fontSize: "0.7rem", opacity: 0.6 }}>{msg.is_read ? "✓✓" : "✓"}</span>}
      </div>
    </div>
  </div>
);

/* ─── Sidebar Item ──────────────────────────────────────────── */
const ConvItem = ({ conv, active, onClick, isAdmin }) => {
  const name = isAdmin
    ? (conv.institute?.instituteInfo?.schoolName || conv.institute?.name || "Institute")
    : "Admin Support";
  const initials = name.charAt(0).toUpperCase();
  return (
    <button onClick={onClick}
      style={{
        width: "100%", textAlign: "left", border: "none", background: active ? "#f3f4f6" : "transparent",
        padding: "12px 16px", cursor: "pointer", borderBottom: "1px solid #f3f4f6",
        display: "flex", alignItems: "center", gap: 12, transition: "background 0.15s",
      }}>
      <div style={{ width: 42, height: 42, borderRadius: "50%", background: "#111", color: "#fff",
        display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 700, flexShrink: 0, fontSize: "1rem" }}>
        {initials}
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <span style={{ fontWeight: 600, fontSize: "0.88rem", color: "#111", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{name}</span>
          {conv.unread_count > 0 && (
            <span style={{ background: "#ef4444", color: "#fff", borderRadius: 12, padding: "1px 7px", fontSize: "0.7rem", fontWeight: 700, flexShrink: 0 }}>
              {conv.unread_count}
            </span>
          )}
        </div>
        <p style={{ margin: 0, fontSize: "0.78rem", color: "#6b7280", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
          {conv.last_message || "No messages yet"}
        </p>
      </div>
    </button>
  );
};

/* ─── New Chat Modal (Admin Only) ──────────────────────────── */
const NewChatModal = ({ show, onClose, onSelectInstitute }) => {
  const [institutes, setInstitutes] = useState([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!show) return;
    setLoading(true);
    axios.get(`${API}/users/admin/users?role=institute&status=active&limit=100`, { headers: authH() })
      .then(r => setInstitutes(r.data.users || []))
      .catch(() => setInstitutes([]))
      .finally(() => setLoading(false));
  }, [show]);

  const filtered = institutes.filter(inst => 
    inst.name?.toLowerCase().includes(search.toLowerCase()) ||
    inst.email?.toLowerCase().includes(search.toLowerCase()) ||
    inst.instituteInfo?.schoolName?.toLowerCase().includes(search.toLowerCase())
  );

  if (!show) return null;

  return (
    <div style={{ position: "fixed", inset: 0, zIndex: 2000, display: "flex", alignItems: "center", justifyContent: "center", background: "rgba(0,0,0,0.4)" }}>
      <div style={{ background: "#fff", borderRadius: 12, width: "min(480px, 90vw)", maxHeight: "80vh", display: "flex", flexDirection: "column", boxShadow: "0 20px 60px rgba(0,0,0,0.25)" }}>
        <div style={{ padding: "20px 24px", borderBottom: "1px solid #e5e7eb", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <h3 style={{ margin: 0, fontWeight: 700, fontSize: "1.1rem" }}>Start New Chat</h3>
          <button onClick={onClose} style={{ background: "none", border: "none", cursor: "pointer", fontSize: "1.2rem", color: "#6b7280" }}>
            <FaTimes />
          </button>
        </div>
        <div style={{ padding: "16px 24px", borderBottom: "1px solid #e5e7eb" }}>
          <div style={{ position: "relative" }}>
            <FaSearch style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)", color: "#9ca3af", fontSize: "0.85rem" }} />
            <input
              value={search} onChange={e => setSearch(e.target.value)}
              placeholder="Search institutes..."
              style={{ width: "100%", padding: "10px 12px 10px 36px", border: "1px solid #e5e7eb", borderRadius: 8, fontSize: "0.9rem", outline: "none" }}
            />
          </div>
        </div>
        <div style={{ flex: 1, overflowY: "auto", maxHeight: 400 }}>
          {loading ? (
            <div style={{ textAlign: "center", padding: "3rem", color: "#9ca3af" }}>Loading institutes...</div>
          ) : filtered.length === 0 ? (
            <div style={{ textAlign: "center", padding: "3rem", color: "#9ca3af" }}>
              {search ? "No institutes found" : "No verified institutes available"}
            </div>
          ) : (
            filtered.map(inst => (
              <button key={inst.id} onClick={() => onSelectInstitute(inst)}
                style={{ width: "100%", textAlign: "left", border: "none", background: "transparent", padding: "12px 24px", cursor: "pointer", display: "flex", alignItems: "center", gap: 12, transition: "background 0.15s" }}
                onMouseEnter={e => e.currentTarget.style.background = "#f9fafb"}
                onMouseLeave={e => e.currentTarget.style.background = "transparent"}>
                <div style={{ width: 40, height: 40, borderRadius: "50%", background: "#111", color: "#fff", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 700, flexShrink: 0 }}>
                  {(inst.instituteInfo?.schoolName || inst.name || "I").charAt(0).toUpperCase()}
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontWeight: 600, fontSize: "0.9rem", color: "#111", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                    {inst.instituteInfo?.schoolName || inst.name}
                  </div>
                  <div style={{ fontSize: "0.8rem", color: "#6b7280", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                    {inst.email}
                  </div>
                </div>
              </button>
            ))
          )}
        </div>
      </div>
    </div>
  );
};

/* ─── Main ChatPage ─────────────────────────────────────────── */
export default function ChatPage({ embedded = false }) {
  const user = JSON.parse(localStorage.getItem("user") || "null");
  const isAdmin = user?.role === "admin";
  const isInstitute = user?.role === "institute";

  const [conversations, setConversations] = useState([]);
  const [activeConv, setActiveConv]       = useState(null);
  const [messages, setMessages]           = useState([]);
  const [text, setText]                   = useState("");
  const [search, setSearch]               = useState("");
  const [typing, setTyping]               = useState(false);
  const [otherTyping, setOtherTyping]     = useState(false);
  const [uploading, setUploading]         = useState(false);
  const [sending, setSending]             = useState(false);
  const [loadingMsgs, setLoadingMsgs]     = useState(false);
  const [onlineUsers, setOnlineUsers]     = useState(new Set());
  const [showNewChatModal, setShowNewChatModal] = useState(false);

  const messagesEndRef = useRef(null);
  const fileInputRef   = useRef(null);
  const typingTimer    = useRef(null);
  const socketRef      = useRef(null);

  // ── Load conversations ──────────────────────────────────────
  const loadConversations = useCallback(async () => {
    try {
      if (isAdmin) {
        const r = await axios.get(`${API}/admin/conversations?search=${search}`, { headers: authH() });
        if (r.data.success) setConversations(r.data.conversations);
      } else if (isInstitute) {
        const r = await axios.get(`${API}/institute/conversation`, { headers: authH() });
        if (r.data.success) {
          setConversations([r.data.conversation]);
          if (!activeConv) setActiveConv(r.data.conversation);
        }
      }
    } catch (err) {
      console.error("loadConversations:", err);
    }
  }, [isAdmin, isInstitute, search, activeConv]);

  useEffect(() => { loadConversations(); }, [search]);

  // ── Load messages ───────────────────────────────────────────
  const loadMessages = useCallback(async (convId) => {
    setLoadingMsgs(true);
    try {
      const r = await axios.get(`${API}/messages/${convId}`, { headers: authH() });
      if (r.data.success) setMessages(r.data.messages);
    } catch (err) {
      console.error("loadMessages:", err);
    } finally {
      setLoadingMsgs(false);
    }
  }, []);

  useEffect(() => {
    if (activeConv) {
      loadMessages(activeConv.id);
      // Update unread count in sidebar
      setConversations(prev =>
        prev.map(c => c.id === activeConv.id ? { ...c, unread_count: 0 } : c)
      );
    }
  }, [activeConv]);

  // ── Auto scroll ─────────────────────────────────────────────
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, otherTyping]);

  // ── Socket setup ────────────────────────────────────────────
  useEffect(() => {
    const socket = connectSocket();
    if (!socket) return;
    socketRef.current = socket;

    socket.on("receive_message", (msg) => {
      setMessages(prev => {
        if (prev.find(m => m.id === msg.id)) return prev;
        return [...prev, msg];
      });
      // Update sidebar preview
      setConversations(prev =>
        prev.map(c => c.id === msg.conversation_id
          ? { ...c, last_message: msg.message_text || "📎 File", unread_count: 0 }
          : c
        )
      );
    });

    socket.on("typing", ({ userId: uid, name, is_typing }) => {
      if (uid !== user?.id) setOtherTyping(is_typing);
    });

    socket.on("messages_read", ({ conversation_id }) => {
      setMessages(prev => prev.map(m =>
        m.conversation_id === conversation_id ? { ...m, is_read: true } : m
      ));
    });

    socket.on("user_online",  ({ userId: uid }) => setOnlineUsers(prev => new Set([...prev, uid])));
    socket.on("user_offline", ({ userId: uid }) => setOnlineUsers(prev => { const s = new Set(prev); s.delete(uid); return s; }));

    return () => {
      socket.off("receive_message");
      socket.off("typing");
      socket.off("messages_read");
      socket.off("user_online");
      socket.off("user_offline");
    };
  }, []);

  // ── Join room when conversation changes ─────────────────────
  useEffect(() => {
    const socket = socketRef.current;
    if (!socket || !activeConv) return;
    socket.emit("join_conversation", { conversation_id: activeConv.id });
    socket.emit("read_message", { conversation_id: activeConv.id });
  }, [activeConv]);

  // ── Typing indicator ────────────────────────────────────────
  const handleTyping = (val) => {
    setText(val);
    const socket = socketRef.current;
    if (!socket || !activeConv) return;
    if (!typing) {
      setTyping(true);
      socket.emit("typing", { conversation_id: activeConv.id, is_typing: true });
    }
    clearTimeout(typingTimer.current);
    typingTimer.current = setTimeout(() => {
      setTyping(false);
      socket.emit("typing", { conversation_id: activeConv.id, is_typing: false });
    }, 1500);
  };

  // ── Send text message ────────────────────────────────────────
  const sendMessage = async (e) => {
    e?.preventDefault();
    if (!text.trim() || !activeConv || sending) return;
    setSending(true);
    try {
      const r = await axios.post(`${API}/messages/${activeConv.id}`, { message_text: text.trim() }, { headers: authH() });
      if (r.data.success) {
        setText("");
        // Socket will broadcast; also add locally for instant feedback
        setMessages(prev => prev.find(m => m.id === r.data.message.id) ? prev : [...prev, r.data.message]);
      }
    } catch (err) {
      console.error("sendMessage:", err);
    } finally {
      setSending(false);
    }
  };

  // ── Upload file ──────────────────────────────────────────────
  const handleFileUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file || !activeConv) return;

    if (file.size > 5 * 1024 * 1024) {
      toast.warning("File too large. Max 5 MB.");
      return;
    }

    setUploading(true);
    try {
      const fd = new FormData();
      fd.append("file", file);
      const uploadRes = await axios.post(`${API}/messages/upload`, fd, {
        headers: { ...authH(), "Content-Type": "multipart/form-data" },
      });
      if (!uploadRes.data.success) throw new Error(uploadRes.data.message);

      const { file_url, file_type, file_name } = uploadRes.data;
      const msgRes = await axios.post(`${API}/messages/${activeConv.id}`,
        { file_url, file_type, file_name, message_text: text.trim() || null },
        { headers: authH() }
      );
      if (msgRes.data.success) {
        setText("");
        setMessages(prev => prev.find(m => m.id === msgRes.data.message.id) ? prev : [...prev, msgRes.data.message]);
      }
    } catch (err) {
      toast.error(err.response?.data?.message || err.message || "Upload failed");
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  // ── Select conversation ──────────────────────────────────────
  const selectConv = (conv) => {
    setActiveConv(conv);
    setMessages([]);
    setOtherTyping(false);
  };

  // ── Start new conversation (Admin only) ──────────────────────
  const handleStartNewChat = async (institute) => {
    try {
      const r = await axios.post(`${API}/admin/conversations/start/${institute.id}`, {}, { headers: authH() });
      if (r.data.success) {
        setShowNewChatModal(false);
        await loadConversations(); // Refresh conversations
        // Find and select the new/existing conversation
        const newConv = conversations.find(c => c.institute_id === institute.id) || r.data.conversation;
        if (newConv) setActiveConv(newConv);
      }
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to start conversation");
    }
  };

  // ── Derive other party name ──────────────────────────────────
  const otherName = activeConv
    ? isAdmin
      ? (activeConv.institute?.instituteInfo?.schoolName || activeConv.institute?.name || "Institute")
      : "Admin Support"
    : "";

  const otherUserId = activeConv
    ? isAdmin ? activeConv.institute_id : activeConv.admin_id
    : null;

  const isOtherOnline = otherUserId ? onlineUsers.has(otherUserId) : false;

  // ── Group messages by date ───────────────────────────────────
  const groupedMessages = messages.reduce((acc, msg) => {
    const label = fmtDate(msg.created_at);
    if (!acc[label]) acc[label] = [];
    acc[label].push(msg);
    return acc;
  }, {});

  const containerStyle = embedded
    ? { display: "flex", height: "100%", background: "#fff", borderRadius: 12, overflow: "hidden", border: "1px solid #e5e7eb" }
    : { display: "flex", height: "calc(100vh - 64px)", background: "#fff" };

  return (
    <div style={containerStyle}>
      {/* ── Sidebar ── */}
      {(isAdmin || conversations.length > 1) && (
        <div style={{ width: 300, borderRight: "1px solid #e5e7eb", display: "flex", flexDirection: "column", flexShrink: 0 }}>
          <div style={{ padding: "16px", borderBottom: "1px solid #e5e7eb" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
              <h6 style={{ margin: 0, fontWeight: 700, fontSize: "0.95rem" }}>
                {isAdmin ? "Institute Chats" : "Messages"}
              </h6>
              {isAdmin && (
                <button onClick={() => setShowNewChatModal(true)}
                  style={{ background: "#111", color: "#fff", border: "none", borderRadius: "50%", width: 28, height: 28, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}
                  title="Start new chat">
                  <FaPlus size={12} />
                </button>
              )}
            </div>
            {isAdmin && (
              <div style={{ position: "relative" }}>
                <FaSearch style={{ position: "absolute", left: 10, top: "50%", transform: "translateY(-50%)", color: "#9ca3af", fontSize: "0.8rem" }} />
                <input
                  value={search} onChange={e => setSearch(e.target.value)}
                  placeholder="Search institutes..."
                  style={{ width: "100%", padding: "7px 10px 7px 30px", border: "1px solid #e5e7eb", borderRadius: 8, fontSize: "0.82rem", outline: "none" }}
                />
              </div>
            )}
          </div>
          <div style={{ flex: 1, overflowY: "auto" }}>
            {conversations.length === 0 && (
              <p style={{ textAlign: "center", color: "#9ca3af", padding: "2rem 1rem", fontSize: "0.85rem" }}>
                {isAdmin ? "No conversations yet. Click + to start one!" : "No conversations yet"}
              </p>
            )}
            {conversations.map(conv => (
              <ConvItem key={conv.id} conv={conv} active={activeConv?.id === conv.id}
                onClick={() => selectConv(conv)} isAdmin={isAdmin} />
            ))}
          </div>
        </div>
      )}

      {/* ── Chat Area ── */}
      <div style={{ flex: 1, display: "flex", flexDirection: "column", minWidth: 0 }}>
        {!activeConv ? (
          <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", color: "#9ca3af" }}>
            <div style={{ textAlign: "center" }}>
              <div style={{ fontSize: "3rem", marginBottom: 12 }}>💬</div>
              <p style={{ margin: 0, fontWeight: 600 }}>Select a conversation</p>
              <p style={{ margin: "4px 0 0", fontSize: "0.85rem" }}>
                {isAdmin ? "Choose an institute to start chatting or click + to start new" : "Choose a conversation to start chatting"}
              </p>
            </div>
          </div>
        ) : (
          <>
            {/* Header */}
            <div style={{ padding: "14px 20px", borderBottom: "1px solid #e5e7eb", display: "flex", alignItems: "center", gap: 12, background: "#fff" }}>
              <div style={{ width: 40, height: 40, borderRadius: "50%", background: "#111", color: "#fff",
                display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 700, fontSize: "1rem" }}>
                {otherName.charAt(0).toUpperCase()}
              </div>
              <div>
                <div style={{ fontWeight: 700, fontSize: "0.95rem" }}>{otherName}</div>
                <div style={{ display: "flex", alignItems: "center", gap: 5, fontSize: "0.75rem", color: isOtherOnline ? "#22c55e" : "#9ca3af" }}>
                  <FaCircle size={7} />
                  {isOtherOnline ? "Online" : "Offline"}
                </div>
              </div>
            </div>

            {/* Messages */}
            <div style={{ flex: 1, overflowY: "auto", padding: "16px 20px", background: "#fafafa" }}>
              {loadingMsgs ? (
                <div style={{ textAlign: "center", padding: "2rem", color: "#9ca3af" }}>Loading messages...</div>
              ) : messages.length === 0 ? (
                <div style={{ textAlign: "center", padding: "3rem", color: "#9ca3af" }}>
                  <p style={{ margin: 0 }}>No messages yet. Say hello! 👋</p>
                </div>
              ) : (
                Object.entries(groupedMessages).map(([label, msgs]) => (
                  <div key={label}>
                    <div style={{ textAlign: "center", margin: "12px 0" }}>
                      <span style={{ background: "#e5e7eb", color: "#6b7280", borderRadius: 12, padding: "3px 12px", fontSize: "0.72rem" }}>{label}</span>
                    </div>
                    {msgs.map(msg => (
                      <MessageBubble key={msg.id || msg._id} msg={msg} isMine={msg.sender_id === user?.id} />
                    ))}
                  </div>
                ))
              )}
              {otherTyping && (
                <div style={{ display: "flex", alignItems: "center", gap: 8, marginTop: 4 }}>
                  <div style={{ background: "#f3f4f6", borderRadius: 18, padding: "8px 14px", display: "flex", gap: 4 }}>
                    {[0, 1, 2].map(i => (
                      <span key={i} style={{ width: 7, height: 7, borderRadius: "50%", background: "#9ca3af",
                        display: "inline-block", animation: `bounce 1.2s ${i * 0.2}s infinite` }} />
                    ))}
                  </div>
                  <style>{`@keyframes bounce{0%,80%,100%{transform:translateY(0)}40%{transform:translateY(-6px)}}`}</style>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Input */}
            <form onSubmit={sendMessage}
              style={{ padding: "12px 16px", borderTop: "1px solid #e5e7eb", display: "flex", gap: 10, alignItems: "flex-end", background: "#fff" }}>
              <input type="file" ref={fileInputRef} onChange={handleFileUpload} style={{ display: "none" }}
                accept=".jpg,.jpeg,.png,.pdf,.csv" />
              <button type="button" onClick={() => fileInputRef.current?.click()} disabled={uploading}
                style={{ background: "none", border: "none", cursor: "pointer", color: "#6b7280", padding: "8px", flexShrink: 0 }}
                title="Attach file (jpg, png, pdf, csv — max 5MB)">
                {uploading ? <span style={{ fontSize: "0.75rem" }}>...</span> : <FaPaperclip size={18} />}
              </button>
              <textarea
                value={text} onChange={e => handleTyping(e.target.value)}
                onKeyDown={e => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); sendMessage(); } }}
                placeholder="Type a message..."
                rows={1}
                style={{ flex: 1, border: "1px solid #e5e7eb", borderRadius: 22, padding: "10px 16px",
                  fontSize: "0.9rem", outline: "none", resize: "none", lineHeight: 1.5,
                  maxHeight: 120, overflowY: "auto", fontFamily: "inherit" }}
              />
              <button type="submit" disabled={!text.trim() || sending}
                style={{ background: "#111", color: "#fff", border: "none", borderRadius: "50%",
                  width: 40, height: 40, display: "flex", alignItems: "center", justifyContent: "center",
                  cursor: text.trim() ? "pointer" : "not-allowed", opacity: text.trim() ? 1 : 0.5, flexShrink: 0 }}>
                <FaPaperPlane size={15} />
              </button>
            </form>
          </>
        )}
      </div>

      {/* ── New Chat Modal ── */}
      <NewChatModal 
        show={showNewChatModal} 
        onClose={() => setShowNewChatModal(false)}
        onSelectInstitute={handleStartNewChat}
      />
    </div>
  );
}