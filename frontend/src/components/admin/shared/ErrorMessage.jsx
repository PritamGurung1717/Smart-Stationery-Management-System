import { useNavigate } from "react-router-dom";
import "../../../styles/landing.css";

const ErrorMessage = ({ error, backPath = "/admin-dashboard", backState = { tab: "book-sets" } }) => {
  const navigate = useNavigate();

  return (
    <div className="text-center py-5">
      <p className="text-danger fw-semibold mb-3">{error}</p>
      <button type="button" onClick={() => navigate(backPath, { state: backState })}
        className="btn landing-btn-primary px-4">
        Back
      </button>
    </div>
  );
};

export default ErrorMessage;
