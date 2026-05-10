import { useState } from "react";
import { Link } from "react-router-dom";
import styles from "./Dropbox.module.css";

export const Dropbox = ({ label, items }) => {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div 
      className={styles.dropdownContainer}
      onMouseEnter={() => setIsOpen(true)}
      onMouseLeave={() => setIsOpen(false)}
    >
      <button className={`${styles.dropdownBtn} ${isOpen ? styles.active : ""}`}>
        {label} <span className={styles.arrow}>▾</span>
      </button>
      
      {isOpen && (
        <div className={styles.dropdownContent}>
          <div className={styles.bridge}></div>
          
          <div className={styles.menuInner}>
            {items.map((item, index) => (
              <Link key={index} to={item.to} className={styles.dropdownLink}>
                {item.label}
              </Link>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
