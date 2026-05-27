import { useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { FaChevronLeft, FaFileExcel, FaDownload, FaUpload } from "react-icons/fa";
import SharedLayout from "../components/SharedLayout.jsx";
import "../styles/landing.css";

const API = "http://localhost:5000/api";
const authH = () => ({ Authorization: `Bearer ${localStorage.getItem("token")}` });

const Toast = ({ msg, type, onClose }) => {
  if (!msg) return null;
  const bg = type === "error" ? "#FEE2E2" : "#ECFDF5";
  const color = type === "error" ? "#991B1B" : "#065F46";
  return (
    <div className="position-fixed d-flex align-items-center gap-2 px-4 py-3 rounded-3 shadow"
      style={{ bottom: 24, right: 24, background: bg, color, zIndex: 9999, fontSize: "0.875rem", fontWeight: 500 }}>
      {type === "error" ? "✕" : "✓"} {msg}
      <button type="button" className="btn btn-link p-0 ms-2" style={{ color, fontSize: "1rem" }} onClick={onClose}>×</button>
    </div>
  );
};

function InstituteBookSetRequestExcel() {
  const navigate = useNavigate();
  const [file, setFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [toast, setToast] = useState({ msg: "", type: "success" });
  const [result, setResult] = useState(null);

  const showToast = (msg, type = "success") => {
    setToast({ msg, type });
    setTimeout(() => setToast({ msg: "", type: "success" }), 4000);
  };

  const handleFileChange = (e) => {
    const selectedFile = e.target.files[0];
    if (selectedFile) {
      const ext = selectedFile.name.split(".").pop().toLowerCase();
      if (!["xlsx", "xls", "csv"].includes(ext)) {
        showToast("Please select a valid Excel file (.xlsx, .xls, or .csv)", "error");
        return;
      }
      setFile(selectedFile);
      setResult(null);
    }
  };

  const handleUpload = async () => {
    if (!file) {
      showToast("Please select a file first", "error");
      return;
    }

    const formData = new FormData();
    formData.append("excelFile", file);

    setUploading(true);
    try {
      const response = await axios.post(`${API}/institute/book-set-request/upload-excel`, formData, {
        headers: { ...authH(), "Content-Type": "multipart/form-data" },
      });

      setResult(response.data);
      showToast(response.data.message);
      setFile(null);
      document.getElementById("excelFileInput").value = "";
    } catch (error) {
      showToast(error.response?.data?.message || "Failed to upload Excel file", "error");
      setResult(null);
    } finally {
      setUploading(false);
    }
  };

  const downloadTemplate = () => {
    const sampleData = [
      { "School Name": "ABC School", "Grade": "1", "Subject": "Math", "Book Title": "Mathematics Grade 1", "Author": "John Doe", "Publisher": "ABC Publishers", "Year": 2024, "ISBN": "978-1234567890" },
      { "School Name": "ABC School", "Grade": "1", "Subject": "English", "Book Title": "English Grade 1", "Author": "Jane Smith", "Publisher": "XYZ Publishers", "Year": 2024, "ISBN": "978-0987654321" },
      { "School Name": "XYZ School", "Grade": "2", "Subject": "Science", "Book Title": "Science Grade 2", "Author": "Bob Johnson", "Publisher": "Science Press", "Year": 2024, "ISBN": "" },
    ];
    const headers = Object.keys(sampleData[0]);
    const csvContent = [headers.join(","), ...sampleData.map(row => headers.map(h => `"${row[h]}"`).join(","))].join("\n");
    const blob = new Blob([csvContent], { type: "text/csv" });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "book_set_template.csv";
    a.click();
    window.URL.revokeObjectURL(url);
  };

  return (
    <SharedLayout>
      <Toast msg={toast.msg} type={toast.type} onClose={() => setToast({ msg: "", type: "success" })} />

      <section style={{ background: "#F3F4F6", minHeight: "60vh" }}>
        <div className="ss-page-inner">
          <button type="button" onClick={() => navigate("/institute-dashboard")} className="ss-back-link">
            <FaChevronLeft style={{ fontSize: "0.7rem" }} /> Back to Dashboard
          </button>

          <p className="ss-section-label">BULK UPLOAD</p>
          <h1 className="ss-page-title mb-2">Upload Book Sets via Excel</h1>
          <p className="mb-4" style={{ color: "#4B5563" }}>Upload multiple book set requests at once using an Excel file</p>

          <div className="ss-card mb-4">
            <h5 className="fw-bold mb-3 d-flex align-items-center gap-2" style={{ color: "#111" }}>
              <FaFileExcel style={{ color: "#16A34A" }} /> Instructions
            </h5>
            <ol className="mb-3" style={{ fontSize: "0.9rem", lineHeight: 1.8, color: "#4B5563" }}>
              <li>Download the Excel template below</li>
              <li>Fill in your book set details following the template format</li>
              <li>Required columns: School Name, Grade, Book Title, Author, Publisher, Year</li>
              <li>Optional columns: Subject, ISBN</li>
              <li>Price will be set by admin after approval</li>
              <li>Books with the same School Name and Grade will be grouped into one book set request</li>
              <li>Upload the completed Excel file</li>
            </ol>
            <button type="button" onClick={downloadTemplate}
              className="btn btn-success btn-sm d-flex align-items-center gap-2">
              <FaDownload /> Download Template
            </button>
          </div>

          <div className="ss-card mb-4">
            <h5 className="fw-bold mb-3" style={{ color: "#111" }}>Upload Excel File</h5>
            <div className="mb-3">
              <input type="file" id="excelFileInput" accept=".xlsx,.xls,.csv"
                onChange={handleFileChange} className="form-control" style={{ borderColor: "#E5E7EB", borderRadius: 8 }} />
              {file && (
                <div className="mt-2 small" style={{ color: "#4B5563" }}>
                  Selected: <strong>{file.name}</strong> ({(file.size / 1024).toFixed(2)} KB)
                </div>
              )}
            </div>
            <button type="button" onClick={handleUpload} disabled={!file || uploading}
              className="landing-btn-primary border-0 d-flex align-items-center gap-2">
              {uploading ? (
                <>
                  <span className="spinner-border spinner-border-sm" />
                  Uploading...
                </>
              ) : (
                <>
                  <FaUpload /> Upload & Create Requests
                </>
              )}
            </button>
          </div>

          {result && (
            <div className={`ss-card mb-4 ${result.errors?.length ? "border-warning" : "border-success"}`}>
              <h5 className="fw-bold mb-3" style={{ color: "#111" }}>Upload Results</h5>
              <p className="mb-2">
                <strong>Successfully created:</strong> {result.created} book set request(s)
              </p>
              {result.errors?.length > 0 && (
                <div>
                  <p className="mb-2 text-danger"><strong>Errors:</strong></p>
                  <ul className="mb-0 text-danger small">
                    {result.errors.map((err, idx) => <li key={idx}>{err}</li>)}
                  </ul>
                </div>
              )}
              <button type="button" onClick={() => navigate("/institute/book-set-request")}
                className="landing-btn-primary border-0 btn-sm mt-3">
                View My Requests
              </button>
            </div>
          )}

          <div className="ss-card">
            <h6 className="fw-bold mb-3" style={{ color: "#111" }}>Excel Format Example</h6>
            <div className="table-responsive">
              <table className="table table-sm table-bordered mb-0" style={{ fontSize: "0.8rem" }}>
                <thead>
                  <tr className="ss-table-head">
                    {["School Name","Grade","Subject","Book Title","Author","Publisher","Year","ISBN"].map(h => (
                      <th key={h} className="border-0 py-2">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td>ABC School</td><td>1</td><td>Math</td><td>Mathematics Grade 1</td><td>John Doe</td><td>ABC Publishers</td><td>2024</td><td>978-1234567890</td>
                  </tr>
                  <tr>
                    <td>ABC School</td><td>1</td><td>English</td><td>English Grade 1</td><td>Jane Smith</td><td>XYZ Publishers</td><td>2024</td><td>978-0987654321</td>
                  </tr>
                </tbody>
              </table>
            </div>
            <p className="small mt-2 mb-0" style={{ color: "#4B5563" }}>
              Books with the same School Name and Grade will be grouped together into one request.
            </p>
          </div>
        </div>
      </section>
    </SharedLayout>
  );
}

export default InstituteBookSetRequestExcel;
