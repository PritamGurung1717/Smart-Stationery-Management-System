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
    if (!storedUser) { navigate("/login"); return; }
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
      navigate("/login");
    } catch (err) { alert("Failed: " + (err.response?.data?.message || err.message)); }
    finally { setLoading(false); }
  };

  const inp = { border: "1px solid #e5e7eb", borderRadius: 8, padding: "0.55rem 0.75rem", fontSize: "0.9rem", outline: "none", width: "100%", boxSizing: "border-box", fontFamily: "inherit" };
  const label = { display: "block", fontSize: "0.82rem", fontWeight: 600, color: "#374151", marginBottom: "0.35rem" };
  const tabs = ["profile", "password", "account"];
  const tabLabels = { profile: "Profile Information", password: "Change Password", account: "Account Info" };

  if (!user) return (
    <SharedLayout>
      <div style={{ textAlign: "center", padding: "6rem", color: "#9ca3af" }}>Loading…</div>
    </SharedLayout>
  );

  return (
    <SharedLayout>
      <div style={{ maxWidth: 800, margin: "0 auto", padding: "2.5rem 1.5rem" }}>
        <button onClick={() => navigate("/dashboard")}
          style={{ background: "none", border: "none", cursor: "pointer", color: "#6b7280", fontSize: "0.875rem", display: "inline-flex", alignItems: "center", gap: "0.4rem", padding: 0, marginBottom: "1.5rem" }}>
          <FaChevronLeft style={{ fontSize: "0.7rem" }} /> Back
        </button>
        <h1 style={{ fontFamily: "'Instrument Serif', Georgia, serif", fontSize: "2.2rem", fontWeight: 400, marginBottom: "2rem" }}>My Profile</h1>

        <div style={{ border: "1px solid #e5e7eb", borderRadius: 14, background: "#fff", overflow: "hidden" }}>
          {/* Tabs */}
          <div style={{ display: "flex", borderBottom: "1px solid #e5e7eb" }}>
            {tabs.map(t => (
              <button key={t} onClick={() => setActiveTab(t)}
                style={{ flex: 1, padding: "1rem", background: "none", border: "none", cursor: "pointer", fontWeight: activeTab === t ? 700 : 500, fontSize: "0.9rem", color: activeTab === t ? "#111" : "#6b7280", borderBottom: activeTab === t ? "2px solid #111" : "2px solid transparent", transition: "all 0.15s" }}>
                {tabLabels[t]}
              </button>
            ))}
          </div>

          <div style={{ padding: "2rem" }}>
            {/* Profile tab */}
            {activeTab === "profile" && (
              <form onSubmit={handleProfileUpdate}>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1.25rem", marginBottom: "1.25rem" }}>
                  <div>
                    <label style={label}>Full Name</label>
                    <input type="text" value={profileForm.name} onChange={e => setProfileForm({ ...profileForm, name: e.target.value })} style={inp} required />
                  </div>
                  <div>
                    <label style={label}>Email</label>
                    <input type="email" value={profileForm.email} onChange={e => setProfileForm({ ...profileForm, email: e.target.value })} style={inp} required />
                  </div>
                  <div>
                    <label style={label}>Phone Number</label>
                    <input type="tel" value={profileForm.phone} onChange={e => setProfileForm({ ...profileForm, phone: e.target.value })} style={inp} />
                  </div>
                </div>
                <div style={{ marginBottom: "1.5rem" }}>
                  <label style={label}>Address</label>
                  <textarea value={profileForm.address} onChange={e => setProfileForm({ ...profileForm, address: e.target.value })} rows={3} style={{ ...inp, resize: "vertical" }} />
                </div>
                <button type="submit" disabled={loading} style={{ background: "#111", color: "#fff", border: "none", borderRadius: 10, padding: "0.7rem 2rem", fontWeight: 700, fontSize: "0.9rem", cursor: loading ? "not-allowed" : "pointer", opacity: loading ? 0.7 : 1 }}>
                  {loading ? "Updating…" : "Update Profile"}
                </button>
              </form>
            )}

            {/* Password tab */}
            {activeTab === "password" && (
              <form onSubmit={handlePasswordUpdate}>
                {[["currentPassword","Current Password"],["newPassword","New Password"],["confirmPassword","Confirm New Password"]].map(([field, lbl]) => (
                  <div key={field} style={{ marginBottom: "1.25rem" }}>
                    <label style={label}>{lbl}</label>
                    <input type="password" value={passwordForm[field]} onChange={e => setPasswordForm({ ...passwordForm, [field]: e.target.value })} style={inp} required />
                  </div>
                ))}
                <div style={{ background: "#eff6ff", borderRadius: 10, padding: "1rem", fontSize: "0.85rem", color: "#1e40af", marginBottom: "1.5rem" }}>
                  Password requirements: min 8 characters, one uppercase, one number, one special character (@$!%*?&)
                </div>
                <button type="submit" disabled={loading} style={{ background: "#111", color: "#fff", border: "none", borderRadius: 10, padding: "0.7rem 2rem", fontWeight: 700, fontSize: "0.9rem", cursor: loading ? "not-allowed" : "pointer", opacity: loading ? 0.7 : 1 }}>
                  {loading ? "Changing…" : "Change Password"}
                </button>
              </form>
            )}

            {/* Account tab */}
            {activeTab === "account" && (
              <div>
                {[
                  { label: "Account Type", value: user.role?.charAt(0).toUpperCase() + user.role?.slice(1) },
                  { label: "Account Status", value: user.status },
                  { label: "Email Verified", value: user.isVerified ? "Verified" : "Not Verified" },
                  { label: "Member Since", value: user.createdAt ? new Date(user.createdAt).toLocaleDateString() : "—" },
                ].map(row => (
                  <div key={row.label} style={{ display: "flex", justifyContent: "space-between", padding: "0.85rem 0", borderBottom: "1px solid #f3f4f6", fontSize: "0.9rem" }}>
                    <span style={{ color: "#6b7280" }}>{row.label}</span>
                    <span style={{ fontWeight: 600 }}>{row.value}</span>
                  </div>
                ))}
                {user.role === "institute" && user.instituteVerification && (
                  <div style={{ marginTop: "1.5rem" }}>
                    <h5 style={{ fontWeight: 700, marginBottom: "0.75rem" }}>Institute Verification</h5>
                    <div style={{ display: "flex", justifyContent: "space-between", padding: "0.85rem 0", borderBottom: "1px solid #f3f4f6", fontSize: "0.9rem" }}>
                      <span style={{ color: "#6b7280" }}>Status</span>
                      <span style={{ fontWeight: 600 }}>{user.instituteVerification.status}</span>
                    </div>
                    {user.instituteInfo && (
                      <div style={{ display: "flex", justifyContent: "space-between", padding: "0.85rem 0", fontSize: "0.9rem" }}>
                        <span style={{ color: "#6b7280" }}>Institute Name</span>
                        <span style={{ fontWeight: 600 }}>{user.instituteInfo.schoolName}</span>
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
