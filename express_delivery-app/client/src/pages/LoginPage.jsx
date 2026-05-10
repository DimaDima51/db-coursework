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
      <main className={styles.content} style={{ maxWidth: 420, margin: '72px auto' }}>
        <h2>Вход в систему</h2>
        <form onSubmit={handleSubmit} style={{ display: 'grid', gap: 12 }}>
          <label>
            Табельный номер
            <input
              type="text"
              name="staff_number"
              value={form.staff_number}
              onChange={(e) => setForm((prev) => ({ ...prev, staff_number: e.target.value }))}
            />
          </label>
          <label>
            Пароль
            <input
              type="password"
              name="password"
              value={form.password}
              onChange={(e) => setForm((prev) => ({ ...prev, password: e.target.value }))}
            />
          </label>
          <button type="submit" disabled={loading} style={{ padding: '10px 16px' }}>
            {loading ? 'Вход...' : 'Войти'}
          </button>
          {error && <div style={{ color: 'var(--danger)', marginTop: 8 }}>{error}</div>}
        </form>
      </main>
      <Footer />
    </div>
  );
};
