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
      <div className="d-flex align-items-center justify-content-center bg-light" style={{ height: 180, fontSize: "2.5rem" }}>📦</div>
    );
  }

  const imgSrc = images[idx].startsWith("http") ? images[idx] : `${API}/${images[idx]}`;

  return (
    <div style={{ height: 180, position: "relative", overflow: "hidden" }} className="bg-light">
      <img key={idx} src={imgSrc} alt={title}
        style={{ width: "100%", height: "100%", objectFit: "cover", transition: "opacity 0.4s" }}
        onError={e => { e.target.style.display = "none"; }} />
      {images.length > 1 && (
        <>
          <div className="position-absolute d-flex gap-1" style={{ bottom: 6, left: "50%", transform: "translateX(-50%)" }}>
            {images.map((_, i) => (
              <div key={i} onClick={e => { e.stopPropagation(); setIdx(i); }}
                style={{ width: 6, height: 6, borderRadius: "50%", background: i === idx ? "#fff" : "rgba(255,255,255,0.5)", cursor: "pointer" }} />
            ))}
          </div>
          <button onClick={e => { e.stopPropagation(); setIdx(i => (i - 1 + images.length) % images.length); }}
            className="position-absolute border-0 rounded-circle d-flex align-items-center justify-content-center"
            style={{ left: 6, top: "50%", transform: "translateY(-50%)", background: "rgba(0,0,0,0.35)", width: 24, height: 24, color: "#fff", fontSize: "0.65rem" }}>
            <FaChevronLeft />
          </button>
          <button onClick={e => { e.stopPropagation(); setIdx(i => (i + 1) % images.length); }}
            className="position-absolute border-0 rounded-circle d-flex align-items-center justify-content-center"
            style={{ right: 6, top: "50%", transform: "translateY(-50%)", background: "rgba(0,0,0,0.35)", width: 24, height: 24, color: "#fff", fontSize: "0.65rem" }}>
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
      const res = await axios.get(`${API}/api/donations`, { headers: { Authorization: `Bearer ${token}` } });
      if (res.data.success) setDonations(res.data.donations || []);
    } catch (err) {
      if (err.response?.status === 401) navigate("/");
    } finally { setLoading(false); }
  };

  const filtered = donations.filter(d =>
    search === "" ||
    d.title?.toLowerCase().includes(search.toLowerCase()) ||
    d.category?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <SharedLayout activeLink="Donate">
      <div style={{ maxWidth: 1100, margin: "0 auto" }} className="px-3 py-4">

        {/* Header */}
        <div className="d-flex justify-content-between align-items-start flex-wrap gap-3 mb-4">
          <div>
            <button onClick={() => navigate("/dashboard")}
              className="btn btn-link p-0 text-secondary small d-inline-flex align-items-center gap-1 mb-2 text-decoration-none">
              <FaChevronLeft style={{ fontSize: "0.7rem" }} /> Back
            </button>
            <p className="text-uppercase fw-bold small text-muted mb-1" style={{ letterSpacing: "0.1em" }}>Community</p>
            <h1 style={{ fontFamily: "'Instrument Serif', Georgia, serif", fontSize: "2.5rem", fontWeight: 400, lineHeight: 1.1 }} className="mb-1">
              Donation Marketplace
            </h1>
            <p className="text-muted small mb-0">Browse and claim free items donated by the community.</p>
          </div>
          <div className="d-flex gap-2 align-items-center">
            <button onClick={() => navigate("/my-donations")} className="btn btn-outline-secondary fw-semibold">My Donations</button>
            <button onClick={() => navigate("/donations/create")} className="btn btn-dark fw-semibold d-flex align-items-center gap-2">
              <FaGift style={{ fontSize: "0.8rem" }} /> Donate Item
            </button>
          </div>
        </div>

        {/* Search */}
        <div className="position-relative mb-4" style={{ maxWidth: 420 }}>
          <FaSearch className="position-absolute text-muted" style={{ left: 12, top: "50%", transform: "translateY(-50%)", fontSize: "0.8rem" }} />
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search donations…"
            className="form-control ps-4" />
        </div>

        {/* Content */}
        {loading ? (
          <div className="text-center py-5">
            <div className="spinner-border text-dark" style={{ width: 36, height: 36, borderWidth: 3 }} role="status">
              <span className="visually-hidden">Loading…</span>
            </div>
          </div>
        ) : filtered.length === 0 ? (
          <div className="border rounded-3 bg-white text-center py-5">
            <div style={{ fontSize: "3rem" }} className="mb-3">🎁</div>
            <h4 className="fw-bold mb-1">No Donations Found</h4>
            <p className="text-muted mb-4 small">{search ? "No donations match your search." : "Be the first to donate something!"}</p>
            <button onClick={() => navigate("/donations/create")} className="btn btn-dark fw-semibold">Create First Donation</button>
          </div>
        ) : (
          <div className="row g-3">
            {filtered.map(d => (
              <div key={d.id} className="col-sm-6 col-lg-4">
                <div onClick={() => navigate(`/donations/${d.id}`)}
                  className="border rounded-3 bg-white h-100 overflow-hidden"
                  style={{ cursor: "pointer", transition: "box-shadow 0.15s" }}
                  onMouseEnter={e => e.currentTarget.style.boxShadow = "0 4px 16px rgba(0,0,0,0.08)"}
                  onMouseLeave={e => e.currentTarget.style.boxShadow = "none"}>
                  <CardImages images={d.images} title={d.title} />
                  <div className="p-3">
                    <div className="d-flex justify-content-between align-items-center mb-2">
                      <span className="text-uppercase fw-bold text-muted" style={{ fontSize: "0.7rem", letterSpacing: "0.06em" }}>{d.category}</span>
                      <span className={`badge ${d.status === "available" ? "text-success-emphasis bg-success-subtle" : "text-warning-emphasis bg-warning-subtle"}`} style={{ fontSize: "0.7rem" }}>
                        {d.status}
                      </span>
                    </div>
                    <div className="fw-bold mb-1" style={{ fontSize: "0.95rem", lineHeight: 1.3 }}>{d.title}</div>
                    <div className="text-muted small lh-base" style={{ display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", overflow: "hidden" }}>
                      {d.description}
                    </div>
                    <div className="text-muted mt-2" style={{ fontSize: "0.75rem" }}>
                      by {d.donor?.name || "Anonymous"} · {d.created_at ? new Date(d.created_at).toLocaleDateString() : ""}
                    </div>
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
