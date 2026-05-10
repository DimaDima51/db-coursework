import styles from "./Footer.module.css";

export const Footer = () => {
  return (
    <footer className={styles.footer}>
      <div className={styles.inner}>
        <span>
          ЭкспрессДоставка © 2026 Курсовая работа - Котельников Д. А.
        </span>
      </div>
    </footer>
  );
};