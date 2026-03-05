import React from 'react';
import { Alert, Button } from 'react-bootstrap';
import { FaExclamationTriangle } from 'react-icons/fa';

const TokenErrorAlert = ({ show, onClose }) => {
  const handleFixToken = () => {
    if (window.confirm('This will clear your cache and log you out. You will need to login again. Continue?')) {
      localStorage.clear();
      sessionStorage.clear();
      alert('Cache cleared! Redirecting to login...');
      window.location.href = '/login';
    }
  };

  if (!show) return null;

  return (
    <Alert variant="danger" dismissible onClose={onClose} className="mb-3">
      <Alert.Heading>
        <FaExclamationTriangle className="me-2" />
        Authentication Error
      </Alert.Heading>
      <p>
        Your login session is corrupted or expired. This usually happens when browser cache gets corrupted.
      </p>
      <hr />
      <div className="d-flex justify-content-end gap-2">
        <Button variant="outline-danger" size="sm" onClick={onClose}>
          Dismiss
        </Button>
        <Button variant="danger" size="sm" onClick={handleFixToken}>
          Clear Cache & Re-login
        </Button>
      </div>
    </Alert>
  );
};

export default TokenErrorAlert;
