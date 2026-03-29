import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { FaChevronLeft } from "react-icons/fa";
import SharedLayout from "../components/SharedLayout.jsx";

const UserProfile = ({ setUser }) => {
  const navigate = useNavigate();
  const [user, setLocalUser] = useState(null);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState("profile");
  const [profileForm, setProfileForm] = useState({ name: "", email: "", phone: "", address: "" });
  const [passwordForm, setPasswordForm] = useState({ currentPassword: "", newPassword: "", confirmPassword: "" });

  useEffect(() => {
    const storedUser = JSON.parse(localStorage.getItem("user"));
    if (!storedUser) { navigate("/"); return; }
    setLocalUser(storedUser);
    setProfileForm({ name: storedUser.name || "", email: storedUser.email || "", phone: storedUser.phone || "", address: storedUser.address || "" });
  }, [navigate]);

  const handleProfileUpdate = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const token = localStorage.getItem("token");
      const res = await axios.put("http://localhost:5000/api/users/profile", profileForm, { headers: { Authorization: `Bearer ${token}` } });
      const updated = { ...user, ...res.data.user };
      localStorage.setItem("user", JSON.stringify(updated));
      setLocalUser(updated);
      if (setUser) setUser(updated);
      alert("Profile updated successfully!");
    } catch { alert("Failed to update profile"); }
    finally { setLoading(false); }
  };

  const handlePasswordUpdate = async (e) => {
    e.preventDefault();
    if (passwordForm.newPassword !== passwordForm.confirmPassword) { alert("New passwords don't match!"); return; }
    setLoading(true);
    try {
      const token = localStorage.getItem("token");
      await axios.put("http://localhost:5000/api/users/change-password", { currentPassword: passwordForm.currentPassword, newPassword: passwordForm.newPassword }, { headers: { Authorization: `Bearer ${token}` } });
      alert("Password changed successfully! Please login again.");
      localStorage.removeItem("user"); localStorage.removeItem("token");
      if (setUser) setUser(null);
      navigate("/");
    } catch (err) { alert("Failed: " + (err.response?.data?.message || err.message)); }
    finally { setLoading(false); }
  };

  const tabs = ["profile", "password", "account"];
  const tabLabels = { profile: "Profile Information", password: "Change Password", account: "Account Info" };

  if (!user) return (
    <SharedLayout>
      <div className="text-center py-5 text-muted">Loading…</div>
    </SharedLayout>
  );

  return (
    <SharedLayout>
      <div style={{ maxWidth: 800, margin: "0 auto" }} className="px-3 py-4">

        {/* Back button */}
        <button onClick={() => navigate("/dashboard")}
          className="btn btn-link p-0 text-secondary small d-inline-flex align-items-center gap-1 mb-3 text-decoration-none">
          <FaChevronLeft style={{ fontSize: "0.7rem" }} /> Back
        </button>

        {/* Page title — Instrument Serif kept as inline */}
        <h1 style={{ fontFamily: "'Instrument Serif', Georgia, serif", fontSize: "2.2rem", fontWeight: 400 }}
          className="mb-4">My Profile</h1>

        {/* Card */}
        <div className="border rounded-3 bg-white overflow-hidden">

          {/* Custom tabs — Bootstrap nav-tabs but styled to match the black underline design */}
          <div className="d-flex border-bottom">
            {tabs.map(t => (
              <button key={t} onClick={() => setActiveTab(t)}
                className="btn btn-link flex-fill py-3 text-decoration-none rounded-0"
                style={{
                  fontWeight: activeTab === t ? 700 : 500,
                  fontSize: "0.9rem",
                  color: activeTab === t ? "#111" : "#6b7280",
                  borderBottom: activeTab === t ? "2px solid #111" : "2px solid transparent",
                  transition: "all 0.15s"
                }}>
                {tabLabels[t]}
              </button>
            ))}
          </div>

          <div className="p-4">

            {/* ── Profile tab ── */}
            {activeTab === "profile" && (
              <form onSubmit={handleProfileUpdate}>
                <div className="row g-3 mb-3">
                  <div className="col-md-6">
                    <label className="form-label fw-semibold small text-dark">Full Name</label>
                    <input type="text" className="form-control" value={profileForm.name}
                      onChange={e => setProfileForm({ ...profileForm, name: e.target.value })} required />
                  </div>
                  <div className="col-md-6">
                    <label className="form-label fw-semibold small text-dark">Email</label>
                    <input type="email" className="form-control" value={profileForm.email}
                      onChange={e => setProfileForm({ ...profileForm, email: e.target.value })} required />
                  </div>
                  <div className="col-md-6">
                    <label className="form-label fw-semibold small text-dark">Phone Number</label>
                    <input type="tel" className="form-control" value={profileForm.phone}
                      onChange={e => setProfileForm({ ...profileForm, phone: e.target.value })} />
                  </div>
                </div>
                <div className="mb-4">
                  <label className="form-label fw-semibold small text-dark">Address</label>
                  <textarea className="form-control" rows={3} value={profileForm.address}
                    onChange={e => setProfileForm({ ...profileForm, address: e.target.value })}
                    style={{ resize: "vertical" }} />
                </div>
                <button type="submit" disabled={loading}
                  className={`btn btn-dark px-4 fw-bold ${loading ? "opacity-75" : ""}`}>
                  {loading ? "Updating…" : "Update Profile"}
                </button>
              </form>
            )}

            {/* ── Password tab ── */}
            {activeTab === "password" && (
              <form onSubmit={handlePasswordUpdate}>
                {[["currentPassword","Current Password"],["newPassword","New Password"],["confirmPassword","Confirm New Password"]].map(([field, lbl]) => (
                  <div key={field} className="mb-3">
                    <label className="form-label fw-semibold small text-dark">{lbl}</label>
                    <input type="password" className="form-control" value={passwordForm[field]}
                      onChange={e => setPasswordForm({ ...passwordForm, [field]: e.target.value })} required />
                  </div>
                ))}
                {/* Info box — alert-info gives the blue background */}
                <div className="alert alert-info small py-2 mb-4" role="alert">
                  Password requirements: min 8 characters, one uppercase, one number, one special character (@$!%*?&)
                </div>
                <button type="submit" disabled={loading}
                  className={`btn btn-dark px-4 fw-bold ${loading ? "opacity-75" : ""}`}>
                  {loading ? "Changing…" : "Change Password"}
                </button>
              </form>
            )}

            {/* ── Account tab ── */}
            {activeTab === "account" && (
              <div>
                {[
                  { label: "Account Type", value: user.role?.charAt(0).toUpperCase() + user.role?.slice(1) },
                  { label: "Account Status", value: user.status },
                  { label: "Email Verified", value: user.isVerified ? "Verified" : "Not Verified" },
                  { label: "Member Since", value: user.createdAt ? new Date(user.createdAt).toLocaleDateString() : "—" },
                ].map(row => (
                  <div key={row.label} className="d-flex justify-content-between py-3 border-bottom small">
                    <span className="text-muted">{row.label}</span>
                    <span className="fw-semibold">{row.value}</span>
                  </div>
                ))}
                {user.role === "institute" && user.instituteVerification && (
                  <div className="mt-4">
                    <h5 className="fw-bold mb-3">Institute Verification</h5>
                    <div className="d-flex justify-content-between py-3 border-bottom small">
                      <span className="text-muted">Status</span>
                      <span className="fw-semibold">{user.instituteVerification.status}</span>
                    </div>
                    {user.instituteInfo && (
                      <div className="d-flex justify-content-between py-3 small">
                        <span className="text-muted">Institute Name</span>
                        <span className="fw-semibold">{user.instituteInfo.schoolName}</span>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}

          </div>
        </div>
      </div>
    </SharedLayout>
  );
};

export default UserProfile;
