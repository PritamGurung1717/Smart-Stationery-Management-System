import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { FaPlus, FaImage, FaSave, FaCheck, FaTimes, FaTrash } from "react-icons/fa";
import AdminLayout from "../../components/AdminLayout.jsx";

const API = "http://localhost:5000/api";
const authH = () => ({ Authorization: `Bearer ${localStorage.getItem("token")}` });

/* ─── Toast ─────────────────────────────────────────────────── */
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

/* ─── Add Category Modal ─────────────────────────────────────── */
const AddCategoryModal = ({ onClose, onAdded }) => {
  const [name, setName] = useState("");
  const [desc, setDesc] = useState("");
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState("");

  const handleAdd = async () => {
    if (!name.trim()) { setErr("Category name is required"); return; }
    setSaving(true); setErr("");
    try {
      await axios.post(`${API}/categories`, { name: name.trim(), description: desc.trim() }, { headers: authH() });
      onAdded(name.trim().toLowerCase());
    } catch (e) { setErr(e.response?.data?.message || "Failed to add category"); }
    finally { setSaving(false); }
  };

  return (
    <div className="position-fixed top-0 start-0 w-100 h-100 d-flex align-items-center justify-content-center"
      style={{ background: "rgba(0,0,0,0.45)", zIndex: 9999 }}>
      <div className="bg-white rounded-3 shadow p-4" style={{ maxWidth: 420, width: "90%" }}>
        <div className="d-flex justify-content-between align-items-center mb-4">
          <h5 className="fw-bold mb-0">Add New Category</h5>
          <button className="btn btn-link p-0 text-muted" onClick={onClose}><FaTimes /></button>
        </div>
        {err && <div className="alert alert-danger small py-2 mb-3">{err}</div>}
        <div className="mb-3">
          <label className="form-label fw-medium small">Category Name *</label>
          <input value={name} onChange={e => setName(e.target.value)} placeholder="e.g., Electronics"
            className="form-control rounded-0" style={{ borderColor: "#e5e7eb" }} />
        </div>
        <div className="mb-4">
          <label className="form-label fw-medium small">Description (optional)</label>
          <textarea value={desc} onChange={e => setDesc(e.target.value)} rows={2}
            className="form-control rounded-0" style={{ borderColor: "#e5e7eb", resize: "none" }} />
        </div>
        <div className="d-flex gap-2 justify-content-end">
          <button className="btn btn-outline-dark rounded-0" onClick={onClose} disabled={saving}>Cancel</button>
          <button className="btn btn-dark rounded-0 fw-semibold" onClick={handleAdd} disabled={saving || !name.trim()}>
            {saving ? <span className="spinner-border spinner-border-sm me-1" /> : <FaCheck className="me-1" />}
            Add Category
          </button>
        </div>
      </div>
    </div>
  );
};

/* ─── Field ──────────────────────────────────────────────────── */
const Field = ({ label, required, children }) => (
  <div className="mb-3">
    <label className="form-label fw-medium small mb-1">
      {label}{required && <span className="text-danger ms-1">*</span>}
    </label>
    {children}
  </div>
);

const inputStyle = { borderColor: "#e5e7eb", borderRadius: 0, fontSize: "0.9rem" };

