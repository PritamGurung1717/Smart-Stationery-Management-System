const StatusPill = ({ status }) => {
  const statusMap = {
    pending:   { bg: "#fef3c7", color: "#92400e" },
    approved:  { bg: "#d1fae5", color: "#065f46" },
    rejected:  { bg: "#fee2e2", color: "#991b1b" },
    active:    { bg: "#d1fae5", color: "#065f46" },
    inactive:  { bg: "#fee2e2", color: "#991b1b" },
  };
  const style = statusMap[status] || { bg: "#f3f4f6", color: "#374151" };
  return (
    <span className="fw-semibold text-capitalize"
      style={{ background: style.bg, color: style.color, padding: "0.25rem 0.75rem", borderRadius: 20, fontSize: "0.78rem" }}>
      {status}
    </span>
  );
};

export default StatusPill;
