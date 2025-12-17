import React from 'react';
import styles from './styles.module.css';

const Input = ({ 
  type = 'text',
  value,
  onChange,
  placeholder,
  required = false,
  className = '',
  label,
  ...props 
}) => {
  const inputElement = (
    <input
      type={type}
      value={value}
      onChange={onChange}
      placeholder={placeholder}
      required={required}
      className={`${styles.input} ${className}`}
      {...props}
    />
  );

  if (label) {
    return (
      <div className={styles.inputGroup}>
        <label className={styles.label}>{label}</label>
        {inputElement}
      </div>
    );
  }

  return inputElement;
};

export default Input;

