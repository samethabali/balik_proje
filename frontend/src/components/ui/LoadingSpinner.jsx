import React from 'react';
import styles from './styles.module.css';

const LoadingSpinner = ({ 
  size = 'medium',
  className = '',
  text 
}) => {
  const sizeClass = styles[`spinner-${size}`] || styles.spinnerMedium;
  
  return (
    <div className={`${styles.loadingContainer} ${className}`}>
      <div className={`${styles.spinner} ${sizeClass}`}></div>
      {text && <p className={styles.loadingText}>{text}</p>}
    </div>
  );
};

export default LoadingSpinner;

