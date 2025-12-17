import React from 'react';
import styles from './styles.module.css';

const Modal = ({ 
  isOpen, 
  onClose, 
  title, 
  children, 
  maxWidth = '800px',
  className = '' 
}) => {
  if (!isOpen) return null;

  return (
    <div 
      className={styles.modalBackdrop}
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div 
        className={`${styles.modalContent} ${className}`}
        style={{ maxWidth }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className={styles.modalHeader}>
          {title && <h2 className={styles.modalTitle}>{title}</h2>}
          <button 
            onClick={onClose}
            className={styles.modalClose}
            aria-label="Close"
          >
            ×
          </button>
        </div>
        <div className={styles.modalBody}>
          {children}
        </div>
      </div>
    </div>
  );
};

export default Modal;

