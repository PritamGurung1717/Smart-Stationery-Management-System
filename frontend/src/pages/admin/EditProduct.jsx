import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import axios from "axios";
import { FaSave, FaTrash, FaImage, FaExclamationTriangle } from "react-icons/fa";
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

/* ─── Delete Confirm Modal ───────────────────────────────────── */
const DeleteModal = ({ name, onConfirm, onCancel, loading }) => (
  <div className="position-fixed top-0 start-0 w-100 h-100 d-flex align-items-center justify-content-center"
    style={{ background: "rgba(0,0,0,0.45)", zIndex: 9999 }}>
    <div className="bg-white p-4 rounded-3 shadow" style={{ maxWidth: 420, width: "90%" }}>
      <h5 className="fw-bold mb-2">Delete Product</h5>
      <p className="text-muted mb-1">Are you sure you want to delete:</p>
      <p className="fw-semibold mb-3">"{name}"?</p>
      <p className="text-muted small mb-4">This action cannot be undone.</p>
      <div className="d-flex gap-2 justify-content-end">
        <button className="btn btn-outline-dark rounded-0" onClick={onCancel} disabled={loading}>Cancel</button>
        <button className="btn btn-danger rounded-0 fw-semibold" onClick={onConfirm} disabled={loading}>
          {loading ? <span className="spinner-border spinner-border-sm me-1" /> : <FaTrash className="me-1" />}
          Delete
        </button>
      </div>
    </div>
  </div>
);

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

