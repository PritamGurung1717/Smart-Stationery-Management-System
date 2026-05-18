const LoadingSpinner = ({ message = "Loading…" }) => (
  <div className="d-flex align-items-center justify-content-center" style={{ minHeight: "60vh" }}>
    <div className="text-center">
      <div className="spinner-border text-dark" style={{ width: 36, height: 36, borderWidth: 3 }} role="status">
        <span className="visually-hidden">{message}</span>
      </div>
      {message && <p className="text-muted mt-3 mb-0">{message}</p>}
    </div>
  </div>
);

export default LoadingSpinner;
