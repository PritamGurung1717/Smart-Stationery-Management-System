import { useNavigate } from "react-router-dom";
import SharedLayout from "../components/SharedLayout.jsx";
import "../styles/landing.css";

const AboutPage = () => {
  const navigate = useNavigate();
  return (
    <SharedLayout>
      <section style={{ background: "#F3F4F6", minHeight: "60vh" }}>
        <div className="ss-page-inner">
          <p className="ss-section-label">ABOUT US</p>
          <h1 className="ss-page-title mb-2">Smart Stationery</h1>
          <p className="lh-lg mb-5" style={{ fontSize: "1.1rem", maxWidth: 600, color: "#4B5563" }}>
            Your one-stop destination for all educational supplies — from textbooks to sports gear, stationery to complete school sets.
          </p>

          <div className="ss-card mb-4">
            <h2 className="fw-bold mb-3" style={{ fontSize: "1.5rem", color: "#111" }}>Our Mission</h2>
            <p className="lh-lg mb-0" style={{ color: "#4B5563" }}>
              Smart Stationery was built to make quality educational supplies accessible to every student in Nepal. We connect schools, parents, and students with the products they need — while also enabling a community-driven donation system so unused books and supplies can find new homes.
            </p>
          </div>

          <div className="ss-card mb-4">
            <h2 className="fw-bold mb-4" style={{ fontSize: "1.5rem", color: "#111" }}>What We Offer</h2>
            <div className="row g-3">
              {[
                { icon: "📚", title: "Complete Book Sets", desc: "Your child's syllabus, in a single box. Pre-curated book sets for schools across Nepal." },
                { icon: "✏️", title: "Stationery & Supplies", desc: "Notebooks, pens, art supplies, and everything in between — sourced from trusted suppliers." },
                { icon: "🏃", title: "Sports Equipment", desc: "Quality sports gear for school activities, PE classes, and extracurricular sports." },
                { icon: "🎁", title: "Donation Marketplace", desc: "Donate unused books and supplies, or browse free items donated by the community." },
                { icon: "🏫", title: "Institute Portal", desc: "Dedicated portal for schools and colleges to manage bulk orders with a 10% discount." },
                { icon: "📦", title: "Item Requests", desc: "Can't find what you need? Submit a request and we'll source it for you." },
              ].map(item => (
                <div key={item.title} className="col-md-6">
                  <div className="d-flex gap-3 p-3 rounded-3 h-100" style={{ border: "1px solid #E5E7EB", background: "#FAFAFA" }}>
                    <span style={{ fontSize: "1.5rem", flexShrink: 0 }}>{item.icon}</span>
                    <div>
                      <div className="fw-semibold mb-1" style={{ color: "#111" }}>{item.title}</div>
                      <div className="small lh-base" style={{ color: "#4B5563" }}>{item.desc}</div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="ss-card mb-4">
            <h2 className="fw-bold mb-4" style={{ fontSize: "1.5rem", color: "#111" }}>By the Numbers</h2>
            <div className="row g-3 text-center">
              {[["15K+","Happy Students"],["50+","Schools Covered"],["500+","Items Donated"],["5,000+","Products Listed"]].map(([n,l]) => (
                <div key={l} className="col-6 col-md-3">
                  <div className="ss-page-title" style={{ fontSize: "2.5rem", lineHeight: 1, color: "#1D4ED8" }}>{n}</div>
                  <div className="small mt-1" style={{ color: "#4B5563" }}>{l}</div>
                </div>
              ))}
            </div>
          </div>

          <div className="ss-card mb-4">
            <h2 className="fw-bold mb-3" style={{ fontSize: "1.5rem", color: "#111" }}>Contact Us</h2>
            <div className="row g-3">
              <div className="col-md-4">
                <div className="fw-semibold small text-uppercase mb-1" style={{ letterSpacing: "0.06em", color: "#4B5563" }}>Address</div>
                <div className="small" style={{ color: "#111" }}>Kathmandu, Nepal</div>
              </div>
              <div className="col-md-4">
                <div className="fw-semibold small text-uppercase mb-1" style={{ letterSpacing: "0.06em", color: "#4B5563" }}>Phone</div>
                <div className="small" style={{ color: "#111" }}>+977 9815127051</div>
              </div>
              <div className="col-md-4">
                <div className="fw-semibold small text-uppercase mb-1" style={{ letterSpacing: "0.06em", color: "#4B5563" }}>Email</div>
                <div className="small" style={{ wordBreak: "break-all", color: "#111" }}>stationerymanagementsystem25@gmail.com</div>
              </div>
            </div>
          </div>

          <div className="d-flex gap-3 flex-wrap">
            <button type="button" onClick={() => navigate("/products")} className="landing-btn-primary border-0 px-4">Browse Products</button>
            <button type="button" onClick={() => navigate("/donations")} className="ss-btn-outline px-4 py-2">Donation Marketplace</button>
            <button type="button" onClick={() => navigate("/faq")} className="ss-btn-outline px-4 py-2">FAQs</button>
          </div>
        </div>
      </section>
    </SharedLayout>
  );
};

export default AboutPage;
