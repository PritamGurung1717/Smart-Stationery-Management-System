// Global Toast Notification System
// This replaces browser's default alert() with custom styled notifications

let toastContainer = null;
let toastQueue = [];
let isShowingToast = false;

// Initialize toast container
const initToastContainer = () => {
  if (!toastContainer) {
    toastContainer = document.createElement('div');
    toastContainer.id = 'toast-container';
    toastContainer.style.cssText = `
      position: fixed;
      top: 20px;
      right: 20px;
      z-index: 99999;
      display: flex;
      flex-direction: column;
      gap: 10px;
      pointer-events: none;
    `;
    document.body.appendChild(toastContainer);
  }
  return toastContainer;
};

// Show toast notification
export const showToast = (message, type = 'info', duration = 3500) => {
  const container = initToastContainer();
  
  const toast = document.createElement('div');
  toast.style.cssText = `
    background: ${type === 'error' ? '#fee2e2' : type === 'success' ? '#d1fae5' : type === 'warning' ? '#fef3c7' : '#dbeafe'};
    color: ${type === 'error' ? '#991b1b' : type === 'success' ? '#065f46' : type === 'warning' ? '#92400e' : '#1e40af'};
    padding: 16px 20px;
    border-radius: 8px;
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
    font-size: 0.875rem;
    font-weight: 500;
    max-width: 400px;
    min-width: 280px;
    pointer-events: auto;
    animation: slideIn 0.3s ease-out;
    display: flex;
    align-items: center;
    gap: 12px;
    position: relative;
  `;

  const icon = type === 'error' ? '✕' : type === 'success' ? '✓' : type === 'warning' ? '⚠' : 'ℹ';
  
  toast.innerHTML = `
    <span style="font-size: 1.1rem; flex-shrink: 0;">${icon}</span>
    <span style="flex: 1; line-height: 1.4;">${message}</span>
    <button style="
      background: none;
      border: none;
      color: inherit;
      font-size: 1.2rem;
      cursor: pointer;
      padding: 0;
      width: 20px;
      height: 20px;
      display: flex;
      align-items: center;
      justify-content: center;
      opacity: 0.6;
      transition: opacity 0.2s;
      flex-shrink: 0;
    " onmouseover="this.style.opacity='1'" onmouseout="this.style.opacity='0.6'">×</button>
  `;

  // Add animation keyframes if not already added
  if (!document.getElementById('toast-animations')) {
    const style = document.createElement('style');
    style.id = 'toast-animations';
    style.textContent = `
      @keyframes slideIn {
        from {
          transform: translateX(400px);
          opacity: 0;
        }
        to {
          transform: translateX(0);
          opacity: 1;
        }
      }
      @keyframes slideOut {
        from {
          transform: translateX(0);
          opacity: 1;
        }
        to {
          transform: translateX(400px);
          opacity: 0;
        }
      }
    `;
    document.head.appendChild(style);
  }

  const closeButton = toast.querySelector('button');
  const removeToast = () => {
    toast.style.animation = 'slideOut 0.3s ease-in';
    setTimeout(() => {
      if (toast.parentNode) {
        toast.parentNode.removeChild(toast);
      }
    }, 300);
  };

  closeButton.addEventListener('click', removeToast);
  
  container.appendChild(toast);

  // Auto remove after duration
  setTimeout(removeToast, duration);
};

// Convenience methods
export const toast = {
  success: (message, duration) => showToast(message, 'success', duration),
  error: (message, duration) => showToast(message, 'error', duration),
  warning: (message, duration) => showToast(message, 'warning', duration),
  info: (message, duration) => showToast(message, 'info', duration),
};

// Default export
export default toast;
