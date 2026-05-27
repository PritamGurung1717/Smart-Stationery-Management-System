import { FaChevronLeft } from "react-icons/fa";
import { useNavigate } from "react-router-dom";
import "../../../styles/landing.css";

const PageHeader = ({ title, subtitle, backPath, backState, backLabel = "Back" }) => {
  const navigate = useNavigate();

  return (
    <div className="mb-4">
      {backPath && (
        <button
          type="button"
          onClick={() => navigate(backPath, backState ? { state: backState } : undefined)}
          className="ss-back-link border-0 bg-transparent p-0 mb-2"
        >
          <FaChevronLeft style={{ fontSize: "0.7rem" }} /> {backLabel}
        </button>
      )}
      {subtitle && <p className="ss-section-label mb-1">{subtitle}</p>}
      <h2 className="ss-page-title mb-0">{title}</h2>
    </div>
  );
};

export default PageHeader;
