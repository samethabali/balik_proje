import React from 'react';
import Modal from '../ui/Modal';
import styles from './styles.module.css';

const BasePanel = ({ 
  isOpen,
  onClose,
  title,
  children,
  maxWidth = '800px',
  className = ''
}) => {
  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={title}
      maxWidth={maxWidth}
      className={className}
    >
      <div className={styles.panelContent}>
        {children}
      </div>
    </Modal>
  );
};

export default BasePanel;

