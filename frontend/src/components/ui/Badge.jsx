import React from 'react';
import styles from './styles.module.css';

const Badge = ({ 
  children, 
  variant = 'default',
  className = '',
  ...props 
}) => {
  const variantClass = styles[`badge-${variant}`] || styles.badgeDefault;
  
  return (
    <span className={`${styles.badge} ${variantClass} ${className}`} {...props}>
      {children}
    </span>
  );
};

export default Badge;

