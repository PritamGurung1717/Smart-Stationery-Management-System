import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { FaGift, FaImage, FaTimes, FaChevronLeft } from "react-icons/fa";
import axios from "axios";
import SharedLayout from "../components/SharedLayout.jsx";
import { API_URL } from "../utils/api.js";
import { getAuthHeaders } from "../utils/auth.js";
import "../styles/landing.css";

const API = API_URL;
const authH = getAuthHeaders;

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

  const inp = { borderColor: "#E5E7EB", borderRadius: 8 };

  return (
    <SharedLayout activeLink="Donate">
      <section style={{ background: "#F3F4F6", minHeight: "60vh" }}>
        <div className="ss-page-inner" style={{ maxWidth: 720 }}>
          <button type="button" onClick={() => navigate("/donations")} className="ss-back-link">
            <FaChevronLeft style={{ fontSize: "0.7rem" }} /> Back to Donations
          </button>

          <p className="ss-section-label">COMMUNITY</p>
          <h1 className="ss-page-title mb-4 d-flex align-items-center gap-2" style={{ fontSize: "clamp(1.5rem, 3vw, 2.25rem)" }}>
            <FaGift style={{ fontSize: "1.25rem", color: "#1D4ED8" }} /> Create Donation
          </h1>

          {error && <div className="alert alert-danger small py-2">{error}</div>}
          {success && <div className="alert alert-success small py-2">✓ {success}</div>}

          <form onSubmit={handleSubmit} className="ss-card d-flex flex-column gap-4">
            <div>
              <label className="form-label fw-semibold small">Title <span className="text-danger">*</span></label>
              <input name="title" value={form.title} onChange={handleChange} maxLength={100}
                placeholder="e.g., Mathematics Textbook Grade 10" className="form-control" style={inp} />
            </div>

            <div>
              <label className="form-label fw-semibold small">Description <span className="text-danger">*</span></label>
              <textarea name="description" value={form.description} onChange={handleChange} rows={4} maxLength={1000}
                placeholder="Describe the item, its condition, and any relevant details…"
                className="form-control" style={{ ...inp, resize: "vertical" }} />
            </div>

            <div className="row g-3">
              <div className="col-6">
                <label className="form-label fw-semibold small">Category <span className="text-danger">*</span></label>
                <select name="category" value={form.category} onChange={handleChange} className="form-select" style={inp}>
                  <option value="">Select Category</option>
                  {CATEGORIES.map(c => <option key={c.value} value={c.value}>{c.label}</option>)}
                </select>
              </div>
              <div className="col-6">
                <label className="form-label fw-semibold small">Condition <span className="text-danger">*</span></label>
                <select name="condition" value={form.condition} onChange={handleChange} className="form-select" style={inp}>
                  <option value="">Select Condition</option>
                  {CONDITIONS.map(c => <option key={c.value} value={c.value}>{c.label}</option>)}
                </select>
              </div>
            </div>

            <div>
              <label className="form-label fw-semibold small">Pickup Location <span className="text-danger">*</span></label>
              <input name="pickup_location" value={form.pickup_location} onChange={handleChange} maxLength={200}
                placeholder="e.g., Main Campus, Building A, Room 101" className="form-control" style={inp} />
            </div>

            <div>
              <label className="form-label fw-semibold small">Images <span className="text-danger">*</span></label>
              <div onClick={() => document.getElementById("imgInput").click()}
                className="text-center p-4 rounded-3"
                style={{ border: "2px dashed #E5E7EB", cursor: "pointer", background: "#F9FAFB" }}>
                <FaImage style={{ fontSize: "2.5rem", color: "#9CA3AF" }} className="mb-2 d-block mx-auto" />
                <p className="small mb-0" style={{ color: "#4B5563" }}>Click to upload images (max 5, 5MB each)</p>
                <input id="imgInput" type="file" accept="image/*" multiple onChange={handleImages} style={{ display: "none" }} />
              </div>
              {previews.length > 0 && (
                <div className="row g-2 mt-2">
                  {previews.map((pv, i) => (
                    <div key={i} className="col-3 position-relative">
                      <img src={pv} alt="" className="rounded-2 w-100" style={{ height: 100, objectFit: "cover", border: "1px solid #E5E7EB" }} />
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

            <div className="d-flex gap-3 justify-content-end">
              <button type="button" onClick={() => navigate("/donations")} disabled={loading}
                className="landing-btn-outline" style={{ color: "#111", borderColor: "#E5E7EB", padding: "0.55rem 1.25rem", borderRadius: 8 }}>
                Cancel
              </button>
              <button type="submit" disabled={loading} className={`landing-btn-primary ${loading ? "opacity-75" : ""}`}>
                {loading ? "Creating…" : "Create Donation"}
              </button>
            </div>
          </form>
        </div>
      </section>
    </SharedLayout>
  );
};

export default CreateDonation;
