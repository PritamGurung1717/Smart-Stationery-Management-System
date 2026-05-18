const ConfirmModal = ({ show, title, message, onConfirm, onCancel, loading, danger }) => {
  if (!show) return null;
  return (
    <div className="position-fixed top-0 start-0 w-100 h-100 d-flex align-items-center justify-content-center"
      style={{ background: "rgba(0,0,0,0.45)", zIndex: 9999 }}>
      <div className="bg-white p-4 rounded-3 shadow" style={{ maxWidth: 420, width: "90%" }}>
        <h5 className="fw-bold mb-2">{title}</h5>
        <p className="text-muted mb-4" style={{ fontSize: "0.9rem" }}>{message}</p>
        <div className="d-flex gap-2 justify-content-end">
          <button className="btn btn-outline-dark rounded-0" onClick={onCancel} disabled={loading}>Cancel</button>
          <button className={`btn rounded-0 fw-semibold ${danger ? "btn-danger" : "btn-dark"}`}
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
