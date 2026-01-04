import React, { useState, useEffect } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import "./instituteVerification.css"; // Updated import

const InstituteVerification = () => {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [form, setForm] = useState({
    instituteName: "",
    invoiceNumber: "",
    panNumber: "",
    documents: []
  });
  const [files, setFiles] = useState([]);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const storedUser = JSON.parse(localStorage.getItem("user"));
    if (!storedUser || storedUser.role !== "institute") {
      navigate("/dashboard");
    }
    setUser(storedUser);
  }, [navigate]);

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
    setError("");
  };

  const handleFileChange = (e) => {
    const selectedFiles = Array.from(e.target.files);
    setFiles(selectedFiles);
  };

  const convertToBase64 = (file) => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => resolve(reader.result);
      reader.onerror = (error) => reject(error);
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    setSuccess("");

    try {
      // Convert files to base64
      const base64Docs = [];
      for (const file of files) {
        const base64 = await convertToBase64(file);
        base64Docs.push(base64);
      }

      const payload = {
        email: user.email,
        instituteName: form.instituteName,
        invoiceNumber: form.invoiceNumber,
        panNumber: form.panNumber,
        documents: base64Docs
      };

      const res = await axios.post(
        "http://localhost:5000/api/users/submit-institute-verification",
        payload
      );

      setSuccess("Verification submitted successfully! Admin will review your documents.");
      
      // Update user in localStorage
      const updatedUser = { ...user, instituteVerification: res.data.user.instituteVerification };
      localStorage.setItem("user", JSON.stringify(updatedUser));
      
      setTimeout(() => {
        navigate("/dashboard");
      }, 2000);
    } catch (err) {
      setError(err?.response?.data?.message || "Submission failed");
    } finally {
      setLoading(false);
    }
  };

  if (!user) return <div className="auth-container"><div className="auth-card"><p>Loading...</p></div></div>;

  return (
    <div className="auth-container">
      <div className="auth-card">
        <div className="auth-header">
          <div className="logo">
            <span className="logo-icon">✏️</span>
            <h1>Smart Stationery</h1>
          </div>
          <h2>Institute Verification</h2>
          <p className="text-muted">Please provide the following documents for verification</p>
        </div>

        <div className="verification-steps">
          <div className="step completed">
            <div className="step-icon">1</div>
            <div className="step-label">Registration</div>
          </div>
          <div className="step active">
            <div className="step-icon">2</div>
            <div className="step-label">Verification</div>
          </div>
          <div className="step">
            <div className="step-icon">3</div>
            <div className="step-label">Approval</div>
          </div>
        </div>

        <div className="document-requirements">
          <h4>Required Documents:</h4>
          <ul>
            <li>Institute Registration Certificate</li>
            <li>PAN Card Copy</li>
            <li>Recent Invoice/Utility Bill</li>
            <li>Authority Letter (if applicable)</li>
          </ul>
        </div>

        <form onSubmit={handleSubmit} className="institute-form">
          <div className="form-group">
            <label className="required">Institute Name</label>
            <input
              type="text"
              name="instituteName"
              placeholder="Enter institute name"
              value={form.instituteName}
              onChange={handleChange}
              required
            />
          </div>

          <div className="form-group">
            <label className="required">Invoice Number</label>
            <input
              type="text"
              name="invoiceNumber"
              placeholder="Enter invoice number"
              value={form.invoiceNumber}
              onChange={handleChange}
              required
            />
          </div>

          <div className="form-group">
            <label className="required">PAN Number</label>
            <input
              type="text"
              name="panNumber"
              placeholder="Enter PAN number"
              value={form.panNumber}
              onChange={handleChange}
              required
            />
          </div>

          <div className="form-group">
            <label className="required">Upload Documents</label>
            <div className="file-upload">
              <input
                type="file"
                multiple
                accept=".png,.jpg,.jpeg,.pdf"
                onChange={handleFileChange}
                required
              />
            </div>
            <small>Supported formats: PNG, JPG, JPEG, PDF (Max 5MB per file)</small>
          </div>

          {files.length > 0 && (
            <div className="file-preview">
              {files.map((file, index) => (
                <div key={index} className="file-item">
                  <div className="file-item-info">
                    <span className="file-icon">📄</span>
                    <div>
                      <div className="file-name">{file.name}</div>
                      <div className="file-size">{(file.size / 1024 / 1024).toFixed(2)} MB</div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {error && <div className="error-msg">{error}</div>}
          {success && <div className="success-msg">{success}</div>}

          <button type="submit" className="primary-btn" disabled={loading}>
            {loading ? (
              <>
                <span className="loading-spinner"></span>
                Submitting...
              </>
            ) : "Submit for Verification"}
          </button>

          <button 
            type="button" 
            className="secondary-btn"
            onClick={() => navigate("/dashboard")}
          >
            Skip for Now
          </button>
        </form>

        <div className="info-card">
          <h4>Note:</h4>
          <p>• Verification usually takes 1-2 business days</p>
          <p>• You'll receive email notifications about your verification status</p>
          <p>• Once verified, you'll get access to bulk ordering and institutional discounts</p>
        </div>
      </div>
    </div>
  );
};

export default InstituteVerification;