import styles from './Loader.module.css';

export const Loader = ({ message = 'Загрузка...' }) => (
  <div className={styles.loader}>
    <div className={styles.spinner} />
    <span>{message}</span>
  </div>
);
