import { FaPlus } from "react-icons/fa";
import BookItemForm from "./BookItemForm";
import "../../../styles/landing.css";

const inputStyle = {
  border: "1px solid #E5E7EB",
  borderRadius: 8,
  padding: "0.5rem 0.75rem",
  fontSize: "0.875rem",
};

const BookSetForm = ({
  formData,
  onFieldChange,
  onItemChange,
  onAddItem,
  onRemoveItem,
  onSubmit,
  loading,
  cancelPath,
  submitLabel = "Save",
  showActiveToggle = true,
  isRequest = false,
}) => {
  const priceField = isRequest ? "estimated_price" : "price";
  const totalPrice = formData.items.reduce(
    (sum, item) => sum + (Number(item[priceField]) || 0),
    0
  );

  return (
    <form onSubmit={onSubmit}>
      <div className="ss-card mb-4 overflow-hidden">
        <div className="px-4 py-3 border-bottom" style={{ borderColor: "#E5E7EB" }}>
          <p className="ss-section-label mb-0">BASIC INFORMATION</p>
        </div>
        <div className="p-4">
          <div className="row g-3">
            <div className="col-md-6">
              <label className="form-label fw-medium small">School Name *</label>
              <input
                type="text"
                name="school_name"
                value={formData.school_name}
                onChange={onFieldChange}
                className="form-control"
                style={inputStyle}
                placeholder="Enter school name"
                required
              />
            </div>
            <div className="col-md-6">
              <label className="form-label fw-medium small">Grade *</label>
              <input
                type="text"
                name="grade"
                value={formData.grade}
                onChange={onFieldChange}
                className="form-control"
                style={inputStyle}
                placeholder="e.g., 1, 2, 10"
                required
              />
            </div>
            {showActiveToggle && (
              <div className="col-12">
                <div
                  className="form-check p-3"
                  style={{ background: "#EFF6FF", borderRadius: 8, border: "1px solid #BFDBFE" }}
                >
                  <input
                    type="checkbox"
                    name="is_active"
                    checked={formData.is_active}
                    onChange={onFieldChange}
                    className="form-check-input"
                    id="is_active"
                    style={{ cursor: "pointer" }}
                  />
                  <label className="form-check-label small fw-medium" htmlFor="is_active" style={{ cursor: "pointer" }}>
                    Active — visible to customers in the catalogue
                  </label>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="ss-card mb-4 overflow-hidden">
        <div className="px-4 py-3 border-bottom d-flex justify-content-between align-items-center flex-wrap gap-2"
          style={{ borderColor: "#E5E7EB" }}>
          <div>
            <p className="ss-section-label mb-1">BOOKS</p>
            <h5 className="fw-bold mb-0" style={{ fontSize: "1rem" }}>
              {formData.items.length} {formData.items.length === 1 ? "book" : "books"}
              {formData.items.length > 0 && (
                <span className="text-muted fw-normal ms-2" style={{ fontSize: "0.85rem" }}>
                  · Total ₹{totalPrice.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </span>
              )}
            </h5>
          </div>
          <button
            type="button"
            onClick={onAddItem}
            className="btn landing-btn-primary btn-sm d-flex align-items-center gap-1"
          >
            <FaPlus style={{ fontSize: "0.7rem" }} /> Add Book
          </button>
        </div>
        <div className="p-4" style={{ background: "#F9FAFB" }}>
          {formData.items.length === 0 ? (
            <div className="text-center py-5" style={{ color: "#4B5563" }}>
              <p className="mb-2 fw-medium">No books added yet</p>
              <p className="small mb-3">Add at least one book to {isRequest ? "complete this request" : "create the set"}.</p>
              <button type="button" onClick={onAddItem} className="btn landing-btn-primary btn-sm">
                <FaPlus className="me-1" /> Add first book
              </button>
            </div>
          ) : (
            formData.items.map((item, index) => (
              <BookItemForm
                key={index}
                item={item}
                index={index}
                onChange={onItemChange}
                onRemove={onRemoveItem}
                canRemove={formData.items.length > 1}
                isRequest={isRequest}
              />
            ))
          )}
        </div>
      </div>

      <div
        className="d-flex justify-content-between align-items-center flex-wrap gap-3 pt-4"
        style={{ borderTop: "1px solid #E5E7EB" }}
      >
        <button type="button" onClick={cancelPath} className="btn ss-btn-outline px-4" disabled={loading}>
          Cancel
        </button>
        <div className="d-flex align-items-center gap-3">
          {formData.items.length > 0 && (
            <span className="fw-bold" style={{ color: "#1D4ED8", fontSize: "1.05rem" }}>
              Total: ₹{totalPrice.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </span>
          )}
          <button type="submit" disabled={loading} className="btn landing-btn-primary fw-bold px-5 d-flex align-items-center gap-2">
            {loading && <span className="spinner-border spinner-border-sm" />}
            {submitLabel}
          </button>
        </div>
      </div>
    </form>
  );
};

export default BookSetForm;