/* ─── EditProduct ────────────────────────────────────────────── */
const EditProduct = () => {
  const { id } = useParams();
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    name: "", category: "book", price: "", original_price: "",
    stock_quantity: "", description: "", author: "", genre: "", image_url: ""
  });
  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState("");

  const [categories] = useState([
    { value: "book", label: "Book" },
    { value: "stationery", label: "Stationery" },
    { value: "sports", label: "Sports" },
    { value: "electronics", label: "Electronics" },
    { value: "other", label: "Other" },
  ]);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [toast, setToast] = useState({ msg: "", type: "success" });
  const [loadError, setLoadError] = useState("");

  const showToast = (msg, type = "success") => {
    setToast({ msg, type });
    setTimeout(() => setToast({ msg: "", type: "success" }), 3500);
  };

  useEffect(() => {
    const fetchProduct = async () => {
      if (!id) { setLoadError("No product ID provided"); setLoading(false); return; }
      try {
        const r = await axios.get(`${API}/products/${id}`);
        const p = r.data.product || r.data;
        if (!p) throw new Error("Product not found");
        setFormData({
          name: p.name || "",
          category: p.category || "book",
          price: p.price || "",
          original_price: p.original_price || "",
          stock_quantity: p.stock_quantity ?? p.stock ?? "",
          description: p.description || "",
          author: p.author || "",
          genre: p.genre || "",
          image_url: p.image_url || p.image || "",
        });
        // Show existing image as preview
        if (p.image_url || p.image) {
          const url = p.image_url || p.image;
          setImagePreview(url.startsWith("http") ? url : `http://localhost:5000${url}`);
        }
      } catch (e) {
        setLoadError(e.response?.data?.message || e.message || "Failed to load product");
      } finally { setLoading(false); }
    };
    fetchProduct();
  }, [id]);

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
      const fd = new FormData();
      fd.append("name", formData.name.trim());
      fd.append("category", formData.category);
      fd.append("price", parseFloat(formData.price));
      if (formData.original_price) fd.append("original_price", parseFloat(formData.original_price));
      fd.append("stock_quantity", parseInt(formData.stock_quantity));
      fd.append("description", formData.description);
      fd.append("author", formData.author);
      fd.append("genre", formData.genre);
      // Only append image_url if no new file (keep existing)
      if (!imageFile) fd.append("image_url", formData.image_url || "");
      if (imageFile) fd.append("image", imageFile);

      await axios.put(`${API}/products/${id}`, fd, {
        headers: { ...authH(), "Content-Type": "multipart/form-data" }
      });
      showToast("Product updated successfully!");
    } catch (e) {
      showToast(e.response?.data?.message || "Failed to update product", "error");
    } finally { setSaving(false); }
  };

  const handleDelete = async () => {
    setDeleting(true);
    try {
      await axios.delete(`${API}/products/${id}`, { headers: authH() });
      showToast("Product deleted");
      setTimeout(() => navigate("/admin-dashboard"), 1200);
    } catch (e) {
      showToast(e.response?.data?.message || "Failed to delete", "error");
      setShowDeleteModal(false);
    } finally { setDeleting(false); }
  };

  const stock = parseInt(formData.stock_quantity) || 0;
  const isBook = formData.category === "book";
  const stockLabel = stock <= 0 ? "Out of Stock" : stock <= 10 ? "Low Stock" : "In Stock";
  const stockColor = stock <= 0 ? "#dc2626" : stock <= 10 ? "#d97706" : "#16a34a";

  if (loading) return (
    <AdminLayout activeTab="products">
      <div className="d-flex align-items-center justify-content-center" style={{ minHeight: "60vh" }}>
        <div className="text-center">
          <div className="spinner-border text-dark mb-3" style={{ width: 36, height: 36, borderWidth: 3 }} role="status" />
          <p className="text-muted small">Loading product…</p>
        </div>
      </div>
    </AdminLayout>
  );

  if (loadError) return (
    <AdminLayout activeTab="products">
      <div className="d-flex align-items-center justify-content-center" style={{ minHeight: "60vh" }}>
        <div className="text-center p-4">
          <FaExclamationTriangle style={{ fontSize: "2.5rem", color: "#ef4444" }} className="mb-3 d-block mx-auto" />
          <h5 className="fw-bold mb-2">Failed to load product</h5>
          <p className="text-muted mb-4">{loadError}</p>
          <button onClick={() => navigate("/admin-dashboard")} className="btn btn-dark rounded-0 fw-semibold px-4">
            Back to Dashboard
          </button>
        </div>
      </div>
    </AdminLayout>
  );

  return (
    <AdminLayout activeTab="products"
      topBar={
        <span className="fw-semibold small px-3 py-1"
          style={{ background: stock <= 0 ? "#fee2e2" : stock <= 10 ? "#fef3c7" : "#d1fae5", color: stockColor, borderRadius: 20 }}>
          {stockLabel}
        </span>
      }>
      <Toast msg={toast.msg} type={toast.type} onClose={() => setToast({ msg: "", type: "success" })} />
      {showDeleteModal && (
        <DeleteModal name={formData.name} loading={deleting}
          onConfirm={handleDelete} onCancel={() => setShowDeleteModal(false)} />
      )}

      {/* Page title */}
      <div className="mb-4">
        <p className="text-uppercase fw-bold text-muted mb-1" style={{ fontSize: "0.65rem", letterSpacing: "0.1em" }}>PRODUCTS</p>
        <h2 className="fw-bold mb-0" style={{ fontSize: "clamp(1.4rem,3vw,1.9rem)", letterSpacing: "-0.02em" }}>
          Edit Product <span className="text-muted fw-normal" style={{ fontSize: "0.75em" }}>#{id}</span>
        </h2>
      </div>
        <form onSubmit={handleSubmit}>
          <div className="row g-4">

            {/* Left — main fields */}
            <div className="col-lg-8">
              <div className="bg-white mb-3" style={{ border: "1px solid #e5e7eb" }}>
                <div className="px-4 py-3 border-bottom" style={{ borderColor: "#e5e7eb" }}>
                  <p className="text-uppercase fw-bold text-muted mb-0" style={{ fontSize: "0.65rem", letterSpacing: "0.1em" }}>BASIC INFORMATION</p>
                </div>
                <div className="p-4">
                  <Field label="Product Name" required>
                    <input name="name" value={formData.name} onChange={set} required
                      className="form-control" style={inputStyle} />
                  </Field>

                  <div className="row g-3">
                    <div className="col-md-6">
                      <Field label="Category" required>
                        <select name="category" value={formData.category} onChange={set} required
                          className="form-select" style={inputStyle}>
                          {categories.map(c => <option key={c.value} value={c.value}>{c.label}</option>)}
                        </select>
                      </Field>
                    </div>
                    <div className="col-md-3">
                      <Field label="Price (₹)" required>
                        <input name="price" type="number" min="0" step="0.01" value={formData.price} onChange={set} required
                          className="form-control" style={inputStyle} />
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
                          className="form-control" style={inputStyle} />
                      </Field>
                    </div>
                  </div>

                  {isBook && (
                    <div className="row g-3">
                      <div className="col-md-6">
                        <Field label="Author" required>
                          <input name="author" value={formData.author} onChange={set} required
                            className="form-control" style={inputStyle} />
                        </Field>
                      </div>
                      <div className="col-md-6">
                        <Field label="Genre">
                          <input name="genre" value={formData.genre} onChange={set}
                            className="form-control" style={inputStyle} />
                        </Field>
                      </div>
                    </div>
                  )}

                  <Field label="Description">
                    <textarea name="description" value={formData.description} onChange={set} rows={4}
                      className="form-control" style={{ ...inputStyle, resize: "vertical" }} />
                  </Field>
                </div>
              </div>
            </div>

            {/* Right — image + status */}
            <div className="col-lg-4">
              {/* Image */}
              <div className="bg-white mb-3" style={{ border: "1px solid #e5e7eb" }}>
                <div className="px-4 py-3 border-bottom" style={{ borderColor: "#e5e7eb" }}>
                  <p className="text-uppercase fw-bold text-muted mb-0" style={{ fontSize: "0.65rem", letterSpacing: "0.1em" }}>
                    <FaImage className="me-1" />PRODUCT IMAGE
                  </p>
                </div>
                <div className="p-4">
                  <label className="form-label fw-medium small mb-1">
                    {imagePreview && !imageFile ? "Replace Image" : "Upload Image"}
                  </label>
                  <input type="file" accept="image/*"
                    onChange={e => {
                      const file = e.target.files[0];
                      if (file) {
                        setImageFile(file);
                        setImagePreview(URL.createObjectURL(file));
                      }
                    }}
                    className="form-control rounded-0 mb-3" style={{ borderColor: "#e5e7eb" }} />
                  <div className="d-flex align-items-center justify-content-center bg-light"
                    style={{ height: 180, border: "1px solid #e5e7eb", position: "relative" }}>
                    {imagePreview ? (
                      <>
                        <img src={imagePreview} alt="Preview"
                          style={{ width: "100%", height: "100%", objectFit: "contain" }}
                          onError={e => { e.target.style.display = "none"; }} />
                        <button type="button"
                          onClick={() => {
                            setImageFile(null);
                            setImagePreview("");
                            setFormData(p => ({ ...p, image_url: "" }));
                          }}
                          className="btn btn-sm btn-danger position-absolute"
                          style={{ top: 6, right: 6, padding: "0.2rem 0.4rem", fontSize: "0.7rem" }}>
                          <FaTrash />
                        </button>
                      </>
                    ) : (
                      <div className="text-center text-muted">
                        <FaImage style={{ fontSize: "2rem", color: "#d1d5db" }} className="mb-2 d-block mx-auto" />
                        <span style={{ fontSize: "0.8rem" }}>No image</span>
                      </div>
                    )}
                  </div>
                  {imageFile && (
                    <p className="text-muted mt-2 mb-0" style={{ fontSize: "0.75rem" }}>
                      New: {imageFile.name}
                    </p>
                  )}
                  {!imageFile && formData.image_url && (
                    <p className="text-muted mt-2 mb-0" style={{ fontSize: "0.75rem" }}>
                      Current image will be kept unless replaced
                    </p>
                  )}
                  <p className="text-muted mt-1 mb-0" style={{ fontSize: "0.72rem" }}>
                    JPEG, PNG, WebP — max 5MB
                  </p>
                </div>
              </div>

              {/* Status */}
              <div className="bg-white" style={{ border: "1px solid #e5e7eb" }}>
                <div className="px-4 py-3 border-bottom" style={{ borderColor: "#e5e7eb" }}>
                  <p className="text-uppercase fw-bold text-muted mb-0" style={{ fontSize: "0.65rem", letterSpacing: "0.1em" }}>PRODUCT STATUS</p>
                </div>
                <div className="p-4">
                  {[
                    ["Category", formData.category || "—"],
                    ["Price", formData.price ? `₹${formData.price}` : "—"],
                    ["Stock", formData.stock_quantity !== "" ? formData.stock_quantity : "—"],
                    ["Status", stockLabel],
                  ].map(([k, v]) => (
                    <div key={k} className="d-flex justify-content-between align-items-center mb-2">
                      <span className="text-muted small">{k}</span>
                      <span className="fw-semibold small text-capitalize"
                        style={{ color: k === "Status" ? stockColor : "#111" }}>
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
            <div className="d-flex gap-2">
              <button type="button" onClick={() => navigate("/admin-dashboard")}
                className="btn btn-outline-dark rounded-0 px-4" disabled={saving || deleting}>
                Cancel
              </button>
              <button type="button" onClick={() => setShowDeleteModal(true)}
                className="btn btn-outline-danger rounded-0 px-4 d-flex align-items-center gap-1" disabled={saving || deleting}>
                <FaTrash style={{ fontSize: "0.8rem" }} /> Delete
              </button>
            </div>
            <button type="submit" disabled={saving || deleting}
              className="btn btn-dark rounded-0 fw-bold px-5 d-flex align-items-center gap-2">
              {saving
                ? <><span className="spinner-border spinner-border-sm" /> Saving…</>
                : <><FaSave style={{ fontSize: "0.85rem" }} /> Update Product</>}
            </button>
          </div>
        </form>
    </AdminLayout>
  );
};

export default EditProduct;
