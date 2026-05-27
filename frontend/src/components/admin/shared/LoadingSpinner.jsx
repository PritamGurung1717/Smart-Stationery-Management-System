import "../../../styles/landing.css";

const LoadingSpinner = ({ message = "Loading…" }) => (
  <div className="d-flex align-items-center justify-content-center" style={{ minHeight: "50vh" }}>
    <div className="text-center">
      <div className="spinner-border mb-3" style={{ width: 36, height: 36, borderWidth: 3, color: "#1D4ED8" }} role="status">
        <span className="visually-hidden">{message}</span>
      </div>
      {message && <p className="mb-0" style={{ color: "#4B5563" }}>{message}</p>}
    </div>
  </div>
);

export default LoadingSpinner;
