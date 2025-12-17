import React from 'react';
import styles from './styles.module.css';

const Card = ({ 
  children, 
  variant = 'base',
  className = '',
  onClick,
  ...props 
}) => {
  const variantClass = styles[`card-${variant}`] || styles.cardBase;
  const clickableClass = onClick ? styles.cardClickable : '';
  
  return (
    <div
      className={`${styles.card} ${variantClass} ${clickableClass} ${className}`}
      onClick={onClick}
      {...props}
    >
      {children}
    </div>
  );
};

export default Card;

