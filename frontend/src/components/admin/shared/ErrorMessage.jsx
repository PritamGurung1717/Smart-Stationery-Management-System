import { useNavigate } from "react-router-dom";

const ErrorMessage = ({ error, backPath = "/admin-dashboard", backState = { tab: "book-sets" } }) => {
  const navigate = useNavigate();
  
  return (
    <div className="text-center py-5">
      <p className="text-danger fw-semibold mb-3">{error}</p>
      <button onClick={() => navigate(backPath, { state: backState })}
        className="btn btn-dark rounded-0 px-4">
        Back
      </button>
    </div>
  );
};

export default ErrorMessage;
