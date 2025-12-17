import React from 'react';
import styles from './styles.module.css';

const Select = ({ 
  value,
  onChange,
  options = [],
  placeholder,
  required = false,
  className = '',
  label,
  ...props 
}) => {
  const selectElement = (
    <select
      value={value}
      onChange={onChange}
      required={required}
      className={`${styles.input} ${styles.select} ${className}`}
      {...props}
    >
      {placeholder && <option value="">{placeholder}</option>}
      {options.map((option) => {
        if (typeof option === 'string') {
          return <option key={option} value={option}>{option}</option>;
        }
        return (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        );
      })}
    </select>
  );

  if (label) {
    return (
      <div className={styles.inputGroup}>
        <label className={styles.label}>{label}</label>
        {selectElement}
      </div>
    );
  }

  return selectElement;
};

export default Select;

