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
    if (!storedUser || storedUser.role !== "institute") { navigate("/"); return; }
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
    } finally { setLoading(false); }
  };

  if (!user) return (
    <div className="d-flex align-items-center justify-content-center text-muted" style={{ minHeight: "100vh" }}>Loading…</div>
  );

  const verStatus = user.instituteVerification?.status;

  return (
    <div className="min-vh-100 bg-light py-5 px-3" style={{ fontFamily: "'Inter', sans-serif" }}>
      <div style={{ maxWidth: 680, margin: "0 auto" }}>

        {/* Brand */}
        <div className="text-center mb-5">
          <div style={{ fontFamily: "'Instrument Serif', Georgia, serif", fontSize: "1.75rem", fontWeight: 400, color: "#111", letterSpacing: "-0.02em", cursor: "pointer" }}
            onClick={() => navigate("/institute-dashboard")}>
            smartstationery.
          </div>
          <p className="text-muted small mt-1 mb-0">Institute Verification</p>
        </div>

        {/* Status banners */}
        {verStatus === "pending" && (
          <div className="alert alert-warning mb-4">
            <div className="fw-bold mb-1">Verification Pending</div>
            <div className="small">Your request is under review. You'll be notified once approved.</div>
            {user.instituteVerification?.comments && (
              <div className="small mt-1">Comments: {user.instituteVerification.comments}</div>
            )}
          </div>
        )}
        {verStatus === "rejected" && (
          <div className="alert alert-danger mb-4">
            <div className="fw-bold mb-1">Verification Rejected</div>
            <div className="small">Please update your information and resubmit.</div>
            {user.instituteVerification?.comments && (
              <div className="small mt-1">Reason: {user.instituteVerification.comments}</div>
            )}
          </div>
        )}

        {/* Card */}
        <div className="card border rounded-3 p-4 shadow-sm">
          <h2 style={{ fontFamily: "'Instrument Serif', Georgia, serif", fontSize: "1.6rem", fontWeight: 400 }} className="mb-1">
            Complete Verification
          </h2>
          <p className="text-muted small mb-4">Provide the details below to verify your institute and unlock bulk ordering.</p>

          <form onSubmit={handleSubmit}>
            {/* Institute Info */}
            <p className="text-uppercase fw-bold small text-muted mb-3 mt-4" style={{ letterSpacing: "0.1em" }}>Institute Information</p>
            <div className="row g-3 mb-3">
              <div className="col-6">
                <label className="form-label fw-semibold small">Institute Name *</label>
                <input name="instituteName" value={formData.instituteName} onChange={handleChange} required className="form-control" />
              </div>
              <div className="col-6">
                <label className="form-label fw-semibold small">School / College Name *</label>
                <input name="schoolName" value={formData.schoolName} onChange={handleChange} required className="form-control" />
              </div>
            </div>
            <div className="row g-3 mb-3">
              <div className="col-4">
                <label className="form-label fw-semibold small">Invoice Number *</label>
                <input name="invoiceNumber" value={formData.invoiceNumber} onChange={handleChange} required className="form-control" />
              </div>
              <div className="col-4">
                <label className="form-label fw-semibold small">PAN Number *</label>
                <input name="panNumber" value={formData.panNumber} onChange={handleChange} required className="form-control" />
              </div>
              <div className="col-4">
                <label className="form-label fw-semibold small">GST Number</label>
                <input name="gstNumber" value={formData.gstNumber} onChange={handleChange} className="form-control" />
              </div>
            </div>
            <div className="row g-3 mb-3">
              <div className="col-6">
                <label className="form-label fw-semibold small">Contact Number *</label>
                <input type="tel" name="contactNumber" value={formData.contactNumber} onChange={handleChange} required className="form-control" />
              </div>
              <div className="col-6">
                <label className="form-label fw-semibold small">Institute Type *</label>
                <select name="type" value={formData.type} onChange={handleChange} required className="form-select">
                  <option value="school">School</option>
                  <option value="college">College / University</option>
                  <option value="wholesaler">Wholesaler</option>
                </select>
              </div>
            </div>

            {/* Additional Info */}
            <p className="text-uppercase fw-bold small text-muted mb-3 mt-4" style={{ letterSpacing: "0.1em" }}>Additional Information</p>
            <div className="row g-3 mb-3">
              <div className="col-6">
                <label className="form-label fw-semibold small">Contact Person *</label>
                <input name="contactPerson" value={formData.contactPerson} onChange={handleChange} required className="form-control" />
              </div>
              <div className="col-6">
                <label className="form-label fw-semibold small">Phone Number</label>
                <input type="tel" name="phone" value={formData.phone} onChange={handleChange} className="form-control" />
              </div>
            </div>
            <div className="row g-3 mb-3">
              <div className="col-6">
                <label className="form-label fw-semibold small">Email</label>
                <input type="email" name="email" value={formData.email} onChange={handleChange} className="form-control" />
              </div>
              <div className="col-6">
                <label className="form-label fw-semibold small">Grades / Classes <span className="text-muted fw-normal">(comma separated)</span></label>
                <input name="grades" value={formData.grades} onChange={handleChange} placeholder="e.g. 1, 2, 3 or FY, SY, TY" className="form-control" />
              </div>
            </div>
            <div className="mb-4">
              <label className="form-label fw-semibold small">Address</label>
              <textarea name="address" value={formData.address} onChange={handleChange} rows={3}
                className="form-control" style={{ resize: "vertical" }} />
            </div>

            <div className="d-flex justify-content-between align-items-center">
              <button type="button" onClick={() => navigate("/institute-dashboard")}
                className="btn btn-light border fw-semibold">Cancel</button>
              <button type="submit" disabled={loading}
                className={`btn btn-dark fw-semibold px-4 ${loading ? "opacity-75" : ""}`}>
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
