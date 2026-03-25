import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";

const InstituteVerification = ({ setUser }) => {
  const navigate = useNavigate();
  const [user, setLocalUser] = useState(null);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    instituteName: "", invoiceNumber: "", panNumber: "", gstNumber: "",
    contactNumber: "", schoolName: "", type: "school", address: "",
    contactPerson: "", phone: "", email: "", grades: "",
  });

  useEffect(() => {
    const storedUser = JSON.parse(localStorage.getItem("user") || "null");
    if (!storedUser || storedUser.role !== "institute") { navigate("/login"); return; }
    setLocalUser(storedUser);
    if (storedUser.instituteVerification) {
      setFormData(p => ({ ...p,
        instituteName: storedUser.instituteVerification.instituteName || "",
        invoiceNumber: storedUser.instituteVerification.invoiceNumber || "",
        panNumber: storedUser.instituteVerification.panNumber || "",
        gstNumber: storedUser.instituteVerification.gstNumber || "",
        contactNumber: storedUser.instituteVerification.contactNumber || "",
      }));
    }
    if (storedUser.instituteInfo) {
      setFormData(p => ({ ...p,
        schoolName: storedUser.instituteInfo.schoolName || "",
        type: storedUser.instituteInfo.type || "school",
        address: storedUser.instituteInfo.address || "",
        contactPerson: storedUser.instituteInfo.contactPerson || "",
        phone: storedUser.instituteInfo.phone || "",
        email: storedUser.instituteInfo.email || "",
        grades: storedUser.instituteInfo.grades?.join(", ") || "",
      }));
    }
  }, [navigate]);

  const handleChange = (e) => setFormData(p => ({ ...p, [e.target.name]: e.target.value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const token = localStorage.getItem("token");
      const gradesArray = formData.grades.split(",").map(g => g.trim()).filter(Boolean);
      const res = await axios.post(
        "http://localhost:5000/api/users/institute/verification/submit",
        { ...formData, grades: gradesArray },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      const updatedUser = { ...user, instituteVerification: res.data.verification, instituteInfo: res.data.instituteInfo };
      localStorage.setItem("user", JSON.stringify(updatedUser));
      setLocalUser(updatedUser);
      alert("Verification request submitted! Please wait for admin approval.");
      navigate("/institute-dashboard");
    } catch (err) {
      alert("Failed to submit: " + (err.response?.data?.message || err.message));
    } finally {
      setLoading(false);
    }
  };

  const inputStyle = {
    width: "100%", border: "1px solid #e5e7eb", borderRadius: 8,
    padding: "0.65rem 0.85rem", fontSize: "0.875rem", outline: "none",
    boxSizing: "border-box", fontFamily: "'Inter', sans-serif", background: "#fff",
  };
  const labelStyle = { display: "block", fontSize: "0.82rem", fontWeight: 600, color: "#374151", marginBottom: "0.4rem" };
  const sectionLabel = { fontSize: "0.72rem", fontWeight: 700, letterSpacing: "0.1em", color: "#9ca3af", textTransform: "uppercase", marginBottom: "1rem", marginTop: "1.75rem" };

  if (!user) return (
    <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "'Inter', sans-serif", color: "#9ca3af" }}>
      Loading…
    </div>
  );

  const verStatus = user.instituteVerification?.status;

  return (
    <div style={{ minHeight: "100vh", background: "#fafafa", fontFamily: "'Inter', sans-serif", padding: "3rem 1rem" }}>
      <div style={{ maxWidth: 680, margin: "0 auto" }}>

        {/* Brand */}
        <div style={{ textAlign: "center", marginBottom: "2.5rem" }}>
          <div style={{ fontFamily: "'Instrument Serif', Georgia, serif", fontSize: "1.75rem", fontWeight: 400, color: "#111", letterSpacing: "-0.02em", cursor: "pointer" }}
            onClick={() => navigate("/institute-dashboard")}>
            smartstationery.
          </div>
          <p style={{ color: "#6b7280", fontSize: "0.875rem", marginTop: "0.4rem" }}>Institute Verification</p>
        </div>

        {/* Status banners */}
        {verStatus === "pending" && (
          <div style={{ background: "#fffbeb", border: "1px solid #fde68a", borderRadius: 10, padding: "1rem 1.25rem", marginBottom: "1.5rem" }}>
            <div style={{ fontWeight: 700, color: "#92400e", marginBottom: "0.25rem" }}>Verification Pending</div>
            <div style={{ fontSize: "0.875rem", color: "#78350f" }}>Your request is under review. You'll be notified once approved.</div>
            {user.instituteVerification?.comments && (
              <div style={{ fontSize: "0.875rem", color: "#78350f", marginTop: "0.4rem" }}>Comments: {user.instituteVerification.comments}</div>
            )}
          </div>
        )}
        {verStatus === "rejected" && (
          <div style={{ background: "#fef2f2", border: "1px solid #fecaca", borderRadius: 10, padding: "1rem 1.25rem", marginBottom: "1.5rem" }}>
            <div style={{ fontWeight: 700, color: "#991b1b", marginBottom: "0.25rem" }}>Verification Rejected</div>
            <div style={{ fontSize: "0.875rem", color: "#7f1d1d" }}>Please update your information and resubmit.</div>
            {user.instituteVerification?.comments && (
              <div style={{ fontSize: "0.875rem", color: "#7f1d1d", marginTop: "0.4rem" }}>Reason: {user.instituteVerification.comments}</div>
            )}
          </div>
        )}

        {/* Card */}
        <div style={{ background: "#fff", border: "1px solid #e5e7eb", borderRadius: 16, padding: "2rem 2rem 2.5rem" }}>
          <h2 style={{ fontFamily: "'Instrument Serif', Georgia, serif", fontSize: "1.6rem", fontWeight: 400, color: "#111", margin: "0 0 0.4rem" }}>
            Complete Verification
          </h2>
          <p style={{ color: "#6b7280", fontSize: "0.875rem", marginBottom: 0 }}>
            Provide the details below to verify your institute and unlock bulk ordering.
          </p>

          <form onSubmit={handleSubmit}>
            {/* Institute Info */}
            <p style={sectionLabel}>Institute Information</p>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem", marginBottom: "1rem" }}>
              <div>
                <label style={labelStyle}>Institute Name *</label>
                <input name="instituteName" value={formData.instituteName} onChange={handleChange} required style={inputStyle}
                  onFocus={e => e.target.style.borderColor = "#111"} onBlur={e => e.target.style.borderColor = "#e5e7eb"} />
              </div>
              <div>
                <label style={labelStyle}>School / College Name *</label>
                <input name="schoolName" value={formData.schoolName} onChange={handleChange} required style={inputStyle}
                  onFocus={e => e.target.style.borderColor = "#111"} onBlur={e => e.target.style.borderColor = "#e5e7eb"} />
              </div>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "1rem", marginBottom: "1rem" }}>
              <div>
                <label style={labelStyle}>Invoice Number *</label>
                <input name="invoiceNumber" value={formData.invoiceNumber} onChange={handleChange} required style={inputStyle}
                  onFocus={e => e.target.style.borderColor = "#111"} onBlur={e => e.target.style.borderColor = "#e5e7eb"} />
              </div>
              <div>
                <label style={labelStyle}>PAN Number *</label>
                <input name="panNumber" value={formData.panNumber} onChange={handleChange} required style={inputStyle}
                  onFocus={e => e.target.style.borderColor = "#111"} onBlur={e => e.target.style.borderColor = "#e5e7eb"} />
              </div>
              <div>
                <label style={labelStyle}>GST Number</label>
                <input name="gstNumber" value={formData.gstNumber} onChange={handleChange} style={inputStyle}
                  onFocus={e => e.target.style.borderColor = "#111"} onBlur={e => e.target.style.borderColor = "#e5e7eb"} />
              </div>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem", marginBottom: "1rem" }}>
              <div>
                <label style={labelStyle}>Contact Number *</label>
                <input type="tel" name="contactNumber" value={formData.contactNumber} onChange={handleChange} required style={inputStyle}
                  onFocus={e => e.target.style.borderColor = "#111"} onBlur={e => e.target.style.borderColor = "#e5e7eb"} />
              </div>
              <div>
                <label style={labelStyle}>Institute Type *</label>
                <select name="type" value={formData.type} onChange={handleChange} required
                  style={{ ...inputStyle, cursor: "pointer" }}>
                  <option value="school">School</option>
                  <option value="college">College / University</option>
                  <option value="wholesaler">Wholesaler</option>
                </select>
              </div>
            </div>

            {/* Additional Info */}
            <p style={sectionLabel}>Additional Information</p>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem", marginBottom: "1rem" }}>
              <div>
                <label style={labelStyle}>Contact Person *</label>
                <input name="contactPerson" value={formData.contactPerson} onChange={handleChange} required style={inputStyle}
                  onFocus={e => e.target.style.borderColor = "#111"} onBlur={e => e.target.style.borderColor = "#e5e7eb"} />
              </div>
              <div>
                <label style={labelStyle}>Phone Number</label>
                <input type="tel" name="phone" value={formData.phone} onChange={handleChange} style={inputStyle}
                  onFocus={e => e.target.style.borderColor = "#111"} onBlur={e => e.target.style.borderColor = "#e5e7eb"} />
              </div>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem", marginBottom: "1rem" }}>
              <div>
                <label style={labelStyle}>Email</label>
                <input type="email" name="email" value={formData.email} onChange={handleChange} style={inputStyle}
                  onFocus={e => e.target.style.borderColor = "#111"} onBlur={e => e.target.style.borderColor = "#e5e7eb"} />
              </div>
              <div>
                <label style={labelStyle}>Grades / Classes <span style={{ color: "#9ca3af", fontWeight: 400 }}>(comma separated)</span></label>
                <input name="grades" value={formData.grades} onChange={handleChange} placeholder="e.g. 1, 2, 3 or FY, SY, TY" style={inputStyle}
                  onFocus={e => e.target.style.borderColor = "#111"} onBlur={e => e.target.style.borderColor = "#e5e7eb"} />
              </div>
            </div>

            <div style={{ marginBottom: "2rem" }}>
              <label style={labelStyle}>Address</label>
              <textarea name="address" value={formData.address} onChange={handleChange} rows={3}
                style={{ ...inputStyle, resize: "vertical", lineHeight: 1.5 }}
                onFocus={e => e.target.style.borderColor = "#111"} onBlur={e => e.target.style.borderColor = "#e5e7eb"} />
            </div>

            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <button type="button" onClick={() => navigate("/institute-dashboard")}
                style={{ background: "#fff", border: "1px solid #e5e7eb", borderRadius: 8, padding: "0.65rem 1.25rem", fontWeight: 600, fontSize: "0.875rem", cursor: "pointer", fontFamily: "'Inter', sans-serif" }}>
                Cancel
              </button>
              <button type="submit" disabled={loading}
                style={{ background: loading ? "#6b7280" : "#111", color: "#fff", border: "none", borderRadius: 8, padding: "0.65rem 1.75rem", fontWeight: 600, fontSize: "0.875rem", cursor: loading ? "not-allowed" : "pointer", fontFamily: "'Inter', sans-serif" }}>
                {loading ? "Submitting…" : "Submit for Verification"}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default InstituteVerification;
