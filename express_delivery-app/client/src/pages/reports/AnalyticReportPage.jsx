import { Header } from '../../components/header/Header';
import { Footer } from '../../components/footer/Footer';
import styles from "./../default.module.css";

export const AnalyticReportPage = () => {
  return (
    <div className={styles.pageWrapper}>
      <Header />
      <main className={styles.content}>
      AnalyticReportPage
      </main>
      <Footer />
    </div>
  );
}