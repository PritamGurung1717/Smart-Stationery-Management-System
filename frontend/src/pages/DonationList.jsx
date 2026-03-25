import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { FaGift, FaSearch, FaChevronLeft, FaChevronRight } from "react-icons/fa";
import axios from "axios";
import SharedLayout from "../components/SharedLayout.jsx";

const API = "http://localhost:5000";

const CardImages = ({ images, title }) => {
  const [idx, setIdx] = useState(0);

  useEffect(() => {
    if (!images || images.length <= 1) return;
    const t = setInterval(() => setIdx(i => (i + 1) % images.length), 2500);
    return () => clearInterval(t);
  }, [images]);

  if (!images || images.length === 0) {
    return (
      <div style={{ height: 180, background: "#f3f4f6", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "2.5rem" }}>
        📦
      </div>
    );
  }

  const imgSrc = images[idx].startsWith("http") ? images[idx] : `${API}/${images[idx]}`;

  return (
    <div style={{ height: 180, position: "relative", overflow: "hidden", background: "#f3f4f6" }}>
      <img
        key={idx}
        src={imgSrc}
        alt={title}
        style={{ width: "100%", height: "100%", objectFit: "cover", transition: "opacity 0.4s" }}
        onError={(e) => { e.target.style.display = "none"; }}
      />
      {images.length > 1 && (
        <>
          <div style={{ position: "absolute", bottom: 6, left: "50%", transform: "translateX(-50%)", display: "flex", gap: 4 }}>
            {images.map((_, i) => (
              <div key={i} onClick={(e) => { e.stopPropagation(); setIdx(i); }}
                style={{ width: 6, height: 6, borderRadius: "50%", background: i === idx ? "#fff" : "rgba(255,255,255,0.5)", cursor: "pointer", transition: "background 0.2s" }} />
            ))}
          </div>
          <button onClick={(e) => { e.stopPropagation(); setIdx(i => (i - 1 + images.length) % images.length); }}
            style={{ position: "absolute", left: 6, top: "50%", transform: "translateY(-50%)", background: "rgba(0,0,0,0.35)", border: "none", borderRadius: "50%", width: 24, height: 24, color: "#fff", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "0.65rem" }}>
            <FaChevronLeft />
          </button>
          <button onClick={(e) => { e.stopPropagation(); setIdx(i => (i + 1) % images.length); }}
            style={{ position: "absolute", right: 6, top: "50%", transform: "translateY(-50%)", background: "rgba(0,0,0,0.35)", border: "none", borderRadius: "50%", width: 24, height: 24, color: "#fff", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "0.65rem" }}>
            <FaChevronRight />
          </button>
        </>
      )}
    </div>
  );
};

