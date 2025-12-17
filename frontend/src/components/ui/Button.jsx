import React from 'react';
import styles from './styles.module.css';

const Button = ({ 
  children, 
  variant = 'primary', 
  onClick, 
  disabled = false, 
  type = 'button',
  className = '',
  ...props 
}) => {
  const variantClass = styles[`button-${variant}`] || styles.buttonPrimary;
  const disabledClass = disabled ? styles.buttonDisabled : '';
  
  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      className={`${styles.button} ${variantClass} ${disabledClass} ${className}`}
      {...props}
    >
      {children}
    </button>
  );
};

export default Button;

