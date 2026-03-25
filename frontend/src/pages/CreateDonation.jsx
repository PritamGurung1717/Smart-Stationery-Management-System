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

const inp = { border: "1px solid #e5e7eb", borderRadius: 6, padding: "0.75rem 1rem", fontSize: "0.95rem", width: "100%", outline: "none", boxSizing: "border-box" };

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
      <div style={{ maxWidth: 720, margin: "0 auto", padding: "3rem 1.5rem" }}>
        <button onClick={() => navigate("/donations")}
          style={{ background: "none", border: "none", cursor: "pointer", color: "#6b7280", fontSize: "0.875rem", display: "inline-flex", alignItems: "center", gap: "0.4rem", padding: 0, marginBottom: "1.5rem" }}>
          <FaChevronLeft style={{ fontSize: "0.7rem" }} /> Back
        </button>
        <p style={{ fontSize: "0.75rem", fontWeight: 700, letterSpacing: "0.1em", color: "#6b7280", textTransform: "uppercase", marginBottom: "0.4rem" }}>COMMUNITY</p>
        <h1 style={{ fontSize: "clamp(1.75rem,4vw,2.25rem)", fontWeight: 800, color: "#111", margin: "0 0 2rem", letterSpacing: "-0.02em", display: "flex", alignItems: "center", gap: "0.75rem" }}>
          <FaGift style={{ fontSize: "1.5rem" }} /> Create Donation
        </h1>

        {error && <div style={{ background: "#fef2f2", border: "1px solid #fecaca", borderRadius: 6, padding: "0.75rem 1rem", marginBottom: "1.25rem", color: "#dc2626", fontSize: "0.9rem" }}>{error}</div>}
        {success && <div style={{ background: "#f0fdf4", border: "1px solid #bbf7d0", borderRadius: 6, padding: "0.75rem 1rem", marginBottom: "1.25rem", color: "#166534", fontSize: "0.9rem" }}>✓ {success}</div>}

        <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "1.25rem" }}>
          {/* Title */}
          <div>
            <label style={{ fontSize: "0.85rem", fontWeight: 600, color: "#374151", display: "block", marginBottom: "0.4rem" }}>Title <span style={{ color: "#ef4444" }}>*</span></label>
            <input name="title" value={form.title} onChange={handleChange} placeholder="e.g., Mathematics Textbook Grade 10" maxLength={100} style={inp} />
          </div>

          {/* Description */}
          <div>
            <label style={{ fontSize: "0.85rem", fontWeight: 600, color: "#374151", display: "block", marginBottom: "0.4rem" }}>Description <span style={{ color: "#ef4444" }}>*</span></label>
            <textarea name="description" value={form.description} onChange={handleChange} rows={4} maxLength={1000}
              placeholder="Describe the item, its condition, and any relevant details…"
              style={{ ...inp, resize: "vertical" }} />
          </div>

          {/* Category + Condition */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem" }}>
            <div>
              <label style={{ fontSize: "0.85rem", fontWeight: 600, color: "#374151", display: "block", marginBottom: "0.4rem" }}>Category <span style={{ color: "#ef4444" }}>*</span></label>
              <select name="category" value={form.category} onChange={handleChange} style={inp}>
                <option value="">Select Category</option>
                {CATEGORIES.map(c => <option key={c.value} value={c.value}>{c.label}</option>)}
              </select>
            </div>
            <div>
              <label style={{ fontSize: "0.85rem", fontWeight: 600, color: "#374151", display: "block", marginBottom: "0.4rem" }}>Condition <span style={{ color: "#ef4444" }}>*</span></label>
              <select name="condition" value={form.condition} onChange={handleChange} style={inp}>
                <option value="">Select Condition</option>
                {CONDITIONS.map(c => <option key={c.value} value={c.value}>{c.label}</option>)}
              </select>
            </div>
          </div>

          {/* Pickup location */}
          <div>
            <label style={{ fontSize: "0.85rem", fontWeight: 600, color: "#374151", display: "block", marginBottom: "0.4rem" }}>Pickup Location <span style={{ color: "#ef4444" }}>*</span></label>
            <input name="pickup_location" value={form.pickup_location} onChange={handleChange} placeholder="e.g., Main Campus, Building A, Room 101" maxLength={200} style={inp} />
          </div>

          {/* Images */}
          <div>
            <label style={{ fontSize: "0.85rem", fontWeight: 600, color: "#374151", display: "block", marginBottom: "0.4rem" }}>Images <span style={{ color: "#ef4444" }}>*</span></label>
            <div onClick={() => document.getElementById("imgInput").click()}
              style={{ border: "2px dashed #e5e7eb", borderRadius: 8, padding: "2rem", textAlign: "center", cursor: "pointer", background: "#fafafa" }}>
              <FaImage style={{ fontSize: "2.5rem", color: "#9ca3af", marginBottom: "0.75rem" }} />
              <p style={{ margin: 0, color: "#9ca3af", fontSize: "0.9rem" }}>Click to upload images (max 5, 5MB each)</p>
              <input id="imgInput" type="file" accept="image/*" multiple onChange={handleImages} style={{ display: "none" }} />
            </div>
            {previews.length > 0 && (
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(120px,1fr))", gap: "0.75rem", marginTop: "0.75rem" }}>
                {previews.map((pv, i) => (
                  <div key={i} style={{ position: "relative" }}>
                    <img src={pv} alt="" style={{ width: "100%", height: 120, objectFit: "cover", borderRadius: 6 }} />
                    <button type="button" onClick={() => removeImage(i)}
                      style={{ position: "absolute", top: 4, right: 4, background: "#ef4444", color: "#fff", border: "none", borderRadius: "50%", width: 24, height: 24, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "0.7rem" }}>
                      <FaTimes />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Buttons */}
          <div style={{ display: "flex", gap: "1rem", justifyContent: "flex-end" }}>
            <button type="button" onClick={() => navigate("/donations")} disabled={loading}
              style={{ background: "#f3f4f6", color: "#374151", border: "none", borderRadius: 6, padding: "0.85rem 1.75rem", fontWeight: 600, cursor: "pointer" }}>
              Cancel
            </button>
            <button type="submit" disabled={loading}
              style={{ background: "#111", color: "#fff", border: "none", borderRadius: 6, padding: "0.85rem 1.75rem", fontWeight: 700, cursor: loading ? "not-allowed" : "pointer", opacity: loading ? 0.7 : 1 }}>
              {loading ? "Creating…" : "Create Donation"}
            </button>
          </div>
        </form>
      </div>
    </SharedLayout>
  );
};

export default CreateDonation;
