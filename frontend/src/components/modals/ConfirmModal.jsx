import React from 'react';
import Modal from '../ui/Modal';
import Button from '../ui/Button';
import styles from './styles.module.css';

const ConfirmModal = ({ 
  isOpen, 
  onClose, 
  onConfirm, 
  title = 'Onay',
  message = 'Bu işlemi yapmak istediğinize emin misiniz?',
  confirmText = 'Onayla',
  cancelText = 'İptal',
  variant = 'danger'
}) => {
  if (!isOpen) return null;

  const handleConfirm = () => {
    onConfirm?.();
    onClose();
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={title} maxWidth="400px">
      <div className={styles.confirmContent}>
        <p className={styles.confirmMessage}>{message}</p>
        <div className={styles.confirmActions}>
          <Button variant="secondary" onClick={onClose}>
            {cancelText}
          </Button>
          <Button variant={variant} onClick={handleConfirm}>
            {confirmText}
          </Button>
        </div>
      </div>
    </Modal>
  );
};

export default ConfirmModal;

