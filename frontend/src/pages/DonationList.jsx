import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { FaGift, FaSearch, FaChevronLeft, FaChevronRight } from "react-icons/fa";
import axios from "axios";
import SharedLayout from "../components/SharedLayout.jsx";
import "../styles/landing.css";

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
      <div className="d-flex align-items-center justify-content-center" style={{ height: 180, fontSize: "2.5rem", background: "#F3F4F6" }}>📦</div>
    );
  }

  const imgSrc = images[idx].startsWith("http") ? images[idx] : `${API}${images[idx].startsWith("/") ? "" : "/"}${images[idx]}`;

  return (
    <div style={{ height: 180, position: "relative", overflow: "hidden", background: "#F3F4F6" }}>
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
          <button type="button" onClick={e => { e.stopPropagation(); setIdx(i => (i - 1 + images.length) % images.length); }}
            className="position-absolute border-0 rounded-circle d-flex align-items-center justify-content-center"
            style={{ left: 6, top: "50%", transform: "translateY(-50%)", background: "rgba(29,78,216,0.75)", width: 24, height: 24, color: "#fff", fontSize: "0.65rem" }}>
            <FaChevronLeft />
          </button>
          <button type="button" onClick={e => { e.stopPropagation(); setIdx(i => (i + 1) % images.length); }}
            className="position-absolute border-0 rounded-circle d-flex align-items-center justify-content-center"
            style={{ right: 6, top: "50%", transform: "translateY(-50%)", background: "rgba(29,78,216,0.75)", width: 24, height: 24, color: "#fff", fontSize: "0.65rem" }}>
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
      <section className="landing-shop" style={{ paddingTop: "0.25rem", paddingBottom: "2.5rem" }}>
        <div className="ss-page-inner" style={{ paddingTop: "1rem", paddingBottom: "2.5rem" }}>
          <div className="d-flex justify-content-between align-items-start flex-wrap gap-3 mb-4">
            <div>
              <p className="ss-section-label">COMMUNITY</p>
              <h1 className="ss-page-title mb-1">Donation Marketplace</h1>
              <p className="small mb-0" style={{ color: "#4B5563" }}>Browse and claim free items donated by the community.</p>
            </div>
            <div className="d-flex gap-2 align-items-center flex-wrap">
              <button type="button" onClick={() => navigate("/my-donations")} className="landing-btn-outline"
                style={{ color: "#111", borderColor: "#E5E7EB", padding: "0.75rem 1.5rem", borderRadius: 8, fontSize: "0.9rem" }}>
                My Donations
              </button>
              <button type="button" onClick={() => navigate("/donations/create")} className="landing-btn-primary">
                <FaGift style={{ fontSize: "0.8rem", marginRight: 6 }} /> Donate Item
              </button>
            </div>
          </div>

          <div className="landing-search mb-4" style={{ maxWidth: 420 }}>
            <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search donations…" type="search" />
            <FaSearch className="landing-search-icon" />
          </div>

          {loading ? (
            <div className="text-center py-5">
              <div className="spinner-border mb-3" style={{ width: 36, height: 36, borderWidth: 3, color: "#1D4ED8" }} role="status" />
              <p style={{ color: "#4B5563" }}>Loading donations…</p>
            </div>
          ) : filtered.length === 0 ? (
            <div className="ss-card text-center py-5">
              <div style={{ fontSize: "3rem" }} className="mb-3">🎁</div>
              <h4 className="fw-bold mb-1" style={{ color: "#111" }}>No Donations Found</h4>
              <p className="mb-4 small" style={{ color: "#4B5563" }}>{search ? "No donations match your search." : "Be the first to donate something!"}</p>
              <button type="button" onClick={() => navigate("/donations/create")} className="landing-btn-primary">Create First Donation</button>
            </div>
          ) : (
            <div className="row g-3">
              {filtered.map(d => (
                <div key={d.id} className="col-sm-6 col-lg-4">
                  <div onClick={() => navigate(`/donations/${d.id}`)} className="ss-donation-card">
                    <CardImages images={d.images} title={d.title} />
                    <div className="p-3">
                      <div className="d-flex justify-content-between align-items-center mb-2">
                        <span className="text-uppercase fw-bold" style={{ fontSize: "0.7rem", letterSpacing: "0.06em", color: "#F59E0B" }}>{d.category}</span>
                        <span style={{
                          fontSize: "0.7rem", fontWeight: 600, padding: "0.15rem 0.5rem", borderRadius: 4,
                          background: d.status === "available" ? "#DCFCE7" : "#FEF3C7",
                          color: d.status === "available" ? "#16A34A" : "#D97706",
                        }}>
                          {d.status}
                        </span>
                      </div>
                      <div className="fw-bold mb-1" style={{ fontSize: "0.95rem", lineHeight: 1.3, color: "#111" }}>{d.title}</div>
                      <div className="small lh-base" style={{ color: "#4B5563", display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", overflow: "hidden" }}>
                        {d.description}
                      </div>
                      <div className="mt-2" style={{ fontSize: "0.75rem", color: "#9CA3AF" }}>
                        by {d.donor?.name || "Anonymous"} · {d.created_at ? new Date(d.created_at).toLocaleDateString() : ""}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </section>
    </SharedLayout>
  );
};

export default DonationList;
