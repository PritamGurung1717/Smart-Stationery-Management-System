import { Button } from 'react-bootstrap';
import { FaSync } from 'react-icons/fa';
import toast from "../utils/toast.js";

const ClearCacheButton = () => {
  const handleClearCache = () => {
    if (window.confirm('This will clear your cache and log you out. You will need to login again. Continue?')) {
      // Clear all storage
      localStorage.clear();
      sessionStorage.clear();
      
      // Clear cookies
      document.cookie.split(";").forEach((c) => {
        document.cookie = c
          .replace(/^ +/, "")
          .replace(/=.*/, "=;expires=" + new Date().toUTCString() + ";path=/");
      });
      
      // Show success message
      toast.success('Cache cleared successfully! Please login again.');
      
      // Redirect to login
      window.location.href = '/login';
    }
  };

  return (
    <Button 
      variant="outline-warning" 
      size="sm"
      onClick={handleClearCache}
      title="Clear cache and fix token issues"
    >
      <FaSync className="me-1" />
      Clear Cache & Re-login
    </Button>
  );
};

export default ClearCacheButton;
