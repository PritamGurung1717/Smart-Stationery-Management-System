import { useState } from "react";
import { useNavigate } from "react-router-dom";
import SharedLayout from "../components/SharedLayout.jsx";
import { FaChevronDown, FaChevronUp } from "react-icons/fa";
import "../styles/landing.css";

const FAQS = [
  {
    category: "Orders & Delivery",
    items: [
      { q: "How do I place an order?", a: "Browse our products, add items to your cart, fill in your shipping details, and choose a payment method. You can pay via Cash on Delivery (COD) or Khalti." },
      { q: "How long does delivery take?", a: "We offer same-day fulfillment for orders placed before 2 PM. Standard delivery takes 1–3 business days depending on your location." },
      { q: "Is there free delivery?", a: "Yes! Orders above ₹500 qualify for free delivery." },
      { q: "Can I track my order?", a: "Yes. Go to My Orders from your dashboard to see real-time status updates for all your orders." },
      { q: "Can I cancel an order?", a: "You can cancel a pending order from the My Orders page before it is confirmed by our team." },
    ],
  },
  {
    category: "Book Sets",
    items: [
      { q: "What are Book Sets?", a: "Book Sets are pre-curated collections of all required books for a specific school and grade. You can order the complete set in one click instead of buying books individually." },
      { q: "How do I find my school's book set?", a: "Go to School Sets from the navigation bar, then filter by your school name and grade." },
      { q: "My school's set isn't listed. What do I do?", a: "If you're an institute user, you can submit a Book Set Request from your dashboard. Our admin team will review and publish it." },
      { q: "Can institutes get a discount?", a: "Yes! Verified institute accounts receive a 10% discount on all bulk orders automatically applied at checkout." },
    ],
  },
  {
    category: "Donations",
    items: [
      { q: "How does the donation system work?", a: "Any registered user can donate books or supplies they no longer need. Other users can browse available donations and request items for free." },
      { q: "How do I donate an item?", a: "Go to Donate from the navigation bar, click 'Donate Item', fill in the details and upload photos, then submit. Your donation will be visible to the community." },
      { q: "Is there any cost to request a donated item?", a: "No, donated items are completely free. You just need to coordinate pickup or delivery with the donor through our chat system." },
    ],
  },
  {
    category: "Accounts & Verification",
    items: [
      { q: "What is an Institute account?", a: "Institute accounts are for schools and colleges. They get access to bulk ordering, book set requests, and a 10% discount. Institute accounts require admin verification before activation." },
      { q: "How long does institute verification take?", a: "Verification typically takes 1–2 business days. You'll receive an email notification once your account is approved or if additional information is needed." },
      { q: "Can I sign in with Google?", a: "Yes! You can use 'Continue with Google' on the sign-in page. New Google users will be asked to choose between a Personal or Institute account type." },
      { q: "How do I change my password?", a: "Go to My Profile → Change Password tab. You'll receive an OTP on your registered email to verify your identity before setting a new password." },
    ],
  },
  {
    category: "Payments",
    items: [
      { q: "What payment methods are accepted?", a: "We accept Cash on Delivery (COD) and Khalti digital wallet payments." },
      { q: "Is online payment secure?", a: "Yes. Khalti payments are processed through their secure payment gateway. We do not store any payment card information." },
      { q: "What if my payment fails?", a: "If a Khalti payment fails, your order will not be placed. Please try again or choose Cash on Delivery as an alternative." },
    ],
  },
];

const FAQItem = ({ q, a }) => {
  const [open, setOpen] = useState(false);
  return (
    <div className="border-bottom" style={{ borderColor: "#E5E7EB" }}>
      <button
        type="button"
        onClick={() => setOpen(o => !o)}
        className={`ss-faq-toggle ${open ? "open" : ""}`}>
        {q}
        {open ? <FaChevronUp style={{ fontSize: "0.75rem", color: "#1D4ED8", flexShrink: 0 }} /> : <FaChevronDown style={{ fontSize: "0.75rem", color: "#6B7280", flexShrink: 0 }} />}
      </button>
      {open && (
        <div className="pb-3 lh-lg" style={{ fontSize: "0.9rem", color: "#4B5563" }}>
          {a}
        </div>
      )}
    </div>
  );
};

const FAQPage = () => {
  const navigate = useNavigate();
  return (
    <SharedLayout>
      <section style={{ background: "#F3F4F6", minHeight: "60vh" }}>
        <div className="ss-page-inner">
          <p className="ss-section-label">HELP CENTER</p>
          <h1 className="ss-page-title mb-2">Frequently Asked Questions</h1>
          <p className="mb-5" style={{ color: "#4B5563", fontSize: "1rem" }}>
            Find answers to common questions about orders, book sets, donations, and more.
          </p>

          <div className="d-flex flex-column gap-4">
            {FAQS.map(section => (
              <div key={section.category} className="ss-card">
                <h2 className="fw-bold mb-3" style={{ fontSize: "1.1rem", color: "#111" }}>{section.category}</h2>
                {section.items.map(item => (
                  <FAQItem key={item.q} q={item.q} a={item.a} />
                ))}
              </div>
            ))}
          </div>

          <div className="ss-card mt-4 text-center">
            <h3 className="fw-bold mb-2" style={{ fontSize: "1.2rem", color: "#111" }}>Still have questions?</h3>
            <p className="small mb-3" style={{ color: "#4B5563" }}>Reach out to us directly and we'll get back to you within 24 hours.</p>
            <div className="d-flex flex-column align-items-center gap-2 mb-3">
              <span className="small" style={{ color: "#4B5563" }}>📞 +977 9815127051</span>
              <span className="small" style={{ color: "#4B5563" }}>✉️ stationerymanagementsystem25@gmail.com</span>
            </div>
            <button type="button" onClick={() => navigate("/about")} className="ss-btn-outline px-4 py-2">
              About Us
            </button>
          </div>
        </div>
      </section>
    </SharedLayout>
  );
};

export default FAQPage;
