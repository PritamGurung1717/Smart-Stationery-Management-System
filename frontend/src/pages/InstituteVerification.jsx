import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import toast from "../utils/toast.js";
import "../styles/landing.css";

const inp = { borderColor: "#E5E7EB", borderRadius: 8 };

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
      toast.success("Verification request submitted! Please wait for admin approval.");
      navigate("/institute-dashboard");
    } catch (err) {
      toast.error("Failed to submit: " + (err.response?.data?.message || err.message));
    } finally { setLoading(false); }
  };

  if (!user) return (
    <section style={{ background: "#F3F4F6", minHeight: "100vh" }} className="d-flex align-items-center justify-content-center">
      <div className="spinner-border" style={{ color: "#1D4ED8" }} role="status" />
    </section>
  );

  const verStatus = user.instituteVerification?.status;

  return (
    <section style={{ background: "#F3F4F6", minHeight: "100vh" }} className="py-5 px-3">
      <div style={{ maxWidth: 680, margin: "0 auto" }}>
        <div className="text-center mb-5">
          <div className="landing-brand mb-2" style={{ fontSize: "1.75rem", cursor: "pointer" }}
            onClick={() => navigate("/institute-dashboard")} role="button" tabIndex={0}>
            <span className="brand-smart">smart</span><span className="brand-stationery">stationery.</span>
          </div>
          <p className="ss-section-label mb-0">INSTITUTE VERIFICATION</p>
        </div>

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

        <div className="ss-card">
          <h2 className="ss-page-title mb-1" style={{ fontSize: "1.6rem" }}>Complete Verification</h2>
          <p className="small mb-4" style={{ color: "#4B5563" }}>Provide the details below to verify your institute and unlock bulk ordering.</p>

          <form onSubmit={handleSubmit}>
            <p className="ss-section-label mb-3 mt-2">Institute Information</p>
            <div className="row g-3 mb-3">
              <div className="col-6">
                <label className="form-label fw-semibold small">Institute Name *</label>
                <input name="instituteName" value={formData.instituteName} onChange={handleChange} required className="form-control" style={inp} />
              </div>
              <div className="col-6">
                <label className="form-label fw-semibold small">School / College Name *</label>
                <input name="schoolName" value={formData.schoolName} onChange={handleChange} required className="form-control" style={inp} />
              </div>
            </div>
            <div className="row g-3 mb-3">
              <div className="col-4">
                <label className="form-label fw-semibold small">Invoice Number *</label>
                <input name="invoiceNumber" value={formData.invoiceNumber} onChange={handleChange} required className="form-control" style={inp} />
              </div>
              <div className="col-4">
                <label className="form-label fw-semibold small">PAN Number *</label>
                <input name="panNumber" value={formData.panNumber} onChange={handleChange} required className="form-control" style={inp} />
              </div>
              <div className="col-4">
                <label className="form-label fw-semibold small">GST Number</label>
                <input name="gstNumber" value={formData.gstNumber} onChange={handleChange} className="form-control" style={inp} />
              </div>
            </div>
            <div className="row g-3 mb-3">
              <div className="col-6">
                <label className="form-label fw-semibold small">Contact Number *</label>
                <input type="tel" name="contactNumber" value={formData.contactNumber} onChange={handleChange} required className="form-control" style={inp} />
              </div>
              <div className="col-6">
                <label className="form-label fw-semibold small">Institute Type *</label>
                <select name="type" value={formData.type} onChange={handleChange} required className="form-select" style={inp}>
                  <option value="school">School</option>
                  <option value="college">College / University</option>
                  <option value="wholesaler">Wholesaler</option>
                </select>
              </div>
            </div>

            <p className="ss-section-label mb-3 mt-4">Additional Information</p>
            <div className="row g-3 mb-3">
              <div className="col-6">
                <label className="form-label fw-semibold small">Contact Person *</label>
                <input name="contactPerson" value={formData.contactPerson} onChange={handleChange} required className="form-control" style={inp} />
              </div>
              <div className="col-6">
                <label className="form-label fw-semibold small">Phone Number</label>
                <input type="tel" name="phone" value={formData.phone} onChange={handleChange} className="form-control" style={inp} />
              </div>
            </div>
            <div className="row g-3 mb-3">
              <div className="col-6">
                <label className="form-label fw-semibold small">Email</label>
                <input type="email" name="email" value={formData.email} onChange={handleChange} className="form-control" style={inp} />
              </div>
              <div className="col-6">
                <label className="form-label fw-semibold small">Grades / Classes <span className="fw-normal" style={{ color: "#9CA3AF" }}>(comma separated)</span></label>
                <input name="grades" value={formData.grades} onChange={handleChange} placeholder="e.g. 1, 2, 3 or FY, SY, TY" className="form-control" style={inp} />
              </div>
            </div>
            <div className="mb-4">
              <label className="form-label fw-semibold small">Address</label>
              <textarea name="address" value={formData.address} onChange={handleChange} rows={3}
                className="form-control" style={{ ...inp, resize: "vertical" }} />
            </div>

            <div className="d-flex justify-content-between align-items-center">
              <button type="button" onClick={() => navigate("/institute-dashboard")} className="ss-btn-outline px-4 py-2">
                Cancel
              </button>
              <button type="submit" disabled={loading} className={`landing-btn-primary border-0 px-4 ${loading ? "opacity-75" : ""}`}>
                {loading ? "Submitting…" : "Submit for Verification"}
              </button>
            </div>
          </form>
        </div>
      </div>
    </section>
  );
};

export default InstituteVerification;
