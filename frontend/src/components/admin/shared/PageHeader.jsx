import { FaChevronLeft } from "react-icons/fa";
import { useNavigate } from "react-router-dom";

const PageHeader = ({ title, subtitle, backPath, backLabel = "Back" }) => {
  const navigate = useNavigate();
  
  return (
    <div className="mb-4">
      {backPath && (
        <button onClick={() => navigate(backPath)}
          style={{ background: "none", border: "none", cursor: "pointer", color: "#6b7280", fontSize: "0.875rem", display: "inline-flex", alignItems: "center", gap: "0.4rem", padding: 0, marginBottom: "0.5rem" }}>
          <FaChevronLeft style={{ fontSize: "0.7rem" }} /> {backLabel}
        </button>
      )}
      {subtitle && (
        <p className="text-uppercase fw-bold text-muted mb-1" style={{ fontSize: "0.65rem", letterSpacing: "0.1em" }}>
          {subtitle}
        </p>
      )}
      <h2 className="fw-bold mb-0" style={{ fontSize: "clamp(1.4rem,3vw,1.9rem)", letterSpacing: "-0.02em" }}>
        {title}
      </h2>
    </div>
  );
};

export default PageHeader;
