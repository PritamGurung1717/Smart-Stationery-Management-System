import { useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { FaChevronLeft, FaFileExcel, FaDownload, FaUpload } from "react-icons/fa";
import AdminLayout from "../../components/AdminLayout.jsx";

const API = "http://localhost:5000/api";
const authH = () => ({ Authorization: `Bearer ${localStorage.getItem("token")}` });

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

function AdminBookSetExcelUpload() {
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
      const response = await axios.post(`${API}/admin/book-sets/upload-excel`, formData, {
        headers: {
          ...authH(),
          "Content-Type": "multipart/form-data",
        },
      });

      setResult(response.data);
      showToast(response.data.message);
      setFile(null);
      
      // Reset file input
      document.getElementById("excelFileInput").value = "";
    } catch (error) {
      showToast(error.response?.data?.message || "Failed to upload Excel file", "error");
      setResult(null);
    } finally {
      setUploading(false);
    }
  };

  const downloadTemplate = () => {
    // Create sample Excel data with PRICE column
    const sampleData = [
      {
        "School Name": "ABC School",
        "Grade": "1",
        "Subject": "Math",
        "Book Title": "Mathematics Grade 1",
        "Author": "John Doe",
        "Publisher": "ABC Publishers",
        "Year": 2024,
        "ISBN": "978-1234567890",
        "Price": 250.00
      },
      {
        "School Name": "ABC School",
        "Grade": "1",
        "Subject": "English",
        "Book Title": "English Grade 1",
        "Author": "Jane Smith",
        "Publisher": "XYZ Publishers",
        "Year": 2024,
        "ISBN": "978-0987654321",
        "Price": 200.00
      },
      {
        "School Name": "XYZ School",
        "Grade": "2",
        "Subject": "Science",
        "Book Title": "Science Grade 2",
        "Author": "Bob Johnson",
        "Publisher": "Science Press",
        "Year": 2024,
        "ISBN": "",
        "Price": 300.00
      }
    ];

    // Convert to CSV
    const headers = Object.keys(sampleData[0]);
    const csvContent = [
      headers.join(","),
      ...sampleData.map(row => headers.map(h => `"${row[h]}"`).join(","))
    ].join("\n");

    // Download
    const blob = new Blob([csvContent], { type: "text/csv" });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "admin_book_set_template.csv";
    a.click();
    window.URL.revokeObjectURL(url);
  };

  return (
    <AdminLayout activeTab="book-sets">
      <Toast msg={toast.msg} type={toast.type} onClose={() => setToast({ msg: "", type: "success" })} />

      <div className="mb-4">
        <button onClick={() => navigate("/admin-dashboard", { state: { tab: "book-sets" } })}
          style={{ background: "none", border: "none", cursor: "pointer", color: "#6b7280", fontSize: "0.875rem", display: "inline-flex", alignItems: "center", gap: "0.4rem", padding: 0, marginBottom: "0.5rem" }}>
          <FaChevronLeft style={{ fontSize: "0.7rem" }} /> Back to Book Sets
        </button>
        <p className="text-uppercase fw-bold text-muted mb-1" style={{ fontSize: "0.65rem", letterSpacing: "0.1em" }}>BULK UPLOAD</p>
        <h2 className="fw-bold mb-2" style={{ fontSize: "clamp(1.4rem,3vw,1.9rem)", letterSpacing: "-0.02em" }}>
          Upload Book Sets via Excel (Admin)
        </h2>
        <p className="text-muted">Create multiple book sets at once using an Excel file with pricing</p>
      </div>

      {/* Instructions */}
      <div className="bg-white border p-4 mb-4">
        <h5 className="fw-bold mb-3 d-flex align-items-center gap-2">
          <FaFileExcel className="text-success" /> Instructions
        </h5>
        <ol className="mb-3" style={{ fontSize: "0.9rem", lineHeight: 1.8 }}>
          <li>Download the Excel template below</li>
          <li>Fill in book set details including <strong>prices</strong></li>
          <li>Required columns: School Name, Grade, Book Title, Author, Publisher, Year, <strong>Price</strong></li>
          <li>Optional columns: Subject, ISBN</li>
          <li>Books with the same School Name and Grade will be grouped into one book set</li>
          <li>Upload the completed Excel file</li>
          <li>Book sets will be created immediately (no approval needed)</li>
        </ol>
        <button onClick={downloadTemplate}
          className="btn btn-success btn-sm rounded-0 d-flex align-items-center gap-2">
          <FaDownload /> Download Admin Template
        </button>
      </div>

      {/* Upload Section */}
      <div className="bg-white border p-4 mb-4">
        <h5 className="fw-bold mb-3">Upload Excel File</h5>
        <div className="mb-3">
          <input type="file" id="excelFileInput" accept=".xlsx,.xls,.csv"
            onChange={handleFileChange} className="form-control" />
          {file && (
            <div className="mt-2 text-muted small">
              Selected: <strong>{file.name}</strong> ({(file.size / 1024).toFixed(2)} KB)
            </div>
          )}
        </div>
        <button onClick={handleUpload} disabled={!file || uploading}
          className="btn btn-dark rounded-0 fw-semibold d-flex align-items-center gap-2">
          {uploading ? (
            <>
              <span className="spinner-border spinner-border-sm" />
              Uploading...
            </>
          ) : (
            <>
              <FaUpload /> Upload & Create Book Sets
            </>
          )}
        </button>
      </div>

      {/* Results */}
      {result && (
        <div className={`border p-4 ${result.errors && result.errors.length > 0 ? "bg-warning bg-opacity-10" : "bg-success bg-opacity-10"}`}>
          <h5 className="fw-bold mb-3">Upload Results</h5>
          <div className="mb-3">
            <p className="mb-2">
              <strong>✓ Successfully created:</strong> {result.created} book set(s)
            </p>
            {result.errors && result.errors.length > 0 && (
              <div>
                <p className="mb-2 text-danger"><strong>⚠ Errors:</strong></p>
                <ul className="mb-0 text-danger small">
                  {result.errors.map((err, idx) => (
                    <li key={idx}>{err}</li>
                  ))}
                </ul>
              </div>
            )}
          </div>
          <button onClick={() => navigate("/admin-dashboard", { state: { tab: "book-sets" } })}
            className="btn btn-dark btn-sm rounded-0">
            View All Book Sets
          </button>
        </div>
      )}

      {/* Format Example */}
      <div className="bg-light border p-4 mt-4">
        <h6 className="fw-bold mb-3">Excel Format Example (with Price)</h6>
        <div className="table-responsive">
          <table className="table table-sm table-bordered mb-0" style={{ fontSize: "0.8rem" }}>
            <thead className="table-dark">
              <tr>
                <th>School Name</th>
                <th>Grade</th>
                <th>Subject</th>
                <th>Book Title</th>
                <th>Author</th>
                <th>Publisher</th>
                <th>Year</th>
                <th>ISBN</th>
                <th>Price</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td>ABC School</td>
                <td>1</td>
                <td>Math</td>
                <td>Mathematics Grade 1</td>
                <td>John Doe</td>
                <td>ABC Publishers</td>
                <td>2024</td>
                <td>978-1234567890</td>
                <td>250.00</td>
              </tr>
              <tr>
                <td>ABC School</td>
                <td>1</td>
                <td>English</td>
                <td>English Grade 1</td>
                <td>Jane Smith</td>
                <td>XYZ Publishers</td>
                <td>2024</td>
                <td>978-0987654321</td>
                <td>200.00</td>
              </tr>
            </tbody>
          </table>
        </div>
        <p className="text-muted small mt-2 mb-0">
          <strong>Note:</strong> Books with the same School Name and Grade will be grouped together into one book set.
        </p>
      </div>
    </AdminLayout>
  );
}

export default AdminBookSetExcelUpload;
