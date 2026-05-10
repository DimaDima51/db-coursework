import styles from './Select.module.css';

export const Select = ({
  label,
  name,
  value,
  onChange,
  options = [],
  placeholder = 'Выберите...',
  required = false,
  error = null,
  disabled = false
}) => {
  return (
    <div className={styles.selectGroup}>
      {label && (
        <label htmlFor={name} className={styles.label}>
          {label}
          {required && <span className={styles.required}>*</span>}
        </label>
      )}
      <select
        id={name}
        name={name}
        value={value}
        onChange={onChange}
        required={required}
        disabled={disabled}
        className={`${styles.select} ${error ? styles.selectError : ''}`}
      >
        <option value="" disabled>
          {placeholder}
        </option>
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
      {error && <span className={styles.errorMessage}>{error}</span>}
    </div>
  );
};
