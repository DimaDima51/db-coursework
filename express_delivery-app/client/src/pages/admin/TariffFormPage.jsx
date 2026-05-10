import { Header } from '../../components/header/Header';
import { Footer } from '../../components/footer/Footer';
import styles from "./../default.module.css";
import { Input } from '../../components/ui/Input/Input';
import { Button } from '../../components/ui/Button/Button';
import { useState, useEffect } from 'react';
import { useNavigate, useParams, useLocation } from 'react-router-dom';
import { createTariff, updateTariff } from '../../api/axios';

// Функция для преобразования даты из любого формата в YYYY-MM-DD для input
const formatDateForInput = (dateString) => {
  if (!dateString) return '';
  
  if (/^\d{2}\.\d{2}\.\d{4}$/.test(dateString)) {
    const [day, month, year] = dateString.split('.');
    return `${year}-${month}-${day}`;
  }
  
  if (/^\d{4}-\d{2}-\d{2}$/.test(dateString)) {
    return dateString.split('T')[0];
  }
  
  const date = new Date(dateString);
  if (!isNaN(date.getTime())) {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }
  
  return '';
};

export const TariffFormPage = () => {
  const navigate = useNavigate();
  const { code } = useParams();
  const location = useLocation();
  const isEditMode = !!code;
  
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});
  const [form, setForm] = useState({
    tariff_code: '',
    tariff_up_to_500g: '',
    tariff_up_to_1kg: '',
    additional_500g_charge: '',
    oversize_surcharge: '',
    careful_surcharge: '',
    max_weight: '',
    tariff_start_date: ''
  });

  useEffect(() => {
    if (isEditMode && location.state?.tariff) {
      const tariff = location.state.tariff;
      setForm({
        tariff_code: tariff.tariff_code?.toString() || '',
        tariff_up_to_500g: tariff.tariff_up_to_500g?.toString() || '',
        tariff_up_to_1kg: tariff.tariff_up_to_1kg?.toString() || '',
        additional_500g_charge: tariff.additional_500g_charge?.toString() || '',
        oversize_surcharge: tariff.oversize_surcharge?.toString() || '',
        careful_surcharge: tariff.careful_surcharge?.toString() || '',
        max_weight: tariff.max_weight?.toString() || '',
        tariff_start_date: formatDateForInput(tariff.tariff_start_date)
      });
    }
  }, [isEditMode, location.state, code]);

  const validateForm = () => {
    const newErrors = {};

    if (!form.tariff_code.trim()) {
      newErrors.tariff_code = 'Код тарифа обязателен';
    } else {
      const code = parseInt(form.tariff_code);
      if (isNaN(code) || code < 0 || code > 4294967295) {
        newErrors.tariff_code = 'Должно быть целым положительным числом';
      }
    }

    if (!form.tariff_up_to_500g.trim()) {
      newErrors.tariff_up_to_500g = 'Обязательное поле';
    } else {
      const value = parseFloat(form.tariff_up_to_500g);
      if (isNaN(value) || value < 0) {
        newErrors.tariff_up_to_500g = 'Должно быть положительным числом';
      }
    }

    if (!form.tariff_up_to_1kg.trim()) {
      newErrors.tariff_up_to_1kg = 'Обязательное поле';
    } else {
      const value = parseFloat(form.tariff_up_to_1kg);
      if (isNaN(value) || value < 0) {
        newErrors.tariff_up_to_1kg = 'Должно быть положительным числом';
      }
    }

    if (!form.additional_500g_charge.trim()) {
      newErrors.additional_500g_charge = 'Обязательное поле';
    } else {
      const value = parseFloat(form.additional_500g_charge);
      if (isNaN(value) || value < 0) {
        newErrors.additional_500g_charge = 'Должно быть положительным числом';
      }
    }

    if (!form.oversize_surcharge.trim()) {
      newErrors.oversize_surcharge = 'Обязательное поле';
    } else {
      const value = parseFloat(form.oversize_surcharge);
      if (isNaN(value) || value < 0) {
        newErrors.oversize_surcharge = 'Должно быть положительным числом';
      }
    }

    if (!form.careful_surcharge.trim()) {
      newErrors.careful_surcharge = 'Обязательное поле';
    } else {
      const value = parseFloat(form.careful_surcharge);
      if (isNaN(value) || value < 0) {
        newErrors.careful_surcharge = 'Должно быть положительным числом';
      }
    }

    if (!form.max_weight.trim()) {
      newErrors.max_weight = 'Обязательное поле';
    } else {
      const value = parseFloat(form.max_weight);
      if (isNaN(value) || value <= 0) {
        newErrors.max_weight = 'Должно быть положительным числом больше 0';
      }
    }

    if (!form.tariff_start_date) {
      newErrors.tariff_start_date = 'Дата начала обязательна';
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
        tariff_code: parseInt(form.tariff_code),
        tariff_up_to_500g: parseFloat(form.tariff_up_to_500g),
        tariff_up_to_1kg: parseFloat(form.tariff_up_to_1kg),
        additional_500g_charge: parseFloat(form.additional_500g_charge),
        oversize_surcharge: parseFloat(form.oversize_surcharge),
        careful_surcharge: parseFloat(form.careful_surcharge),
        max_weight: parseFloat(form.max_weight),
        tariff_start_date: form.tariff_start_date
      };

      if (isEditMode) {
        await updateTariff(code, payload);
      } else {
        await createTariff(payload);
      }
      navigate('/admin/tariffs');
    } catch (err) {
      console.error('Ошибка при сохранении тарифа:', err);
      if (err.response?.data?.message?.includes('tariff_code')) {
        setErrors({ tariff_code: 'Тариф с таким кодом уже существует' });
      } else {
        setErrors({ submit: 'Не удалось сохранить тариф. Проверьте данные.' });
      }
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    navigate('/admin/tariffs');
  };

  return (
    <div className={styles.pageWrapper}>
      <Header />
      <main className={styles.content}>
        <div className={styles.pageHeader}>
          <h1>{isEditMode ? 'Редактировать тариф' : 'Добавить новый тариф'}</h1>
        </div>

        <div className={styles.formContainer}>
          <form onSubmit={handleSubmit} className={styles.form} noValidate>
            <div className={styles.formSection}>
              <h2 className={styles.sectionTitle}>Основная информация</h2>
              <div className={styles.formGrid}>
                <Input
                  label="Код тарифа"
                  name="tariff_code"
                  type="number"
                  value={form.tariff_code}
                  onChange={handleChange}
                  placeholder="Введите код тарифа"
                  required
                  error={errors.tariff_code}
                />
                <Input
                  label="Дата начала действия"
                  name="tariff_start_date"
                  type="date"
                  value={form.tariff_start_date}
                  onChange={handleChange}
                  required
                  error={errors.tariff_start_date}
                />
              </div>
            </div>

            <div className={styles.formSection}>
              <h2 className={styles.sectionTitle}>Стоимость доставки</h2>
              <div className={styles.formGrid}>
                <Input
                  label="Цена до 500г (₽)"
                  name="tariff_up_to_500g"
                  type="number"
                  step="0.01"
                  value={form.tariff_up_to_500g}
                  onChange={handleChange}
                  placeholder="0.00"
                  required
                  error={errors.tariff_up_to_500g}
                />
                <Input
                  label="Цена до 1кг (₽)"
                  name="tariff_up_to_1kg"
                  type="number"
                  step="0.01"
                  value={form.tariff_up_to_1kg}
                  onChange={handleChange}
                  placeholder="0.00"
                  required
                  error={errors.tariff_up_to_1kg}
                />
                <Input
                  label="Доплата за каждые 500г (₽)"
                  name="additional_500g_charge"
                  type="number"
                  step="0.01"
                  value={form.additional_500g_charge}
                  onChange={handleChange}
                  placeholder="0.00"
                  required
                  error={errors.additional_500g_charge}
                />
              </div>
            </div>

            <div className={styles.formSection}>
              <h2 className={styles.sectionTitle}>Дополнительные надбавки</h2>
              <div className={styles.formGrid}>
                <Input
                  label="Надбавка за сверхгабарит (₽)"
                  name="oversize_surcharge"
                  type="number"
                  step="0.01"
                  value={form.oversize_surcharge}
                  onChange={handleChange}
                  placeholder="0.00"
                  required
                  error={errors.oversize_surcharge}
                />
                <Input
                  label="Надбавка за осторожную доставку (₽)"
                  name="careful_surcharge"
                  type="number"
                  step="0.01"
                  value={form.careful_surcharge}
                  onChange={handleChange}
                  placeholder="0.00"
                  required
                  error={errors.careful_surcharge}
                />
                <Input
                  label="Максимальный вес (кг)"
                  name="max_weight"
                  type="number"
                  step="0.01"
                  value={form.max_weight}
                  onChange={handleChange}
                  placeholder="0.00"
                  required
                  error={errors.max_weight}
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