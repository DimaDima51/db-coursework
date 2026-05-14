import { Link } from 'react-router-dom';
import { Header } from '../components/header/Header';
import { Footer } from '../components/footer/Footer';
import styles from "./default.module.css";

export const HomePage = () => {
  return (
    <div className={styles.pageWrapper}>
      <Header />
      <main className={styles.content}>
        <section className={styles.hero}>
          <p className={styles.overline}>Система экспресс-доставки</p>
          <h1 className={styles.heroTitle}>Управляйте заказами, клиентами и отчетами быстро</h1>
          <p className={styles.heroText}>
            Ваша платформа для контроля всех этапов доставки: от оформления отправления до акта передачи, аналитики и управления пунктами обслуживания.
          </p>
          <div className={styles.heroActions}>
            <Link to="/orders" className={styles.primaryButton}>
              Перейти к заказам
            </Link>
            <Link to="/clients" className={styles.secondaryButton}>
              Смотреть клиентов
            </Link>
          </div>
        </section>

        <section className={styles.featuresGrid}>
          <article className={styles.featureCard}>
            <h2 className={styles.cardTitle}>Заказы и выдача</h2>
            <p className={styles.cardText}>
              Создавайте новые отправления, оформляйте выдачу, просматривайте невыданные заказы и ведите учет актов передачи.
            </p>
          </article>
          <article className={styles.featureCard}>
            <h2 className={styles.cardTitle}>Клиенты и сотрудники</h2>
            <p className={styles.cardText}>
              Добавляйте и редактируйте данные клиентов, управляйте сотрудниками и контролируйте доступ к рабочим точкам.
            </p>
          </article>
          <article className={styles.featureCard}>
            <h2 className={styles.cardTitle}>Тарифы и пункты</h2>
            <p className={styles.cardText}>
              Настраивайте услуги и тарифы, ведите список пунктов приема и выдачи для гибкой логистики.
            </p>
          </article>
          <article className={styles.featureCard}>
            <h2 className={styles.cardTitle}>Отчеты и аналитика</h2>
            <p className={styles.cardText}>
              Смотрите движение отправлений, финансовую статистику и клиентскую аналитику для контроля эффективности.
            </p>
          </article>
        </section>

        <section className={styles.howToSection}>
          <h2 className={styles.sectionTitle}>Что делать дальше</h2>
          <ul className={styles.stepsList}>
            <li>Перейдите в раздел «Заказы», чтобы оформить новую доставку или закрыть возврат.</li>
            <li>Добавьте клиента в раздел «Клиенты», если ранее его не было в базе.</li>
            <li>Настройте тарифы и пункты, чтобы система точно отражала вашу сеть.</li>
            <li>Откройте отчеты для контроля движения отправлений и финансовых показателей.</li>
          </ul>
        </section>
      </main>
      <Footer />
    </div>
  );
}