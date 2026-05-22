import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { FaChevronLeft, FaEnvelope, FaKey, FaLock } from "react-icons/fa";
import SharedLayout from "../components/SharedLayout.jsx";
import toast from "../utils/toast.js";

const API = "http://localhost:5000/api";

const UserProfile = ({ setUser }) => {
  const navigate = useNavigate();
  const [user, setLocalUser] = useState(null);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState("profile");
  const [profileForm, setProfileForm] = useState({ name: "", email: "", phone: "", address: "" });

  // Password change — 3 steps: "request" → "verify" → done
  const [pwStep, setPwStep] = useState("request"); // "request" | "verify"
  const [otp, setOtp] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [otpSending, setOtpSending] = useState(false);
  const [resendCooldown, setResendCooldown] = useState(0);

  useEffect(() => {
    const storedUser = JSON.parse(localStorage.getItem("user"));
    if (!storedUser) { navigate("/"); return; }
    setLocalUser(storedUser);
    setProfileForm({ name: storedUser.name || "", email: storedUser.email || "", phone: storedUser.phone || "", address: storedUser.address || "" });
  }, [navigate]);

  // Countdown timer for resend cooldown
  useEffect(() => {
    if (resendCooldown <= 0) return;
    const t = setTimeout(() => setResendCooldown(c => c - 1), 1000);
    return () => clearTimeout(t);
  }, [resendCooldown]);

  const handleProfileUpdate = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const token = localStorage.getItem("token");
      // Only send allowed fields — email cannot be changed via this endpoint
      const { name, phone, address } = profileForm;
      const res = await axios.put(`${API}/users/profile`, { name, phone, address }, { headers: { Authorization: `Bearer ${token}` } });
      const updated = { ...user, ...res.data.user };
      localStorage.setItem("user", JSON.stringify(updated));
      setLocalUser(updated);
      if (setUser) setUser(updated);
      toast.success("Profile updated successfully!");
    } catch { toast.error("Failed to update profile"); }
    finally { setLoading(false); }
  };

  // Step 1 — send OTP to user's email
  const handleSendOtp = async () => {
    setOtpSending(true);
    try {
      const token = localStorage.getItem("token");
      await axios.post(`${API}/users/send-change-password-otp`, {}, { headers: { Authorization: `Bearer ${token}` } });
      toast.success(`OTP sent to ${user.email}`);
      setPwStep("verify");
      setResendCooldown(60);
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to send OTP");
    } finally { setOtpSending(false); }
  };

  // Step 2 — verify OTP + set new password
  const handleVerifyOtp = async (e) => {
    e.preventDefault();
    if (newPassword !== confirmPassword) { toast.error("Passwords don't match!"); return; }
    if (newPassword.length < 8) { toast.error("Password must be at least 8 characters"); return; }
    setLoading(true);
    try {
      const token = localStorage.getItem("token");
      await axios.post(`${API}/users/verify-change-password-otp`, { otp, newPassword }, { headers: { Authorization: `Bearer ${token}` } });
      toast.success("Password changed successfully! Please login again.");
      localStorage.removeItem("user"); localStorage.removeItem("token");
      if (setUser) setUser(null);
      navigate("/");
    } catch (err) {
      toast.error(err.response?.data?.message || "Invalid or expired OTP");
    } finally { setLoading(false); }
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
              <button key={t} onClick={() => { setActiveTab(t); if (t === "password") { setPwStep("request"); setOtp(""); setNewPassword(""); setConfirmPassword(""); } }}
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
                    <input type="email" className="form-control bg-light" value={profileForm.email} readOnly
                      title="Email cannot be changed" style={{ cursor: "not-allowed" }} />
                    <div className="form-text text-muted" style={{ fontSize: "0.75rem" }}>Email cannot be changed</div>
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
              <div>
                {/* Step indicator */}
                <div className="d-flex align-items-center gap-2 mb-4">
                  {[{ n: 1, label: "Request OTP" }, { n: 2, label: "Verify & Set Password" }].map(({ n, label }) => {
                    const active = (n === 1 && pwStep === "request") || (n === 2 && pwStep === "verify");
                    const done = n === 1 && pwStep === "verify";
                    return (
                      <div key={n} className="d-flex align-items-center gap-2">
                        <div style={{
                          width: 28, height: 28, borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center",
                          background: done ? "#16a34a" : active ? "#111" : "#e5e7eb",
                          color: done || active ? "#fff" : "#9ca3af",
                          fontSize: "0.8rem", fontWeight: 700, flexShrink: 0
                        }}>
                          {done ? "✓" : n}
                        </div>
                        <span style={{ fontSize: "0.85rem", fontWeight: active ? 700 : 500, color: active ? "#111" : "#6b7280" }}>{label}</span>
                        {n < 2 && <div style={{ width: 32, height: 2, background: pwStep === "verify" ? "#16a34a" : "#e5e7eb", margin: "0 4px" }} />}
                      </div>
                    );
                  })}
                </div>

                {/* Step 1 — Request OTP */}
                {pwStep === "request" && (
                  <div>
                    <div className="border rounded-3 p-4 mb-4" style={{ background: "#f9fafb" }}>
                      <div className="d-flex align-items-center gap-3 mb-3">
                        <div style={{ width: 44, height: 44, borderRadius: "50%", background: "#dbeafe", display: "flex", alignItems: "center", justifyContent: "center" }}>
                          <FaEnvelope style={{ color: "#2563eb", fontSize: "1.1rem" }} />
                        </div>
                        <div>
                          <div className="fw-bold" style={{ fontSize: "0.95rem" }}>Verify your identity</div>
                          <div className="text-muted" style={{ fontSize: "0.82rem" }}>
                            We'll send a one-time password to <strong>{user.email}</strong>
                          </div>
                        </div>
                      </div>
                      <p className="text-muted small mb-0">
                        For your security, we verify your identity before allowing a password change. Click the button below to receive an OTP on your registered email.
                      </p>
                    </div>
                    <button onClick={handleSendOtp} disabled={otpSending}
                      className={`btn btn-dark px-4 fw-bold ${otpSending ? "opacity-75" : ""}`}>
                      {otpSending ? (
                        <><span className="spinner-border spinner-border-sm me-2" />Sending OTP…</>
                      ) : (
                        <><FaEnvelope className="me-2" />Send OTP to my email</>
                      )}
                    </button>
                  </div>
                )}

                {/* Step 2 — Enter OTP + new password */}
                {pwStep === "verify" && (
                  <form onSubmit={handleVerifyOtp}>
                    <div className="alert alert-success small py-2 mb-4 d-flex align-items-center gap-2" role="alert">
                      <FaEnvelope />
                      OTP sent to <strong>{user.email}</strong>. Check your inbox (and spam folder).
                    </div>

                    {/* OTP input */}
                    <div className="mb-4">
                      <label className="form-label fw-semibold small text-dark d-flex align-items-center gap-2">
                        <FaKey style={{ color: "#6b7280" }} /> Enter OTP
                      </label>
                      <input
                        type="text"
                        className="form-control"
                        placeholder="Enter 6-digit OTP"
                        value={otp}
                        onChange={e => setOtp(e.target.value.replace(/\D/g, "").slice(0, 6))}
                        maxLength={6}
                        required
                        style={{ letterSpacing: "0.3em", fontSize: "1.2rem", fontWeight: 700, textAlign: "center", maxWidth: 220 }}
                      />
                      <div className="mt-2">
                        {resendCooldown > 0 ? (
                          <span className="text-muted small">Resend OTP in {resendCooldown}s</span>
                        ) : (
                          <button type="button" onClick={handleSendOtp} disabled={otpSending}
                            className="btn btn-link p-0 small text-decoration-none fw-semibold">
                            {otpSending ? "Sending…" : "Resend OTP"}
                          </button>
                        )}
                      </div>
                    </div>

                    <hr className="my-4" />

                    {/* New password fields */}
                    <div className="mb-3">
                      <label className="form-label fw-semibold small text-dark d-flex align-items-center gap-2">
                        <FaLock style={{ color: "#6b7280" }} /> New Password
                      </label>
                      <input type="password" className="form-control" placeholder="Min 8 characters"
                        value={newPassword} onChange={e => setNewPassword(e.target.value)} required minLength={8} />
                    </div>
                    <div className="mb-3">
                      <label className="form-label fw-semibold small text-dark d-flex align-items-center gap-2">
                        <FaLock style={{ color: "#6b7280" }} /> Confirm New Password
                      </label>
                      <input type="password" className="form-control" placeholder="Repeat new password"
                        value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)} required minLength={8} />
                      {confirmPassword && newPassword !== confirmPassword && (
                        <div className="text-danger small mt-1">Passwords don't match</div>
                      )}
                    </div>

                    <div className="alert alert-info small py-2 mb-4" role="alert">
                      Password requirements: min 8 characters, one uppercase, one number, one special character (@$!%*?&)
                    </div>

                    <div className="d-flex gap-2">
                      <button type="button" onClick={() => { setPwStep("request"); setOtp(""); setNewPassword(""); setConfirmPassword(""); }}
                        className="btn btn-outline-secondary fw-semibold px-4">
                        Back
                      </button>
                      <button type="submit" disabled={loading || otp.length < 6 || !newPassword || newPassword !== confirmPassword}
                        className={`btn btn-dark px-4 fw-bold ${loading ? "opacity-75" : ""}`}>
                        {loading ? (
                          <><span className="spinner-border spinner-border-sm me-2" />Changing…</>
                        ) : "Change Password"}
                      </button>
                    </div>
                  </form>
                )}
              </div>
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
