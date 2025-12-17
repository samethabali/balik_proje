import React from 'react';
import Modal from '../ui/Modal';
import styles from './styles.module.css';

const ImageLightbox = ({ isOpen, onClose, imageUrl }) => {
  if (!isOpen || !imageUrl) return null;

  return (
    <div
      className={styles.lightboxBackdrop}
      onClick={onClose}
    >
      <img
        src={imageUrl}
        alt="Large View"
        className={styles.lightboxImage}
        onClick={(e) => e.stopPropagation()}
      />
    </div>
  );
};

export default ImageLightbox;

