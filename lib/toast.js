/**
 * Simple toast notification system for upload feedback
 */

class ToastManager {
  constructor() {
    this.toasts = [];
    this.container = null;
    this.init();
  }

  init() {
    // Create toast container if it doesn't exist
    if (typeof window !== 'undefined' && !document.getElementById('toast-container')) {
      this.container = document.createElement('div');
      this.container.id = 'toast-container';
      this.container.className = 'toast-container';
      document.body.appendChild(this.container);
      
      // Add CSS styles
      const style = document.createElement('style');
      style.textContent = `
        .toast-container {
          position: fixed;
          top: 1rem;
          right: 1rem;
          z-index: 9999;
          display: flex;
          flex-direction: column;
          gap: 0.5rem;
          pointer-events: none;
        }

        .toast {
          background: white;
          border-radius: 8px;
          padding: 1rem;
          box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05);
          border-left: 4px solid;
          min-width: 300px;
          max-width: 400px;
          pointer-events: auto;
          transform: translateX(100%);
          opacity: 0;
          transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
        }

        .toast.show {
          transform: translateX(0);
          opacity: 1;
        }

        .toast.success {
          border-left-color: #10b981;
        }

        .toast.error {
          border-left-color: #ef4444;
        }

        .toast.warning {
          border-left-color: #f59e0b;
        }

        .toast.info {
          border-left-color: #3b82f6;
        }

        .toast-content {
          display: flex;
          align-items: flex-start;
          gap: 0.75rem;
        }

        .toast-icon {
          flex-shrink: 0;
          width: 20px;
          height: 20px;
          margin-top: 0.125rem;
        }

        .toast-icon.success {
          color: #10b981;
        }

        .toast-icon.error {
          color: #ef4444;
        }

        .toast-icon.warning {
          color: #f59e0b;
        }

        .toast-icon.info {
          color: #3b82f6;
        }

        .toast-message {
          flex: 1;
        }

        .toast-title {
          font-weight: 600;
          color: #1f2937;
          margin-bottom: 0.25rem;
        }

        .toast-description {
          font-size: 0.875rem;
          color: #6b7280;
        }

        .toast-close {
          background: none;
          border: none;
          color: #9ca3af;
          cursor: pointer;
          padding: 0.25rem;
          border-radius: 4px;
          transition: color 0.2s ease;
        }

        .toast-close:hover {
          color: #6b7280;
        }

        @media (max-width: 640px) {
          .toast-container {
            left: 1rem;
            right: 1rem;
          }
          
          .toast {
            min-width: auto;
            max-width: none;
          }
        }
      `;
      document.head.appendChild(style);
    } else if (typeof window !== 'undefined') {
      this.container = document.getElementById('toast-container');
    }
  }

  show(message, type = 'info', options = {}) {
    if (typeof window === 'undefined') return;

    const {
      title,
      duration = 5000,
      closable = true
    } = options;

    const toastId = Date.now() + Math.random();
    
    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    toast.dataset.toastId = toastId;

    const iconMap = {
      success: '✓',
      error: '✕',
      warning: '⚠',
      info: 'ℹ'
    };

    toast.innerHTML = `
      <div class="toast-content">
        <div class="toast-icon ${type}">${iconMap[type] || iconMap.info}</div>
        <div class="toast-message">
          ${title ? `<div class="toast-title">${title}</div>` : ''}
          <div class="toast-description">${message}</div>
        </div>
        ${closable ? '<button class="toast-close" onclick="toastManager.dismiss(' + toastId + ')">✕</button>' : ''}
      </div>
    `;

    this.container.appendChild(toast);

    // Trigger animation
    setTimeout(() => {
      toast.classList.add('show');
    }, 10);

    // Auto dismiss
    if (duration > 0) {
      setTimeout(() => {
        this.dismiss(toastId);
      }, duration);
    }

    return toastId;
  }

  dismiss(toastId) {
    if (typeof window === 'undefined') return;

    const toast = this.container?.querySelector(`[data-toast-id="${toastId}"]`);
    if (toast) {
      toast.classList.remove('show');
      setTimeout(() => {
        if (toast.parentNode) {
          toast.parentNode.removeChild(toast);
        }
      }, 300);
    }
  }

  success(message, options = {}) {
    return this.show(message, 'success', options);
  }

  error(message, options = {}) {
    return this.show(message, 'error', options);
  }

  warning(message, options = {}) {
    return this.show(message, 'warning', options);
  }

  info(message, options = {}) {
    return this.show(message, 'info', options);
  }
}

// Create global instance
const toastManager = typeof window !== 'undefined' ? new ToastManager() : null;

// Make it globally available for onclick handlers
if (typeof window !== 'undefined') {
  window.toastManager = toastManager;
}

export default toastManager;



