import { Header } from '../../components/header/Header';
import { Footer } from '../../components/footer/Footer';
import styles from "./../default.module.css";
import { Input } from '../../components/ui/Input/Input';
import { Button } from '../../components/ui/Button/Button';
import { useState, useCallback, useEffect } from 'react';
import { useNavigate, useParams, useLocation } from 'react-router-dom';
import { createClient, updateClient } from '../../api/axios';

// Маски ввода
const maskPhone = (value) => {

  if (!value) return '';
  
  // Оставляем только цифры
  let digits = value.replace(/\D/g, '');

  // Ограничиваем длину 11 цифрами для телефона
  digits = digits.substring(0, 11);

  // Если пусто - вернуть пустую строку, иначе строим маску
  if (!digits) return '';

  // Если номер начинается с 7 или 8 - используем как код страны
  let formatted = '+7(';
  const rest = digits.startsWith('7') || digits.startsWith('8')
    ? digits.substring(1)
    : digits;

  if (rest.length === 0) return '+7(';

  formatted += rest.substring(0, 3);
  if (rest.length >= 3) formatted += ')';
  if (rest.length > 3) formatted += rest.substring(3, 6);
  if (rest.length > 6) formatted += '-' + rest.substring(6, 8);
  if (rest.length > 8) formatted += '-' + rest.substring(8, 10);

  return formatted;
};

const maskPassport = (value) => {
  // Оставляем только цифры
  let digits = value.replace(/\D/g, '');
  // char(10) в БД - ровно 10 цифр
  digits = digits.substring(0, 10);

  if (!digits) return '';

  // Формат: 1234 567890
  if (digits.length <= 4) return digits;
  return digits.substring(0, 4) + ' ' + digits.substring(4);
};

const maskPostalIndex = (value) => {
  // char(6) в БД - ровно 6 цифр
  const digits = value.replace(/\D/g, '').substring(0, 6);
  return digits;
};

