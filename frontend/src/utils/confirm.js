// Custom Confirm Dialog System
// Replaces browser's default window.confirm() with custom styled dialogs

let confirmContainer = null;
let resolveCallback = null;

// Initialize confirm container
const initConfirmContainer = () => {
  if (!confirmContainer) {
    confirmContainer = document.createElement('div');
    confirmContainer.id = 'confirm-container';
    document.body.appendChild(confirmContainer);
  }
  return confirmContainer;
};

// Show confirm dialog
export const confirm = (message, options = {}) => {
  return new Promise((resolve) => {
    const container = initConfirmContainer();
    resolveCallback = resolve;

    const {
      title = 'Confirm Action',
      confirmText = 'OK',
      cancelText = 'Cancel',
      confirmColor = '#111',
      cancelColor = '#6b7280'
    } = options;

    // Create overlay
    const overlay = document.createElement('div');
    overlay.style.cssText = `
      position: fixed;
      inset: 0;
      background: rgba(0, 0, 0, 0.5);
      z-index: 99999;
      display: flex;
      align-items: center;
      justify-content: center;
      animation: fadeIn 0.2s ease-out;
    `;

    // Create dialog
    const dialog = document.createElement('div');
    dialog.style.cssText = `
      background: white;
      border-radius: 12px;
      box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04);
      max-width: 400px;
      width: 90%;
      padding: 24px;
      animation: slideIn 0.2s ease-out;
    `;

    dialog.innerHTML = `
      <div style="margin-bottom: 16px;">
        <h3 style="font-size: 1.125rem; font-weight: 600; color: #111; margin: 0 0 8px 0;">${title}</h3>
        <p style="font-size: 0.875rem; color: #6b7280; margin: 0; line-height: 1.5;">${message}</p>
      </div>
      <div style="display: flex; gap: 12px; justify-content: flex-end;">
        <button id="confirm-cancel" style="
          background: white;
          border: 1px solid #e5e7eb;
          color: ${cancelColor};
          padding: 8px 16px;
          border-radius: 6px;
          font-size: 0.875rem;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.2s;
        ">${cancelText}</button>
        <button id="confirm-ok" style="
          background: ${confirmColor};
          border: none;
          color: white;
          padding: 8px 16px;
          border-radius: 6px;
          font-size: 0.875rem;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.2s;
        ">${confirmText}</button>
      </div>
    `;

    // Add animations
    if (!document.getElementById('confirm-animations')) {
      const style = document.createElement('style');
      style.id = 'confirm-animations';
      style.textContent = `
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        @keyframes slideIn {
          from { transform: scale(0.95); opacity: 0; }
          to { transform: scale(1); opacity: 1; }
        }
        @keyframes fadeOut {
          from { opacity: 1; }
          to { opacity: 0; }
        }
        #confirm-cancel:hover {
          background: #f9fafb !important;
        }
        #confirm-ok:hover {
          opacity: 0.9 !important;
        }
      `;
      document.head.appendChild(style);
    }

    overlay.appendChild(dialog);
    container.appendChild(overlay);

    // Handle buttons
    const handleResponse = (result) => {
      overlay.style.animation = 'fadeOut 0.2s ease-in';
      setTimeout(() => {
        if (overlay.parentNode) {
          overlay.parentNode.removeChild(overlay);
        }
        resolve(result);
      }, 200);
    };

    dialog.querySelector('#confirm-ok').addEventListener('click', () => handleResponse(true));
    dialog.querySelector('#confirm-cancel').addEventListener('click', () => handleResponse(false));
    
    // Close on overlay click
    overlay.addEventListener('click', (e) => {
      if (e.target === overlay) handleResponse(false);
    });

    // Close on Escape key
    const handleEscape = (e) => {
      if (e.key === 'Escape') {
        handleResponse(false);
        document.removeEventListener('keydown', handleEscape);
      }
    };
    document.addEventListener('keydown', handleEscape);
  });
};

// Default export
export default confirm;
