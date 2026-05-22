import React from 'react';
import { Alert, Button } from 'react-bootstrap';
import { FaExclamationTriangle } from 'react-icons/fa';
import toast from "../utils/toast.js";
import confirm from "../utils/confirm.js";

const TokenErrorAlert = ({ show, onClose }) => {
  const handleFixToken = async () => {
    const ok = await confirm(
      'This will clear your cache and log you out. You will need to login again. Continue?',
      { title: 'Fix Authentication', confirmText: 'Clear & Logout', confirmColor: '#dc2626' }
    );
    if (!ok) return;

    localStorage.clear();
    sessionStorage.clear();
    toast.success('Cache cleared! Redirecting to login...');
    window.location.href = '/login';
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
