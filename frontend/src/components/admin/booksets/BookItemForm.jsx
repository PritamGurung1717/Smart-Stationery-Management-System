import { FaTrash } from "react-icons/fa";
import "../../../styles/landing.css";

const inputStyle = {
  border: "1px solid #E5E7EB",
  borderRadius: 8,
  padding: "0.5rem 0.75rem",
  fontSize: "0.875rem",
};

const BookItemForm = ({ item, index, onChange, onRemove, canRemove, isRequest = false }) => {
  const titleField = isRequest ? "book_title" : "title";
  const priceField = isRequest ? "estimated_price" : "price";

  return (
    <div
      className="mb-3 p-3"
      style={{
        background: "#fff",
        border: "1px solid #E5E7EB",
        borderRadius: 10,
        borderLeft: "3px solid #1D4ED8",
      }}
    >
      <div className="d-flex justify-content-between align-items-center mb-3">
        <span className="fw-semibold small" style={{ color: "#1D4ED8" }}>Book {index + 1}</span>
        {canRemove && (
          <button
            type="button"
            onClick={() => onRemove(index)}
            className="btn btn-sm btn-outline-danger d-flex align-items-center gap-1"
            style={{ borderRadius: 8, fontSize: "0.75rem" }}
          >
            <FaTrash style={{ fontSize: "0.65rem" }} /> Remove
          </button>
        )}
      </div>
      <div className="row g-2">
        <div className="col-md-6">
          <label className="form-label small fw-medium">Title *</label>
          <input
            type="text"
            value={item[titleField] || ""}
            onChange={(e) => onChange(index, titleField, e.target.value)}
            className="form-control form-control-sm"
            style={inputStyle}
            placeholder="Book title"
            required
          />
        </div>
        <div className="col-md-6">
          <label className="form-label small fw-medium">Subject {isRequest ? "*" : ""}</label>
          <input
            type="text"
            value={item.subject_name || ""}
            onChange={(e) => onChange(index, "subject_name", e.target.value)}
            className="form-control form-control-sm"
            style={inputStyle}
            placeholder="e.g., Math, Science"
            required={isRequest}
          />
        </div>
        <div className="col-md-4">
          <label className="form-label small fw-medium">Author {!isRequest && "*"}</label>
          <input
            type="text"
            value={item.author || ""}
            onChange={(e) => onChange(index, "author", e.target.value)}
            className="form-control form-control-sm"
            style={inputStyle}
            placeholder="Author name"
            required={!isRequest}
          />
        </div>
        <div className="col-md-4">
          <label className="form-label small fw-medium">Publisher {!isRequest && "*"}</label>
          <input
            type="text"
            value={item.publisher || ""}
            onChange={(e) => onChange(index, "publisher", e.target.value)}
            className="form-control form-control-sm"
            style={inputStyle}
            placeholder="Publisher name"
            required={!isRequest}
          />
        </div>
        <div className="col-md-4">
          <label className="form-label small fw-medium">Year {!isRequest && "*"}</label>
          <input
            type="number"
            value={item.publication_year || new Date().getFullYear()}
            onChange={(e) => onChange(index, "publication_year", e.target.value)}
            className="form-control form-control-sm"
            style={inputStyle}
            min="1900"
            max={new Date().getFullYear() + 1}
            required={!isRequest}
          />
        </div>
        <div className="col-md-6">
          <label className="form-label small fw-medium">ISBN</label>
          <input
            type="text"
            value={item.isbn || ""}
            onChange={(e) => onChange(index, "isbn", e.target.value)}
            className="form-control form-control-sm"
            style={inputStyle}
            placeholder="ISBN (optional)"
          />
        </div>
        <div className="col-md-6">
          <label className="form-label small fw-medium">{isRequest ? "Estimated price (₹) *" : "Price (₹) *"}</label>
          <input
            type="number"
            value={item[priceField] ?? ""}
            onChange={(e) => onChange(index, priceField, e.target.value)}
            className="form-control form-control-sm"
            style={inputStyle}
            placeholder="0.00"
            step="0.01"
            min="0"
            required
          />
        </div>
      </div>
    </div>
  );
};

export default BookItemForm;
