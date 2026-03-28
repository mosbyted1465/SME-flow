import React from 'react';

export const Spinner = () => <span className="spinner" />;

export const Alert = ({ type = 'error', children }) => (
  <div className={`alert alert-${type}`}>{children}</div>
);

export const Badge = ({ status, priority }) => {
  const val = (status || priority || '').toUpperCase();
  const map = {
    PENDING: 'badge-gray', IN_PROGRESS: 'badge-blue', COMPLETED: 'badge-green',
    OVERDUE: 'badge-red', HIGH_PRIORITY: 'badge-red',
    LOW: 'badge-gray', MEDIUM: 'badge-blue', HIGH: 'badge-yellow', CRITICAL: 'badge-red',
    DRAFT: 'badge-gray', SENT: 'badge-blue', PAID: 'badge-green', CANCELLED: 'badge-red',
  };
  const cls = map[val] || 'badge-gray';
  return <span className={`badge ${cls}`}>{val.replace('_', ' ')}</span>;
};

export const EmptyState = ({ icon = '📭', message = 'No records found' }) => (
  <div className="empty-state">
    <div className="empty-state-icon">{icon}</div>
    <p>{message}</p>
  </div>
);

export const Modal = ({ title, onClose, children, footer }) => (
  <div className="modal-overlay" onClick={(e) => e.target === e.currentTarget && onClose()}>
    <div className="modal">
      <div className="modal-header">
        <span className="modal-title">{title}</span>
        <button className="modal-close" onClick={onClose}>×</button>
      </div>
      {children}
      {footer && <div className="modal-footer">{footer}</div>}
    </div>
  </div>
);