/* ─── AddProduct ─────────────────────────────────────────────── */
const AddProduct = () => {
  const navigate = useNavigate();
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState({ msg: "", type: "success" });
  const showToast = (msg, type = "success") => { setToast({ msg, type }); setTimeout(() => setToast({ msg: "", type: "success" }), 3500); };

  const [formData, setFormData] = useState({
    name: "", category: "", price: "", original_price: "",
    stock_quantity: "", description: "", author: "", genre: ""
  });
  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState("");

  const [categories, setCategories] = useState([]);
  const [loadingCats, setLoadingCats] = useState(true);
  const [showCatModal, setShowCatModal] = useState(false);

  useEffect(() => { fetchCategories(); }, []);

  const fetchCategories = async () => {
    setLoadingCats(true);
    try {
      const r = await axios.get(`${API}/categories`);
      const list = r.data.formattedCategories || r.data.categories || ["book", "stationery"];
      const formatted = list.map(c => typeof c === "string"
        ? { value: c, label: c.charAt(0).toUpperCase() + c.slice(1) }
        : c);
      setCategories(formatted);
      if (!formData.category && formatted.length > 0)
        setFormData(p => ({ ...p, category: formatted[0].value }));
    } catch {
      const fallback = [
        { value: "book", label: "Book" },
        { value: "stationery", label: "Stationery" },
        { value: "sports", label: "Sports" },
        { value: "electronics", label: "Electronics" },
      ];
      setCategories(fallback);
      if (!formData.category) setFormData(p => ({ ...p, category: "book" }));
    } finally { setLoadingCats(false); }
  };

  useEffect(() => {
    if (formData.category !== "book")
      setFormData(p => ({ ...p, author: "", genre: "" }));
  }, [formData.category]);

  const set = (e) => {
    const { name, value } = e.target;
    setFormData(p => ({ ...p, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const errs = [];
    if (!formData.name.trim()) errs.push("Product name is required");
    if (!formData.category) errs.push("Category is required");
    if (!formData.price || parseFloat(formData.price) <= 0) errs.push("Valid price is required");
    if (formData.stock_quantity === "" || parseInt(formData.stock_quantity) < 0) errs.push("Valid stock quantity is required");
    if (formData.category === "book" && !formData.author.trim()) errs.push("Author is required for books");
    if (errs.length) { showToast(errs[0], "error"); return; }

    setSaving(true);
    try {
      const token = localStorage.getItem("token");
      const fd = new FormData();
      fd.append("name", formData.name.trim());
      fd.append("category", formData.category);
      fd.append("price", parseFloat(formData.price));
      if (formData.original_price) fd.append("original_price", parseFloat(formData.original_price));
      fd.append("stock_quantity", parseInt(formData.stock_quantity));
      fd.append("description", formData.description);
      fd.append("author", formData.author);
      fd.append("genre", formData.genre);
      if (imageFile) fd.append("image", imageFile);

      await axios.post(`${API}/products`, fd, {
        headers: { Authorization: `Bearer ${token}`, "Content-Type": "multipart/form-data" }
      });

      showToast("Product added successfully!");
      setTimeout(() => navigate("/admin-dashboard"), 1500);
    } catch (e) {
      showToast(e.response?.data?.message || "Failed to add product", "error");
    } finally { setSaving(false); }
  };

  const stock = parseInt(formData.stock_quantity) || 0;
  const isBook = formData.category === "book";
  const isComplete = formData.name && formData.price && formData.stock_quantity !== "" && formData.category && (!isBook || formData.author);

  return (
    <AdminLayout activeTab="products"
      topBar={
        <button onClick={() => setShowCatModal(true)}
          className="btn btn-sm btn-outline-dark d-flex align-items-center gap-1">
          <FaPlus style={{ fontSize: "0.7rem" }} /> New Category
        </button>
      }>
      <Toast msg={toast.msg} type={toast.type} onClose={() => setToast({ msg: "", type: "success" })} />
      {showCatModal && (
        <AddCategoryModal
          onClose={() => setShowCatModal(false)}
          onAdded={async (val) => {
            await fetchCategories();
            setFormData(p => ({ ...p, category: val }));
            setShowCatModal(false);
            showToast("Category added");
          }}
        />
      )}

      {/* Page title */}
      <div className="mb-4">
        <p className="text-uppercase fw-bold text-muted mb-1" style={{ fontSize: "0.65rem", letterSpacing: "0.1em" }}>PRODUCTS</p>
        <h2 className="fw-bold mb-0" style={{ fontSize: "clamp(1.4rem,3vw,1.9rem)", letterSpacing: "-0.02em" }}>Add New Product</h2>
      </div>
        <form onSubmit={handleSubmit}>
          <div className="row g-4">

            {/* Left — main fields */}
            <div className="col-lg-8">
              {/* Basic info */}
              <div className="bg-white mb-3" style={{ border: "1px solid #e5e7eb" }}>
                <div className="px-4 py-3 border-bottom" style={{ borderColor: "#e5e7eb" }}>
                  <p className="text-uppercase fw-bold text-muted mb-0" style={{ fontSize: "0.65rem", letterSpacing: "0.1em" }}>BASIC INFORMATION</p>
                </div>
                <div className="p-4">
                  <Field label="Product Name" required>
                    <input name="name" value={formData.name} onChange={set} required
                      className="form-control" style={inputStyle} placeholder="e.g., RD Sharma Class 12" />
                  </Field>

                  <div className="row g-3">
                    <div className="col-md-6">
                      <Field label="Category" required>
                        <div className="d-flex">
                          <select name="category" value={formData.category} onChange={set} required
                            disabled={loadingCats}
                            className="form-select flex-grow-1" style={{ ...inputStyle, borderRight: "none" }}>
                            <option value="">Select category…</option>
                            {categories.map(c => <option key={c.value} value={c.value}>{c.label}</option>)}
                          </select>
                          <button type="button" onClick={() => setShowCatModal(true)}
                            className="btn btn-outline-dark d-flex align-items-center px-3"
                            style={{ borderRadius: 0, borderColor: "#e5e7eb", borderLeft: "none" }}>
                            <FaPlus style={{ fontSize: "0.7rem" }} />
                          </button>
                        </div>
                      </Field>
                    </div>
                    <div className="col-md-3">
                      <Field label="Price (₹)" required>
                        <input name="price" type="number" min="0" step="0.01" value={formData.price} onChange={set} required
                          className="form-control" style={inputStyle} placeholder="0.00" />
                      </Field>
                    </div>
                    <div className="col-md-3">
                      <Field label="Original Price (₹)">
                        <input name="original_price" type="number" min="0" step="0.01" value={formData.original_price} onChange={set}
                          className="form-control" style={inputStyle} placeholder="MRP" />
                      </Field>
                    </div>
                  </div>

                  <div className="row g-3">
                    <div className="col-md-4">
                      <Field label="Stock Quantity" required>
                        <input name="stock_quantity" type="number" min="0" value={formData.stock_quantity} onChange={set} required
                          className="form-control" style={inputStyle} placeholder="0" />
                      </Field>
                    </div>
                  </div>

                  {isBook && (
                    <div className="row g-3">
                      <div className="col-md-6">
                        <Field label="Author" required>
                          <input name="author" value={formData.author} onChange={set} required
                            className="form-control" style={inputStyle} placeholder="Author name" />
                        </Field>
                      </div>
                      <div className="col-md-6">
                        <Field label="Genre">
                          <input name="genre" value={formData.genre} onChange={set}
                            className="form-control" style={inputStyle} placeholder="e.g., Science, Fiction" />
                        </Field>
                      </div>
                    </div>
                  )}

                  <Field label="Description">
                    <textarea name="description" value={formData.description} onChange={set} rows={4}
                      className="form-control" style={{ ...inputStyle, resize: "vertical" }}
                      placeholder="Product description…" />
                  </Field>
                </div>
              </div>
            </div>

            {/* Right — image + summary */}
            <div className="col-lg-4">
              {/* Image */}
              <div className="bg-white mb-3" style={{ border: "1px solid #e5e7eb" }}>
                <div className="px-4 py-3 border-bottom" style={{ borderColor: "#e5e7eb" }}>
                  <p className="text-uppercase fw-bold text-muted mb-0" style={{ fontSize: "0.65rem", letterSpacing: "0.1em" }}>
                    <FaImage className="me-1" />PRODUCT IMAGE
                  </p>
                </div>
                <div className="p-4">
                  {/* File picker */}
                  <label className="form-label fw-medium small mb-1">Upload Image</label>
                  <input type="file" accept="image/*"
                    onChange={e => {
                      const file = e.target.files[0];
                      if (file) {
                        setImageFile(file);
                        setImagePreview(URL.createObjectURL(file));
                      }
                    }}
                    className="form-control rounded-0 mb-3" style={{ borderColor: "#e5e7eb" }} />
                  {/* Preview */}
                  <div className="d-flex align-items-center justify-content-center bg-light"
                    style={{ height: 180, border: "1px solid #e5e7eb", position: "relative" }}>
                    {imagePreview ? (
                      <>
                        <img src={imagePreview} alt="Preview"
                          style={{ width: "100%", height: "100%", objectFit: "contain" }} />
                        <button type="button"
                          onClick={() => { setImageFile(null); setImagePreview(""); }}
                          className="btn btn-sm btn-danger position-absolute"
                          style={{ top: 6, right: 6, padding: "0.2rem 0.4rem", fontSize: "0.7rem" }}>
                          <FaTrash />
                        </button>
                      </>
                    ) : (
                      <div className="text-center text-muted">
                        <FaImage style={{ fontSize: "2rem", color: "#d1d5db" }} className="mb-2 d-block mx-auto" />
                        <span style={{ fontSize: "0.8rem" }}>Preview will appear here</span>
                      </div>
                    )}
                  </div>
                  <p className="text-muted mt-2 mb-0" style={{ fontSize: "0.75rem" }}>
                    JPEG, PNG, WebP — max 5MB
                  </p>
                </div>
              </div>

              {/* Summary */}
              <div className="bg-white" style={{ border: "1px solid #e5e7eb" }}>
                <div className="px-4 py-3 border-bottom" style={{ borderColor: "#e5e7eb" }}>
                  <p className="text-uppercase fw-bold text-muted mb-0" style={{ fontSize: "0.65rem", letterSpacing: "0.1em" }}>SUMMARY</p>
                </div>
                <div className="p-4">
                  {[
                    ["Category", formData.category || "—"],
                    ["Price", formData.price ? `₹${formData.price}` : "—"],
                    ["Stock", formData.stock_quantity !== "" ? formData.stock_quantity : "—"],
                    ["Status", stock > 10 ? "In Stock" : stock > 0 ? "Low Stock" : "Out of Stock"],
                    ["Image", imageFile ? imageFile.name : "None"],
                    ["Form", isComplete ? "Complete" : "Incomplete"],
                  ].map(([k, v]) => (
                    <div key={k} className="d-flex justify-content-between align-items-center mb-2">
                      <span className="text-muted small">{k}</span>
                      <span className="fw-semibold small text-capitalize"
                        style={{ color: v === "Complete" ? "#16a34a" : v === "Incomplete" ? "#d97706" : v === "Out of Stock" ? "#dc2626" : "#111" }}>
                        {v}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="d-flex justify-content-between align-items-center mt-4 pt-4" style={{ borderTop: "1px solid #e5e7eb" }}>
            <button type="button" onClick={() => navigate("/admin-dashboard")}
              className="btn btn-outline-dark rounded-0 px-4" disabled={saving}>
              Cancel
            </button>
            <button type="submit" disabled={saving || !formData.category}
              className="btn btn-dark rounded-0 fw-bold px-5 d-flex align-items-center gap-2">
              {saving
                ? <><span className="spinner-border spinner-border-sm" /> Adding…</>
                : <><FaSave style={{ fontSize: "0.85rem" }} /> Add Product</>}
            </button>
          </div>
        </form>
    </AdminLayout>
  );
};

export default AddProduct;
