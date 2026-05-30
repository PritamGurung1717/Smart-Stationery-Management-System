import { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import axios from "axios";
import { FaChevronLeft, FaEnvelope, FaKey, FaLock } from "react-icons/fa";
import SharedLayout from "../components/SharedLayout.jsx";
import toast from "../utils/toast.js";
import { API_URL } from "../utils/api.js";
import "../styles/landing.css";

const API = API_URL;
const inp = { borderColor: "#E5E7EB", borderRadius: 8 };

const UserProfile = ({ setUser }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const [user, setLocalUser] = useState(null);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState(location.state?.tab || "profile");
  const [profileForm, setProfileForm] = useState({ name: "", email: "", phone: "", address: "" });

  const [pwStep, setPwStep] = useState("request");
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

  useEffect(() => {
    if (resendCooldown <= 0) return;
    const t = setTimeout(() => setResendCooldown(c => c - 1), 1000);
    return () => clearTimeout(t);
  }, [resendCooldown]);

  const getBackPath = () => {
    if (user?.role === "admin") return "/admin-dashboard";
    if (user?.role === "institute") return "/institute-dashboard";
    return "/dashboard";
  };

  const handleProfileUpdate = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const token = localStorage.getItem("token");
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

  const handleVerifyOtp = async (e) => {
    e.preventDefault();
    if (newPassword !== confirmPassword) { toast.error("Passwords don't match!"); return; }
    if (newPassword.length < 8) { toast.error("Password must be at least 8 characters"); return; }
    const strongPasswordRegex = /^(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;
    if (!strongPasswordRegex.test(newPassword)) {
      toast.error("Password must contain at least one uppercase letter, one number, and one special character (@$!%*?&)");
      return;
    }
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

  const resetPasswordTab = () => {
    setPwStep("request");
    setOtp("");
    setNewPassword("");
    setConfirmPassword("");
  };

  useEffect(() => {
    if (location.pathname === "/change-password") {
      setActiveTab("password");
      resetPasswordTab();
    } else if (location.pathname === "/profile") {
      setActiveTab("profile");
    }
  }, [location.pathname]);

  if (!user) return (
    <SharedLayout>
      <section style={{ background: "#F3F4F6", minHeight: "50vh" }}>
        <div className="ss-page-inner text-center py-5">
          <div className="spinner-border mb-3" style={{ color: "#1D4ED8", width: 36, height: 36, borderWidth: 3 }} role="status" />
          <p className="mb-0" style={{ color: "#4B5563" }}>Loading profile…</p>
        </div>
      </section>
    </SharedLayout>
  );

  return (
    <SharedLayout>
      <section style={{ background: "#F3F4F6", minHeight: "60vh" }}>
        <div className="ss-page-inner">
          <button type="button" onClick={() => navigate(getBackPath())} className="ss-back-link">
            <FaChevronLeft style={{ fontSize: "0.7rem" }} /> Back
          </button>

          <p className="ss-section-label">ACCOUNT</p>
          <h1 className="ss-page-title mb-4">My Profile</h1>

          <div className="ss-card p-0 overflow-hidden">
            <div className="ss-profile-tabs">
              {tabs.map(t => (
                <button
                  key={t}
                  type="button"
                  onClick={() => { setActiveTab(t); if (t === "password") resetPasswordTab(); }}
                  className={`ss-profile-tab ${activeTab === t ? "active" : ""}`}
                >
                  {tabLabels[t]}
                </button>
              ))}
            </div>

            <div className="p-4">
              {activeTab === "profile" && (
                <form onSubmit={handleProfileUpdate}>
                  <div className="row g-3 mb-3">
                    <div className="col-md-6">
                      <label className="form-label fw-semibold small" style={{ color: "#111" }}>Full Name</label>
                      <input type="text" className="form-control" style={inp} value={profileForm.name}
                        onChange={e => setProfileForm({ ...profileForm, name: e.target.value })} required />
                    </div>
                    <div className="col-md-6">
                      <label className="form-label fw-semibold small" style={{ color: "#111" }}>Email</label>
                      <input type="email" className="form-control bg-light" style={{ ...inp, cursor: "not-allowed" }} value={profileForm.email} readOnly
                        title="Email cannot be changed" />
                      <div className="form-text" style={{ fontSize: "0.75rem", color: "#4B5563" }}>Email cannot be changed</div>
                    </div>
                    <div className="col-md-6">
                      <label className="form-label fw-semibold small" style={{ color: "#111" }}>Phone Number</label>
                      <input type="tel" className="form-control" style={inp} value={profileForm.phone}
                        onChange={e => setProfileForm({ ...profileForm, phone: e.target.value })} />
                    </div>
                  </div>
                  <div className="mb-4">
                    <label className="form-label fw-semibold small" style={{ color: "#111" }}>Address</label>
                    <textarea className="form-control" rows={3} style={{ ...inp, resize: "vertical" }} value={profileForm.address}
                      onChange={e => setProfileForm({ ...profileForm, address: e.target.value })} />
                  </div>
                  <button type="submit" disabled={loading}
                    className={`landing-btn-primary border-0 px-4 ${loading ? "opacity-75" : ""}`}>
                    {loading ? "Updating…" : "Update Profile"}
                  </button>
                </form>
              )}

              {activeTab === "password" && (
                <div>
                  <div className="d-flex align-items-center gap-2 mb-4 flex-wrap">
                    {[{ n: 1, label: "Request OTP" }, { n: 2, label: "Verify & Set Password" }].map(({ n, label }) => {
                      const active = (n === 1 && pwStep === "request") || (n === 2 && pwStep === "verify");
                      const done = n === 1 && pwStep === "verify";
                      return (
                        <div key={n} className="d-flex align-items-center gap-2">
                          <div style={{
                            width: 28, height: 28, borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center",
                            background: done ? "#16A34A" : active ? "#1D4ED8" : "#E5E7EB",
                            color: done || active ? "#fff" : "#9CA3AF",
                            fontSize: "0.8rem", fontWeight: 700, flexShrink: 0
                          }}>
                            {done ? "✓" : n}
                          </div>
                          <span style={{ fontSize: "0.85rem", fontWeight: active ? 700 : 500, color: active ? "#1D4ED8" : "#4B5563" }}>{label}</span>
                          {n < 2 && <div style={{ width: 32, height: 2, background: pwStep === "verify" ? "#16A34A" : "#E5E7EB", margin: "0 4px" }} />}
                        </div>
                      );
                    })}
                  </div>

                  {pwStep === "request" && (
                    <div>
                      <div className="rounded-3 p-4 mb-4" style={{ background: "#EFF6FF", border: "1px solid #BFDBFE" }}>
                        <div className="d-flex align-items-center gap-3 mb-3">
                          <div style={{ width: 44, height: 44, borderRadius: "50%", background: "#DBEAFE", display: "flex", alignItems: "center", justifyContent: "center" }}>
                            <FaEnvelope style={{ color: "#1D4ED8", fontSize: "1.1rem" }} />
                          </div>
                          <div>
                            <div className="fw-bold" style={{ fontSize: "0.95rem", color: "#111" }}>Verify your identity</div>
                            <div style={{ fontSize: "0.82rem", color: "#4B5563" }}>
                              We'll send a one-time password to <strong>{user.email}</strong>
                            </div>
                          </div>
                        </div>
                        <p className="small mb-0" style={{ color: "#4B5563" }}>
                          For your security, we verify your identity before allowing a password change.
                        </p>
                      </div>
                      <button type="button" onClick={handleSendOtp} disabled={otpSending}
                        className={`landing-btn-primary border-0 px-4 ${otpSending ? "opacity-75" : ""}`}>
                        {otpSending ? (
                          <><span className="spinner-border spinner-border-sm me-2" />Sending OTP…</>
                        ) : (
                          <><FaEnvelope className="me-2" />Send OTP to my email</>
                        )}
                      </button>
                    </div>
                  )}

                  {pwStep === "verify" && (
                    <form onSubmit={handleVerifyOtp}>
                      <div className="alert alert-success small py-2 mb-4 d-flex align-items-center gap-2" role="alert">
                        <FaEnvelope />
                        OTP sent to <strong>{user.email}</strong>. Check your inbox (and spam folder).
                      </div>

                      <div className="mb-4">
                        <label className="form-label fw-semibold small d-flex align-items-center gap-2" style={{ color: "#111" }}>
                          <FaKey style={{ color: "#1D4ED8" }} /> Enter OTP
                        </label>
                        <input
                          type="text"
                          className="form-control"
                          placeholder="Enter 6-digit OTP"
                          value={otp}
                          onChange={e => setOtp(e.target.value.replace(/\D/g, "").slice(0, 6))}
                          maxLength={6}
                          required
                          style={{ ...inp, letterSpacing: "0.3em", fontSize: "1.2rem", fontWeight: 700, textAlign: "center", maxWidth: 220 }}
                        />
                        <div className="mt-2">
                          {resendCooldown > 0 ? (
                            <span className="small" style={{ color: "#4B5563" }}>Resend OTP in {resendCooldown}s</span>
                          ) : (
                            <button type="button" onClick={handleSendOtp} disabled={otpSending}
                              className="btn btn-link p-0 small text-decoration-none fw-semibold" style={{ color: "#1D4ED8" }}>
                              {otpSending ? "Sending…" : "Resend OTP"}
                            </button>
                          )}
                        </div>
                      </div>

                      <hr className="my-4" style={{ borderColor: "#E5E7EB" }} />

                      <div className="mb-3">
                        <label className="form-label fw-semibold small d-flex align-items-center gap-2" style={{ color: "#111" }}>
                          <FaLock style={{ color: "#1D4ED8" }} /> New Password
                        </label>
                        <input type="password" className="form-control" style={inp} placeholder="Min 8 characters"
                          value={newPassword} onChange={e => setNewPassword(e.target.value)} required minLength={8} />
                      </div>
                      <div className="mb-3">
                        <label className="form-label fw-semibold small d-flex align-items-center gap-2" style={{ color: "#111" }}>
                          <FaLock style={{ color: "#1D4ED8" }} /> Confirm New Password
                        </label>
                        <input type="password" className="form-control" style={inp} placeholder="Repeat new password"
                          value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)} required minLength={8} />
                        {confirmPassword && newPassword !== confirmPassword && (
                          <div className="text-danger small mt-1">Passwords don't match</div>
                        )}
                      </div>

                      <div className="small py-2 px-3 mb-4 rounded-3" style={{ background: "#EFF6FF", color: "#4B5563" }}>
                        Password requirements: min 8 characters, one uppercase, one number, one special character (@$!%*?&)
                      </div>

                      <div className="d-flex gap-2 flex-wrap">
                        <button type="button" onClick={resetPasswordTab}
                          className="ss-btn-outline px-4 py-2">
                          Back
                        </button>
                        <button type="submit" disabled={loading || otp.length < 6 || !newPassword || newPassword !== confirmPassword}
                          className={`landing-btn-primary border-0 px-4 ${loading ? "opacity-75" : ""}`}>
                          {loading ? (
                            <><span className="spinner-border spinner-border-sm me-2" />Changing…</>
                          ) : "Change Password"}
                        </button>
                      </div>
                    </form>
                  )}
                </div>
              )}

              {activeTab === "account" && (
                <div>
                  {[
                    { label: "Account Type", value: user.role?.charAt(0).toUpperCase() + user.role?.slice(1) },
                    { label: "Account Status", value: user.status },
                    { label: "Email Verified", value: user.isVerified ? "Verified" : "Not Verified" },
                    { label: "Member Since", value: user.createdAt ? new Date(user.createdAt).toLocaleDateString() : "—" },
                  ].map(row => (
                    <div key={row.label} className="d-flex justify-content-between py-3 border-bottom small" style={{ borderColor: "#E5E7EB" }}>
                      <span style={{ color: "#4B5563" }}>{row.label}</span>
                      <span className="fw-semibold" style={{ color: "#111" }}>{row.value}</span>
                    </div>
                  ))}
                  {user.role === "institute" && user.instituteVerification && (
                    <div className="mt-4">
                      <h5 className="fw-bold mb-3" style={{ color: "#111" }}>Institute Verification</h5>
                      <div className="d-flex justify-content-between py-3 border-bottom small" style={{ borderColor: "#E5E7EB" }}>
                        <span style={{ color: "#4B5563" }}>Status</span>
                        <span className="fw-semibold ss-badge-blue">{user.instituteVerification.status}</span>
                      </div>
                      {user.instituteInfo && (
                        <div className="d-flex justify-content-between py-3 small">
                          <span style={{ color: "#4B5563" }}>Institute Name</span>
                          <span className="fw-semibold" style={{ color: "#111" }}>{user.instituteInfo.schoolName}</span>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </section>
    </SharedLayout>
  );
};

export default UserProfile;
