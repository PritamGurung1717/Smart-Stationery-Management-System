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

export default Toast;
