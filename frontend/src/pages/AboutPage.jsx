import { useNavigate } from "react-router-dom";
import SharedLayout from "../components/SharedLayout.jsx";

const AboutPage = () => {
  const navigate = useNavigate();
  return (
    <SharedLayout>
      <div style={{ maxWidth: 900, margin: "0 auto" }} className="px-4 py-5">

        {/* Header */}
        <div className="mb-5">
          <p className="text-uppercase fw-bold small text-muted mb-1" style={{ letterSpacing: "0.1em" }}>ABOUT US</p>
          <h1 style={{ fontFamily: "'Instrument Serif', Georgia, serif", fontSize: "clamp(2.5rem,6vw,4rem)", fontWeight: 400, letterSpacing: "-0.02em" }}>
            Smart Stationery
          </h1>
          <p className="text-muted lh-lg" style={{ fontSize: "1.1rem", maxWidth: 600 }}>
            Your one-stop destination for all educational supplies — from textbooks to sports gear, stationery to complete school sets.
          </p>
        </div>

        {/* Mission */}
        <div className="border rounded-3 bg-white p-4 p-md-5 mb-4">
          <h2 className="fw-bold mb-3" style={{ fontSize: "1.5rem", letterSpacing: "-0.01em" }}>Our Mission</h2>
          <p className="text-muted lh-lg mb-0">
            Smart Stationery was built to make quality educational supplies accessible to every student in Nepal. We connect schools, parents, and students with the products they need — while also enabling a community-driven donation system so unused books and supplies can find new homes.
          </p>
        </div>

        {/* What we offer */}
        <div className="border rounded-3 bg-white p-4 p-md-5 mb-4">
          <h2 className="fw-bold mb-4" style={{ fontSize: "1.5rem", letterSpacing: "-0.01em" }}>What We Offer</h2>
          <div className="row g-3">
            {[
              { icon: "📚", title: "Complete Book Sets", desc: "Pre-curated book sets for schools across Nepal. Order everything your child needs in one click." },
              { icon: "✏️", title: "Stationery & Supplies", desc: "Notebooks, pens, art supplies, and everything in between — sourced from trusted suppliers." },
              { icon: "🏃", title: "Sports Equipment", desc: "Quality sports gear for school activities, PE classes, and extracurricular sports." },
              { icon: "🎁", title: "Donation Marketplace", desc: "Donate unused books and supplies, or browse free items donated by the community." },
              { icon: "🏫", title: "Institute Portal", desc: "Dedicated portal for schools and colleges to manage bulk orders with a 10% discount." },
              { icon: "📦", title: "Item Requests", desc: "Can't find what you need? Submit a request and we'll source it for you." },
            ].map(item => (
              <div key={item.title} className="col-md-6">
                <div className="d-flex gap-3 p-3 border rounded-3 h-100">
                  <span style={{ fontSize: "1.5rem", flexShrink: 0 }}>{item.icon}</span>
                  <div>
                    <div className="fw-semibold mb-1">{item.title}</div>
                    <div className="text-muted small lh-base">{item.desc}</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Stats */}
        <div className="border rounded-3 bg-white p-4 p-md-5 mb-4">
          <h2 className="fw-bold mb-4" style={{ fontSize: "1.5rem", letterSpacing: "-0.01em" }}>By the Numbers</h2>
          <div className="row g-3 text-center">
            {[["15K+","Happy Students"],["50+","Schools Covered"],["500+","Items Donated"],["5,000+","Products Listed"]].map(([n,l]) => (
              <div key={l} className="col-6 col-md-3">
                <div style={{ fontFamily: "'Instrument Serif', Georgia, serif", fontSize: "2.5rem", fontWeight: 400, color: "#111", lineHeight: 1 }}>{n}</div>
                <div className="text-muted small mt-1">{l}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Contact */}
        <div className="border rounded-3 bg-white p-4 p-md-5 mb-4">
          <h2 className="fw-bold mb-3" style={{ fontSize: "1.5rem", letterSpacing: "-0.01em" }}>Contact Us</h2>
          <div className="row g-3">
            <div className="col-md-4">
              <div className="fw-semibold small text-muted text-uppercase mb-1" style={{ letterSpacing: "0.06em" }}>Address</div>
              <div className="small">Kathmandu, Nepal</div>
            </div>
            <div className="col-md-4">
              <div className="fw-semibold small text-muted text-uppercase mb-1" style={{ letterSpacing: "0.06em" }}>Phone</div>
              <div className="small">+977 9815127051</div>
            </div>
            <div className="col-md-4">
              <div className="fw-semibold small text-muted text-uppercase mb-1" style={{ letterSpacing: "0.06em" }}>Email</div>
              <div className="small" style={{ wordBreak: "break-all" }}>stationerymanagementsystem25@gmail.com</div>
            </div>
          </div>
        </div>

        <div className="d-flex gap-3 flex-wrap">
          <button onClick={() => navigate("/products")} className="btn btn-dark fw-bold rounded-pill px-4">Browse Products</button>
          <button onClick={() => navigate("/donations")} className="btn btn-outline-dark fw-bold rounded-pill px-4">Donation Marketplace</button>
          <button onClick={() => navigate("/faq")} className="btn btn-outline-secondary fw-semibold rounded-pill px-4">FAQs</button>
        </div>
      </div>
    </SharedLayout>
  );
};

export default AboutPage;
