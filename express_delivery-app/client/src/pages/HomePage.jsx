import { Header } from '../components/header/Header';
import { Footer } from '../components/footer/Footer';
import styles from "./default.module.css";

export const HomePage = () => {
  return (
    <div className={styles.pageWrapper}>
      <Header />
      <main className={styles.content}>
      HomePage
      </main>
      <Footer />
    </div>
  );
}