export const ClientFormPage = () => {
  const navigate = useNavigate();
  const { passport_number } = useParams();
  const location = useLocation();
  const isEditMode = !!passport_number;
  
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});
  const [form, setForm] = useState({
    passport_number: '',
    surname: '',
    first_name: '',
    patronymic: '',
    phone: '',
    postal_index: '',
    region: '',
    city: '',
    street: '',
    house: '',
    email: '',
  });

  // Инициализируем форму при редактировании
  useEffect(() => {
    if (isEditMode && location.state?.client) {
      const client = location.state.client;
      setForm({
        passport_number: maskPassport(client.passport_number),
        surname: client.surname || '',
        first_name: client.first_name || '',
        patronymic: client.patronymic || '',
        phone: maskPhone(client.phone) || '',
        postal_index: client.postal_index || '',
        region: client.region || '',
        city: client.city || '',
        street: client.street || '',
        house: client.house || '',
        email: client.email || '',
      });
    }
  }, [isEditMode, location.state]);

  // Валидация строго по схеме таблицы client
  const validateForm = () => {
    const newErrors = {};

    // passport_number: char(10), NOT NULL, PRIMARY KEY
    const passportDigits = form.passport_number.replace(/\D/g, '');
    if (!passportDigits) {
      newErrors.passport_number = 'Паспорт обязателен';
    } else if (passportDigits.length !== 10) {
      newErrors.passport_number = 'Должно быть ровно 10 цифр';
    }

    // surname: varchar(100), NOT NULL
    if (!form.surname.trim()) {
      newErrors.surname = 'Фамилия обязательна';
    } else if (form.surname.trim().length > 100) {
      newErrors.surname = 'Не более 100 символов';
    }

    // first_name: varchar(100), NOT NULL
    if (!form.first_name.trim()) {
      newErrors.first_name = 'Имя обязательно';
    } else if (form.first_name.trim().length > 100) {
      newErrors.first_name = 'Не более 100 символов';
    }

    // patronymic: varchar(100), DEFAULT NULL - необязательное
    if (form.patronymic.trim() && form.patronymic.trim().length > 100) {
      newErrors.patronymic = 'Не более 100 символов';
    }

    // phone: varchar(16), NOT NULL, UNIQUE
    const phoneDigits = form.phone.replace(/\D/g, '');
    if (!phoneDigits) {
      newErrors.phone = 'Телефон обязателен';
    } else if (phoneDigits.length !== 11) {
      newErrors.phone = 'Должно быть 11 цифр (формат +7(XXX)XXX-XX-XX)';
    }

    // postal_index: char(6), NOT NULL
    const indexDigits = form.postal_index.replace(/\D/g, '');
    if (!indexDigits) {
      newErrors.postal_index = 'Почтовый индекс обязателен';
    } else if (indexDigits.length !== 6) {
      newErrors.postal_index = 'Должно быть ровно 6 цифр';
    }

    // region: varchar(255), NOT NULL
    if (!form.region.trim()) {
      newErrors.region = 'Регион обязателен';
    } else if (form.region.trim().length > 255) {
      newErrors.region = 'Не более 255 символов';
    }

    // city: varchar(255), NOT NULL
    if (!form.city.trim()) {
      newErrors.city = 'Город обязателен';
    } else if (form.city.trim().length > 255) {
      newErrors.city = 'Не более 255 символов';
    }

    // street: varchar(255), NOT NULL
    if (!form.street.trim()) {
      newErrors.street = 'Улица обязательна';
    } else if (form.street.trim().length > 255) {
      newErrors.street = 'Не более 255 символов';
    }

    // house: varchar(255), NOT NULL
    if (!form.house.trim()) {
      newErrors.house = 'Дом обязателен';
    } else if (form.house.trim().length > 255) {
      newErrors.house = 'Не более 255 символов';
    }

    // email: varchar(100), DEFAULT NULL - необязательное поле
    if (form.email.trim()) {
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) {
        newErrors.email = 'Некорректный email';
      } else if (form.email.trim().length > 100) {
        newErrors.email = 'Не более 100 символов';
      }
    }

    return newErrors;
  };

  const handleChange = useCallback((e) => {
    const { name, value } = e.target;

    let formattedValue = value;

    // Применяем маски в зависимости от поля
    if (name === 'phone') {
      formattedValue = maskPhone(value);
    } else if (name === 'passport_number' && !isEditMode) {
      formattedValue = maskPassport(value);
    } else if (name === 'postal_index') {
      formattedValue = maskPostalIndex(value);
    }

    setForm(prev => ({ ...prev, [name]: formattedValue }));

    // Убираем ошибку поля при редактировании
    if (errors[name]) {
      setErrors(prev => {
        const updated = { ...prev };
        delete updated[name];
        return updated;
      });
    }
  }, [errors, isEditMode]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    const newErrors = validateForm();
    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    setLoading(true);
    try {
      // Формируем данные строго под структуру таблицы client
      const payload = {
        // char(10) - только цифры без маски
        surname: form.surname.trim().substring(0, 100),
        first_name: form.first_name.trim().substring(0, 100),
        // varchar(100) DEFAULT NULL - если пусто, отправляем null
        patronymic: form.patronymic.trim() || null,
        // varchar(16) - отформатированный номер +7(XXX)XXX-XX-XX
        phone: form.phone,
        // char(6) - 6 цифр
        postal_index: form.postal_index.replace(/\D/g, ''),
        // varchar(255)
        region: form.region.trim().substring(0, 255),
        city: form.city.trim().substring(0, 255),
        street: form.street.trim().substring(0, 255),
        house: form.house.trim().substring(0, 255),
        // varchar(100) DEFAULT NULL
        email: form.email.trim().substring(0, 100) || null,
      };

      if (isEditMode) {
        await updateClient(passport_number, payload);
      } else {
        payload.passport_number = form.passport_number.replace(/\D/g, '');
        await createClient(payload);
      }
      navigate('/clients');
    } catch (err) {
      console.error('Ошибка при сохранении клиента:', err);
      // Обработка уникальности телефона и других ошибок API
      if (err.response?.data?.message?.includes('phone')) {
        setErrors({ phone: 'Клиент с таким телефоном уже существует' });
      } else if (err.response?.data?.message?.includes('passport_number')) {
        setErrors({ passport_number: 'Клиент с таким паспортом уже существует' });
      } else {
        setErrors({ submit: 'Не удалось сохранить клиента. Проверьте данные.' });
      }
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    navigate('/clients');
  };

  return (
    <div className={styles.pageWrapper}>
      <Header />
      <main className={styles.content}>
        <div className={styles.pageHeader}>
          <h1>{isEditMode ? 'Редактировать клиента' : 'Добавить нового клиента'}</h1>
        </div>

        <div className={styles.formContainer}>
          <form onSubmit={handleSubmit} className={styles.form} noValidate>
            <div className={styles.formSection}>
              <h2 className={styles.sectionTitle}>Личная информация</h2>
              <div className={styles.formGrid}>
                <Input
                  label="Паспорт (10 цифр)"
                  name="passport_number"
                  value={form.passport_number}
                  onChange={handleChange}
                  placeholder="1234 567890"
                  required
                  maxLength={13}
                  error={errors.passport_number}

                />
                <Input
                  label="Фамилия"
                  name="surname"
                  value={form.surname}
                  onChange={handleChange}
                  placeholder="Иванов"
                  required
                  maxLength={100}
                  error={errors.surname}
                />
                <Input
                  label="Имя"
                  name="first_name"
                  value={form.first_name}
                  onChange={handleChange}
                  placeholder="Иван"
                  required
                  maxLength={100}
                  error={errors.first_name}
                />
                <Input
                  label="Отчество"
                  name="patronymic"
                  value={form.patronymic}
                  onChange={handleChange}
                  placeholder="Иванович (необязательно)"
                  maxLength={100}
                  error={errors.patronymic}
                />
              </div>
            </div>

            <div className={styles.formSection}>
              <h2 className={styles.sectionTitle}>Контактная информация</h2>
              <div className={styles.formGrid}>
                <Input
                  label="Телефон (уникальный)"
                  name="phone"
                  type="tel"
                  value={form.phone}
                  onChange={handleChange}
                  placeholder="+7(999)123-45-67"
                  required
                  maxLength={16}
                  error={errors.phone}
                />
                <Input
                  label="Email"
                  name="email"
                  type="email"
                  value={form.email}
                  onChange={handleChange}
                  placeholder="client@example.com (необязательно)"
                  maxLength={100}
                  error={errors.email}
                />
              </div>
            </div>

            <div className={styles.formSection}>
              <h2 className={styles.sectionTitle}>Адрес</h2>
              <div className={styles.formGrid}>
                <Input
                  label="Почтовый индекс (6 цифр)"
                  name="postal_index"
                  value={form.postal_index}
                  onChange={handleChange}
                  placeholder="123456"
                  required
                  maxLength={6}
                  error={errors.postal_index}
                />
                <Input
                  label="Регион"
                  name="region"
                  value={form.region}
                  onChange={handleChange}
                  placeholder="Московская область"
                  required
                  maxLength={255}
                  error={errors.region}
                />
                <Input
                  label="Город"
                  name="city"
                  value={form.city}
                  onChange={handleChange}
                  placeholder="Москва"
                  required
                  maxLength={255}
                  error={errors.city}
                />
                <Input
                  label="Улица"
                  name="street"
                  value={form.street}
                  onChange={handleChange}
                  placeholder="Ленина"
                  required
                  maxLength={255}
                  error={errors.street}
                />
                <Input
                  label="Дом"
                  name="house"
                  value={form.house}
                  onChange={handleChange}
                  placeholder="45"
                  required
                  maxLength={255}
                  error={errors.house}
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