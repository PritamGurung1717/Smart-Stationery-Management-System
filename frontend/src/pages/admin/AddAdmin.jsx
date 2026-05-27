import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { FaSave, FaUserShield } from "react-icons/fa";
import AdminLayout from "../../components/AdminLayout.jsx";
import PageHeader from "../../components/admin/shared/PageHeader.jsx";

const API = "http://localhost:5000/api";
const authH = () => ({ Authorization: `Bearer ${localStorage.getItem("token")}` });

/* ─── Toast ─────────────────────────────────────────────────── */
const Toast = ({ msg, type, onClose }) => {
  if (!msg) return null;
  const bg = type === "error" ? "#fee2e2" : "#d1fae5";
  const color = type === "error" ? "#991b1b" : "#065f46";
  return (
    <div className="position-fixed d-flex align-items-center gap-2 px-4 py-3 rounded-3 shadow"
      style={{ bottom: 24, right: 24, background: bg, color, zIndex: 9999, fontSize: "0.875rem", fontWeight: 500 }}>
      {type === "error" ? "✕" : "✓"} {msg}
      <button className="btn btn-link p-0 ms-2" style={{ color, fontSize: "1rem" }} onClick={onClose}>×</button>
    </div>
  );
};

/* ─── Field ──────────────────────────────────────────────────── */
const Field = ({ label, required, children }) => (
  <div className="mb-3">
    <label className="form-label fw-medium small mb-1">
      {label}{required && <span className="text-danger ms-1">*</span>}
    </label>
    {children}
  </div>
);

const inputStyle = { borderColor: "#e5e7eb", borderRadius: 0, fontSize: "0.9rem" };

/* ─── AddAdmin ────────────────────────────────────────────────── */
const AddAdmin = () => {
  const navigate = useNavigate();
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState({ msg: "", type: "success" });

  const showToast = (msg, type = "success") => {
    setToast({ msg, type });
    setTimeout(() => setToast({ msg: "", type: "success" }), 3500);
  };

  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    phone: "",
    address: "",
  });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Validations
    if (!formData.name.trim()) {
      showToast("Name is required", "error");
      return;
    }
    if (!formData.email.trim()) {
      showToast("Email is required", "error");
      return;
    }
    if (!formData.password || formData.password.length < 6) {
      showToast("Password must be at least 6 characters long", "error");
      return;
    }

    setSaving(true);
    try {
      await axios.post(
        `${API}/users/admin/users/create`,
        {
          name: formData.name.trim(),
          email: formData.email.trim(),
          password: formData.password,
          role: "admin",
          phone: formData.phone.trim() || undefined,
          address: formData.address.trim() || undefined,
        },
        { headers: authH() }
      );

      showToast("Admin account created successfully!");
      setTimeout(() => {
        navigate("/admin-dashboard", { state: { tab: "users" } });
      }, 1500);
    } catch (err) {
      showToast(err.response?.data?.message || "Failed to create admin", "error");
    } finally {
      setSaving(false);
    }
  };

  return (
    <AdminLayout activeTab="users">
      <Toast msg={toast.msg} type={toast.type} onClose={() => setToast({ msg: "", type: "success" })} />

      <PageHeader
        subtitle="ADMINISTRATORS"
        title="Add New Admin"
        backPath="/admin-dashboard"
        backState={{ tab: "users" }}
        backLabel="Back to Users"
      />

      <form onSubmit={handleSubmit} style={{ maxWidth: "680px" }}>
        <div className="ss-card p-4 mb-4">
          <div className="d-flex align-items-center gap-2 mb-4 pb-2 border-bottom" style={{ borderColor: "#e5e7eb" }}>
            <FaUserShield style={{ fontSize: "1.2rem", color: "#1D4ED8" }} />
            <p className="text-uppercase fw-bold text-muted mb-0" style={{ fontSize: "0.65rem", letterSpacing: "0.1em" }}>
              ADMIN ACCOUNT DETAILS
            </p>
          </div>

          <Field label="Full Name" required>
            <input
              name="name"
              value={formData.name}
              onChange={handleChange}
              required
              className="form-control"
              style={inputStyle}
              placeholder="e.g., Jane Doe"
            />
          </Field>

          <div className="row g-3">
            <div className="col-md-6">
              <Field label="Email Address" required>
                <input
                  name="email"
                  type="email"
                  value={formData.email}
                  onChange={handleChange}
                  required
                  className="form-control"
                  style={inputStyle}
                  placeholder="name@example.com"
                />
              </Field>
            </div>
            <div className="col-md-6">
              <Field label="Password" required>
                <input
                  name="password"
                  type="password"
                  value={formData.password}
                  onChange={handleChange}
                  required
                  className="form-control"
                  style={inputStyle}
                  placeholder="Min. 6 characters"
                />
              </Field>
            </div>
          </div>

          <div className="row g-3">
            <div className="col-md-6">
              <Field label="Phone Number">
                <input
                  name="phone"
                  value={formData.phone}
                  onChange={handleChange}
                  className="form-control"
                  style={inputStyle}
                  placeholder="e.g., +91 98765 43210"
                />
              </Field>
            </div>
            <div className="col-md-6">
              <Field label="Address">
                <input
                  name="address"
                  value={formData.address}
                  onChange={handleChange}
                  className="form-control"
                  style={inputStyle}
                  placeholder="e.g., Kathmandu, Nepal"
                />
              </Field>
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="d-flex justify-content-between align-items-center mt-4 pt-4" style={{ borderTop: "1px solid #e5e7eb" }}>
          <button
            type="button"
            onClick={() => navigate("/admin-dashboard", { state: { tab: "users" } })}
            className="btn ss-btn-outline px-4"
            disabled={saving}
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={saving}
            className="btn landing-btn-primary fw-bold px-5 d-flex align-items-center gap-2"
          >
            {saving ? (
              <>
                <span className="spinner-border spinner-border-sm" /> Creating…
              </>
            ) : (
              <>
                <FaSave style={{ fontSize: "0.85rem" }} /> Create Admin
              </>
            )}
          </button>
        </div>
      </form>
    </AdminLayout>
  );
};

export default AddAdmin;
