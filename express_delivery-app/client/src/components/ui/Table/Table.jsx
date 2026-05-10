import styles from './Table.module.css';

export const Table = ({ 
  headers, 
  data, 
  emptyMessage = 'Нет данных для отображения',
  onRowClick,
  actions,
  className = ''
}) => {
  // Если заголовки - массив строк, преобразуем в объекты { key, label }
  const normalizedHeaders = headers.map(header => 
    typeof header === 'string' 
      ? { key: header.toLowerCase(), label: header }
      : header
  );

  if (!data || data.length === 0) {
    return (
      <div className={styles.empty}>
        {emptyMessage}
      </div>
    );
  }

  return (
    <div className={`${styles.tableWrapper} ${className}`}>
      <table className={styles.table}>
        <thead>
          <tr>
            {normalizedHeaders.map((header, index) => (
              <th key={index} className={styles.th}>
                {header.label}
              </th>
            ))}
            {actions && <th className={styles.th}>Действия</th>}
          </tr>
        </thead>
        <tbody>
          {data.map((row, rowIndex) => (
            <tr 
              key={rowIndex} 
              className={styles.tr}
              onClick={() => onRowClick && onRowClick(row, rowIndex)}
              role={onRowClick ? "button" : undefined}
              tabIndex={onRowClick ? 0 : undefined}
            >
              {normalizedHeaders.map((header, colIndex) => (
                <td key={colIndex} className={styles.td}>
                  {row[header.key] !== undefined ? row[header.key] : ''}
                </td>
              ))}
              {actions && (
                <td className={`${styles.td} ${styles.actions}`}>
                  {actions(row, rowIndex)}
                </td>
              )}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};