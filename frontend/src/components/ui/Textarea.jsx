import React from 'react';
import styles from './styles.module.css';

const Textarea = ({ 
  value,
  onChange,
  placeholder,
  required = false,
  rows = 4,
  className = '',
  label,
  ...props 
}) => {
  const textareaElement = (
    <textarea
      value={value}
      onChange={onChange}
      placeholder={placeholder}
      required={required}
      rows={rows}
      className={`${styles.input} ${styles.textarea} ${className}`}
      {...props}
    />
  );

  if (label) {
    return (
      <div className={styles.inputGroup}>
        <label className={styles.label}>{label}</label>
        {textareaElement}
      </div>
    );
  }

  return textareaElement;
};

export default Textarea;