const DonationList = () => {
  const navigate = useNavigate();
  const [donations, setDonations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  useEffect(() => { fetchDonations(); }, []);

  const fetchDonations = async () => {
    try {
      const token = localStorage.getItem("token");
      const res = await axios.get(`${API}/api/donations`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.data.success) setDonations(res.data.donations || []);
    } catch (err) {
      if (err.response?.status === 401) navigate("/login");
    } finally {
      setLoading(false);
    }
  };

  const filtered = donations.filter((d) =>
    search === "" ||
    d.title?.toLowerCase().includes(search.toLowerCase()) ||
    d.category?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <SharedLayout activeLink="Donate">
      <div style={{ maxWidth: 1100, margin: "0 auto", padding: "2.5rem 1.5rem", fontFamily: "'Inter', sans-serif" }}>

        {/* Header */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: "1rem", marginBottom: "2rem" }}>
          <div>
            <button onClick={() => navigate("/dashboard")}
              style={{ background: "none", border: "none", cursor: "pointer", color: "#6b7280", fontSize: "0.875rem", display: "inline-flex", alignItems: "center", gap: "0.4rem", padding: 0, marginBottom: "1rem" }}>
              <FaChevronLeft style={{ fontSize: "0.7rem" }} /> Back
            </button>
            <p style={{ fontSize: "0.72rem", fontWeight: 700, letterSpacing: "0.1em", color: "#9ca3af", textTransform: "uppercase", marginBottom: "0.4rem" }}>Community</p>
            <h1 style={{ fontFamily: "'Instrument Serif', Georgia, serif", fontSize: "2.5rem", fontWeight: 400, margin: 0, lineHeight: 1.1, color: "#111" }}>Donation Marketplace</h1>
            <p style={{ color: "#6b7280", marginTop: "0.5rem", fontSize: "0.9rem" }}>Browse and claim free items donated by the community.</p>
          </div>
          <div style={{ display: "flex", gap: "0.75rem", alignItems: "center" }}>
            <button onClick={() => navigate("/my-donations")}
              style={{ background: "#fff", border: "1px solid #e5e7eb", borderRadius: 8, padding: "0.6rem 1.25rem", fontWeight: 600, fontSize: "0.875rem", cursor: "pointer" }}>
              My Donations
            </button>
            <button onClick={() => navigate("/donations/create")}
              style={{ background: "#111", color: "#fff", border: "none", borderRadius: 8, padding: "0.6rem 1.25rem", fontWeight: 600, fontSize: "0.875rem", cursor: "pointer", display: "flex", alignItems: "center", gap: "0.5rem" }}>
              <FaGift style={{ fontSize: "0.8rem" }} /> Donate Item
            </button>
          </div>
        </div>

        {/* Search */}
        <div style={{ position: "relative", marginBottom: "2rem", maxWidth: 420 }}>
          <FaSearch style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)", color: "#9ca3af", fontSize: "0.8rem" }} />
          <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search donations..."
            style={{ border: "1px solid #e5e7eb", borderRadius: 8, padding: "0.6rem 0.75rem 0.6rem 2.2rem", fontSize: "0.875rem", outline: "none", width: "100%", boxSizing: "border-box" }}
            onFocus={(e) => (e.target.style.borderColor = "#111")}
            onBlur={(e) => (e.target.style.borderColor = "#e5e7eb")} />
        </div>

        {/* Content */}
        {loading ? (
          <div style={{ textAlign: "center", padding: "5rem", color: "#9ca3af" }}>Loading donations...</div>
        ) : filtered.length === 0 ? (
          <div style={{ border: "1px solid #e5e7eb", borderRadius: 14, padding: "5rem 2rem", textAlign: "center", background: "#fff" }}>
            <div style={{ fontSize: "3rem", marginBottom: "1rem" }}>🎁</div>
            <h4 style={{ fontWeight: 700, marginBottom: "0.5rem" }}>No Donations Found</h4>
            <p style={{ color: "#6b7280", marginBottom: "1.5rem", fontSize: "0.9rem" }}>
              {search ? "No donations match your search." : "Be the first to donate something!"}
            </p>
            <button onClick={() => navigate("/donations/create")}
              style={{ background: "#111", color: "#fff", border: "none", borderRadius: 8, padding: "0.65rem 1.5rem", fontWeight: 600, cursor: "pointer" }}>
              Create First Donation
            </button>
          </div>
        ) : (
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(260px, 1fr))", gap: "1rem" }}>
            {filtered.map((d) => (
              <div key={d.id} onClick={() => navigate(`/donations/${d.id}`)}
                style={{ border: "1px solid #e5e7eb", borderRadius: 14, background: "#fff", cursor: "pointer", overflow: "hidden", transition: "box-shadow 0.15s" }}
                onMouseEnter={(e) => (e.currentTarget.style.boxShadow = "0 4px 16px rgba(0,0,0,0.08)")}
                onMouseLeave={(e) => (e.currentTarget.style.boxShadow = "none")}>
                <CardImages images={d.images} title={d.title} />
                <div style={{ padding: "1rem" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.5rem" }}>
                    <span style={{ fontSize: "0.7rem", fontWeight: 700, letterSpacing: "0.06em", color: "#9ca3af", textTransform: "uppercase" }}>{d.category}</span>
                    <span style={{ background: d.status === "available" ? "#d1fae5" : "#fef3c7", color: d.status === "available" ? "#065f46" : "#92400e", fontSize: "0.7rem", fontWeight: 700, padding: "0.15rem 0.55rem", borderRadius: 20 }}>{d.status}</span>
                  </div>
                  <div style={{ fontWeight: 700, fontSize: "0.95rem", color: "#111", marginBottom: "0.35rem", lineHeight: 1.3 }}>{d.title}</div>
                  <div style={{ fontSize: "0.82rem", color: "#6b7280", lineHeight: 1.5, display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", overflow: "hidden" }}>
                    {d.description}
                  </div>
                  <div style={{ marginTop: "0.75rem", fontSize: "0.75rem", color: "#9ca3af" }}>
                    by {d.donor?.name || "Anonymous"} · {d.created_at ? new Date(d.created_at).toLocaleDateString() : ""}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </SharedLayout>
  );
};

export default DonationList;
