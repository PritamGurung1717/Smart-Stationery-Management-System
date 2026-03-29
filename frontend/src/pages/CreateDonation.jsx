import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { FaGift, FaImage, FaTimes, FaChevronLeft } from "react-icons/fa";
import axios from "axios";
import SharedLayout from "../components/SharedLayout.jsx";

const API = "http://localhost:5000/api";
const authH = () => ({ Authorization: `Bearer ${localStorage.getItem("token")}` });

const CATEGORIES = [
  { value: "books", label: "Books" }, { value: "stationery", label: "Stationery" },
  { value: "electronics", label: "Electronics" }, { value: "furniture", label: "Furniture" },
  { value: "other", label: "Other" },
];
const CONDITIONS = [
  { value: "new", label: "New" }, { value: "like_new", label: "Like New" },
  { value: "good", label: "Good" }, { value: "used", label: "Used" },
];

const CreateDonation = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [form, setForm] = useState({ title: "", description: "", category: "", condition: "", pickup_location: "" });
  const [images, setImages] = useState([]);
  const [previews, setPreviews] = useState([]);

  const handleChange = (e) => setForm(p => ({ ...p, [e.target.name]: e.target.value }));

  const handleImages = (e) => {
    const files = Array.from(e.target.files);
    if (files.length + images.length > 5) { setError("Maximum 5 images allowed"); return; }
    const valid = []; const pv = [];
    for (const f of files) {
      if (!f.type.startsWith("image/")) { setError(`${f.name} is not an image`); continue; }
      if (f.size > 5 * 1024 * 1024) { setError(`${f.name} exceeds 5MB`); continue; }
      valid.push(f);
      const reader = new FileReader();
      reader.onloadend = () => { pv.push(reader.result); if (pv.length === valid.length) setPreviews(p => [...p, ...pv]); };
      reader.readAsDataURL(f);
    }
    setImages(p => [...p, ...valid]);
  };

  const removeImage = (i) => { setImages(p => p.filter((_, x) => x !== i)); setPreviews(p => p.filter((_, x) => x !== i)); };

  const handleSubmit = async (e) => {
    e.preventDefault(); setError(""); setSuccess("");
    if (!form.title.trim() || form.title.trim().length < 5) { setError("Title must be at least 5 characters"); return; }
    if (!form.description.trim() || form.description.trim().length < 10) { setError("Description must be at least 10 characters"); return; }
    if (!form.category) { setError("Please select a category"); return; }
    if (!form.condition) { setError("Please select a condition"); return; }
    if (!form.pickup_location.trim()) { setError("Pickup location is required"); return; }
    if (images.length === 0) { setError("At least 1 image is required"); return; }
    try {
      setLoading(true);
      const fd = new FormData();
      Object.entries(form).forEach(([k, v]) => fd.append(k, v.trim()));
      images.forEach(img => fd.append("images", img));
      const r = await axios.post(`${API}/donations`, fd, { headers: { ...authH(), "Content-Type": "multipart/form-data" } });
      if (r.data.success) {
        setSuccess("Donation created successfully!");
        setTimeout(() => navigate("/donations"), 1500);
      }
    } catch (err) {
      setError(err.response?.data?.message || err.response?.data?.errors?.join(", ") || "Failed to create donation");
    } finally { setLoading(false); }
  };

  return (
    <SharedLayout activeLink="Donate">
      <div style={{ maxWidth: 720, margin: "0 auto" }} className="px-3 py-5">

        <button onClick={() => navigate("/donations")}
          className="btn btn-link p-0 text-secondary small d-inline-flex align-items-center gap-1 mb-3 text-decoration-none">
          <FaChevronLeft style={{ fontSize: "0.7rem" }} /> Back
        </button>

        <p className="text-uppercase fw-bold small text-muted mb-1" style={{ letterSpacing: "0.1em" }}>COMMUNITY</p>
        <h1 className="fw-bold mb-4 d-flex align-items-center gap-3" style={{ fontSize: "clamp(1.75rem,4vw,2.25rem)", letterSpacing: "-0.02em" }}>
          <FaGift style={{ fontSize: "1.5rem" }} /> Create Donation
        </h1>

        {error   && <div className="alert alert-danger small py-2">{error}</div>}
        {success && <div className="alert alert-success small py-2">✓ {success}</div>}

        <form onSubmit={handleSubmit} className="d-flex flex-column gap-4">
          {/* Title */}
          <div>
            <label className="form-label fw-semibold small">Title <span className="text-danger">*</span></label>
            <input name="title" value={form.title} onChange={handleChange} maxLength={100}
              placeholder="e.g., Mathematics Textbook Grade 10" className="form-control" />
          </div>

          {/* Description */}
          <div>
            <label className="form-label fw-semibold small">Description <span className="text-danger">*</span></label>
            <textarea name="description" value={form.description} onChange={handleChange} rows={4} maxLength={1000}
              placeholder="Describe the item, its condition, and any relevant details…"
              className="form-control" style={{ resize: "vertical" }} />
          </div>

          {/* Category + Condition */}
          <div className="row g-3">
            <div className="col-6">
              <label className="form-label fw-semibold small">Category <span className="text-danger">*</span></label>
              <select name="category" value={form.category} onChange={handleChange} className="form-select">
                <option value="">Select Category</option>
                {CATEGORIES.map(c => <option key={c.value} value={c.value}>{c.label}</option>)}
              </select>
            </div>
            <div className="col-6">
              <label className="form-label fw-semibold small">Condition <span className="text-danger">*</span></label>
              <select name="condition" value={form.condition} onChange={handleChange} className="form-select">
                <option value="">Select Condition</option>
                {CONDITIONS.map(c => <option key={c.value} value={c.value}>{c.label}</option>)}
              </select>
            </div>
          </div>

          {/* Pickup location */}
          <div>
            <label className="form-label fw-semibold small">Pickup Location <span className="text-danger">*</span></label>
            <input name="pickup_location" value={form.pickup_location} onChange={handleChange} maxLength={200}
              placeholder="e.g., Main Campus, Building A, Room 101" className="form-control" />
          </div>

          {/* Images */}
          <div>
            <label className="form-label fw-semibold small">Images <span className="text-danger">*</span></label>
            <div onClick={() => document.getElementById("imgInput").click()}
              className="border rounded-3 text-center p-4 bg-light"
              style={{ borderStyle: "dashed", cursor: "pointer", borderColor: "#e5e7eb" }}>
              <FaImage style={{ fontSize: "2.5rem", color: "#9ca3af" }} className="mb-2 d-block mx-auto" />
              <p className="text-muted small mb-0">Click to upload images (max 5, 5MB each)</p>
              <input id="imgInput" type="file" accept="image/*" multiple onChange={handleImages} style={{ display: "none" }} />
            </div>
            {previews.length > 0 && (
              <div className="row g-2 mt-2">
                {previews.map((pv, i) => (
                  <div key={i} className="col-3 position-relative">
                    <img src={pv} alt="" className="rounded-2 w-100" style={{ height: 100, objectFit: "cover" }} />
                    <button type="button" onClick={() => removeImage(i)}
                      className="btn btn-danger position-absolute rounded-circle d-flex align-items-center justify-content-center p-0"
                      style={{ top: 8, right: 8, width: 22, height: 22, fontSize: "0.65rem" }}>
                      <FaTimes />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Buttons */}
          <div className="d-flex gap-3 justify-content-end">
            <button type="button" onClick={() => navigate("/donations")} disabled={loading}
              className="btn btn-light border fw-semibold px-4">Cancel</button>
            <button type="submit" disabled={loading}
              className={`btn btn-dark fw-bold px-4 ${loading ? "opacity-75" : ""}`}>
              {loading ? "Creating…" : "Create Donation"}
            </button>
          </div>
        </form>
      </div>
    </SharedLayout>
  );
};

export default CreateDonation;
