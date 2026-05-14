import { useEffect, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../auth/AuthProvider';
import { Footer } from '../components/footer/Footer';
import styles from './default.module.css';

export const LoginPage = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { login, isAuthenticated, loading } = useAuth();
  const [form, setForm] = useState({ staff_number: '', password: '' });
  const [error, setError] = useState('');

  const from = location.state?.from?.pathname || '/';

  useEffect(() => {
    if (isAuthenticated) {
      navigate(from, { replace: true });
    }
  }, [isAuthenticated, from, navigate]);

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError('');

    try {
      await login({ staff_number: form.staff_number, password: form.password });
      navigate(from, { replace: true });
    } catch (err) {
      setError(err.response?.data?.message || 'Ошибка входа');
    }
  };

  return (
    <div className={styles.pageWrapper}>
      <main className={`${styles.content} ${styles.loginPage}`}>
        <section className={styles.loginHero}>
          <span className={styles.authBadge}>Авторизация</span>
          <h1 className={styles.loginHeroTitle}>Панель управления экспресс-доставкой</h1>
          <p className={styles.loginHeroText}>
            Войдите в систему для работы с заказами, клиентами, тарифами, пунктами выдачи и отчетами.
          </p>
        </section>

        <section className={styles.loginCard}>
          <div className={styles.loginCardHeader}>
            <h2 className={styles.loginTitle}>Вход в аккаунт</h2>
            <p className={styles.loginSubtitle}>Укажите табельный номер и пароль сотрудника</p>
          </div>

          <form onSubmit={handleSubmit} className={styles.loginForm}>
            <label className={styles.inputLabel}>
              Табельный номер
              <input
                className={styles.inputField}
                type="text"
                name="staff_number"
                value={form.staff_number}
                onChange={(e) => setForm((prev) => ({ ...prev, staff_number: e.target.value }))}
              />
            </label>

            <label className={styles.inputLabel}>
              Пароль
              <input
                className={styles.inputField}
                type="password"
                name="password"
                value={form.password}
                onChange={(e) => setForm((prev) => ({ ...prev, password: e.target.value }))}
              />
            </label>

            <button type="submit" disabled={loading} className={styles.submitButton}>
              {loading ? 'Вход...' : 'Войти'}
            </button>

            {error && <div className={styles.errorMessage}>{error}</div>}
          </form>
        </section>
      </main>
      <Footer />
    </div>
  );
};
