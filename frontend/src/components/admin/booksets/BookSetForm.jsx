import { FaPlus } from "react-icons/fa";
import BookItemForm from "./BookItemForm";

const inputStyle = {
  border: "1px solid #e5e7eb",
  borderRadius: 0,
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
  isRequest = false 
}) => {
  return (
    <form onSubmit={onSubmit}>
      {/* Basic Information */}
      <div className="bg-white border p-4 mb-4">
        <h5 className="fw-bold mb-3">Basic Information</h5>
        <div className="row g-3">
          <div className="col-md-6">
            <label className="form-label fw-semibold small">School Name *</label>
            <input type="text" name="school_name" value={formData.school_name}
              onChange={onFieldChange} className="form-control" style={inputStyle}
              placeholder="Enter school name" required />
          </div>
          <div className="col-md-6">
            <label className="form-label fw-semibold small">Grade *</label>
            <input type="text" name="grade" value={formData.grade}
              onChange={onFieldChange} className="form-control" style={inputStyle}
              placeholder="e.g., 1, 2, 10, etc." required />
          </div>
          {showActiveToggle && (
            <div className="col-12">
              <div className="form-check">
                <input type="checkbox" name="is_active" checked={formData.is_active}
                  onChange={onFieldChange} className="form-check-input" id="is_active" />
                <label className="form-check-label small" htmlFor="is_active">
                  Active (visible to customers)
                </label>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Books List */}
      <div className="bg-white border p-4 mb-4">
        <div className="d-flex justify-content-between align-items-center mb-3">
          <h5 className="fw-bold mb-0">Books ({formData.items.length})</h5>
          <button type="button" onClick={onAddItem}
            className="btn btn-dark btn-sm rounded-0 d-flex align-items-center gap-1">
            <FaPlus style={{ fontSize: "0.7rem" }} /> Add Book
          </button>
        </div>

        {formData.items.length === 0 ? (
          <div className="text-center py-5 text-muted">
            <p>No books added yet. Click "Add Book" to start.</p>
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

      {/* Form Actions */}
      <div className="d-flex gap-2">
        <button type="submit" disabled={loading}
          className="btn btn-dark rounded-0 fw-semibold px-4">
          {loading && <span className="spinner-border spinner-border-sm me-2" />}
          {submitLabel}
        </button>
        <button type="button" onClick={cancelPath}
          className="btn btn-outline-dark rounded-0 px-4" disabled={loading}>
          Cancel
        </button>
      </div>
    </form>
  );
};

export default BookSetForm;
