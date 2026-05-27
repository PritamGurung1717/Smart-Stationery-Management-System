import "../../../styles/landing.css";

const ConfirmModal = ({ show, title, message, onConfirm, onCancel, loading, danger }) => {
  if (!show) return null;
  return (
    <div className="position-fixed top-0 start-0 w-100 h-100 d-flex align-items-center justify-content-center"
      style={{ background: "rgba(0,0,0,0.45)", zIndex: 9999 }}>
      <div className="ss-card p-4 shadow" style={{ maxWidth: 420, width: "90%" }}>
        <h5 className="fw-bold mb-2">{title}</h5>
        <p className="mb-4" style={{ fontSize: "0.9rem", color: "#4B5563" }}>{message}</p>
        <div className="d-flex gap-2 justify-content-end">
          <button type="button" className="btn ss-btn-outline" onClick={onCancel} disabled={loading}>Cancel</button>
          <button type="button"
            className={`btn fw-semibold ${danger ? "btn-danger" : "landing-btn-primary"}`}
            onClick={onConfirm} disabled={loading}>
            {loading && <span className="spinner-border spinner-border-sm me-1" />}
            Confirm
          </button>
        </div>
      </div>
    </div>
  );
};

export default ConfirmModal;
