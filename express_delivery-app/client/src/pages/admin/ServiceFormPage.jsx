import { Header } from '../../components/header/Header';
import { Footer } from '../../components/footer/Footer';
import styles from "./../default.module.css";
import { Input } from '../../components/ui/Input/Input';
import { Button } from '../../components/ui/Button/Button';
import { useState, useEffect } from 'react';
import { useNavigate, useParams, useLocation } from 'react-router-dom';
import { createService, updateService } from '../../api/axios';

export const ServiceFormPage = () => {
  const navigate = useNavigate();
  const { name } = useParams();
  const location = useLocation();
  const isEditMode = !!name;

  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});
  const [form, setForm] = useState({
    service_name: '',
    service_category: ''
  });

  useEffect(() => {
    if (isEditMode && location.state?.service) {
      const service = location.state.service;
      setForm({
        service_name: service.service_name || '',
        service_category: service.service_category || ''
      });
    }
  }, [isEditMode, location.state, name]);

  const validateForm = () => {
    const newErrors = {};

    if (!form.service_name.trim()) {
      newErrors.service_name = 'Название услуги обязательно';
    } else if (form.service_name.trim().length > 100) {
      newErrors.service_name = 'Не более 100 символов';
    }

    if (!form.service_category.trim()) {
      newErrors.service_category = 'Категория обязательна';
    } else if (form.service_category.trim().length > 100) {
      newErrors.service_category = 'Не более 100 символов';
    }

    return newErrors;
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm(prev => ({ ...prev, [name]: value }));

    if (errors[name]) {
      setErrors(prev => {
        const updated = { ...prev };
        delete updated[name];
        return updated;
      });
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const newErrors = validateForm();
    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    setLoading(true);
    try {
      const payload = {
        service_category: form.service_category.trim()
      };

      if (isEditMode) {
        // При редактировании отправляем и новое имя
        payload.new_service_name = form.service_name.trim();
        await updateService(name, payload);
      } else {
        // При создании отправляем service_name как обычно
        payload.service_name = form.service_name.trim();
        await createService(payload);
      }
      navigate('/admin/services');
    } catch (err) {
      console.error('Ошибка при сохранении услуги:', err);
      if (err.response?.data?.message?.includes('service_name')) {
        setErrors({ service_name: 'Услуга с таким названием уже существует' });
      } else {
        setErrors({ submit: 'Не удалось сохранить услугу. Проверьте данные.' });
      }
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    navigate('/admin/services');
  };

  return (
    <div className={styles.pageWrapper}>
      <Header />
      <main className={styles.content}>
        <div className={styles.pageHeader}>
          <h1>{isEditMode ? 'Редактировать услугу' : 'Добавить новую услугу'}</h1>
        </div>

        <div className={styles.formContainer}>
          <form onSubmit={handleSubmit} className={styles.form} noValidate>
            <div className={styles.formSection}>
              <h2 className={styles.sectionTitle}>Информация об услуге</h2>
              <div className={styles.formGrid}>
                <Input
                  label="Название услуги"
                  name="service_name"
                  value={form.service_name}
                  onChange={handleChange}
                  placeholder="Введите название услуги"
                  required
                  maxLength={100}
                  error={errors.service_name}
                />
                <Input
                  label="Категория"
                  name="service_category"
                  value={form.service_category}
                  onChange={handleChange}
                  placeholder="Введите категорию услуги"
                  required
                  maxLength={100}
                  error={errors.service_category}
                />
              </div>
            </div>

            {errors.submit && (
              <div className={styles.errorBlock}>
                {errors.submit}
              </div>
            )}

            <div className={styles.buttonGroup}>
              <Button type="submit" variant="primary" loading={loading}>
                {isEditMode ? 'Обновить' : 'Сохранить'}
              </Button>
              <Button type="button" variant="secondary" onClick={handleCancel} disabled={loading}>
                Отменить
              </Button>
            </div>
          </form>
        </div>
      </main>
      <Footer />
    </div>
  );
};