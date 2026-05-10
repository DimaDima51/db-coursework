import { Header } from '../../components/header/Header';
import { Footer } from '../../components/footer/Footer';
import styles from "./../default.module.css";
import { Input } from '../../components/ui/Input/Input';
import { Button } from '../../components/ui/Button/Button';
import { useState, useEffect } from 'react';
import { useNavigate, useParams, useLocation } from 'react-router-dom';
import { createPickupPoint, updatePickupPoint, getServices, getPickupPointServices, getSpecialSchedules } from '../../api/axios';

// Маска для почтового индекса (6 цифр)
const maskPostalIndex = (value) => {
  const digits = value.replace(/\D/g, '').substring(0, 6);
  return digits;
};

// Маска для телефона
const maskPhone = (value) => {

  if (!value) return '';

  let digits = value.replace(/\D/g, '');
  digits = digits.substring(0, 11);
  if (!digits) return '';
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

export const PickupPointFormPage = () => {
  const navigate = useNavigate();
  const { index } = useParams();
  const location = useLocation();
  const isEditMode = !!index;
  
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});
  const [services, setServices] = useState([]);
  const [selectedServices, setSelectedServices] = useState([]);
  const [specialSchedules, setSpecialSchedules] = useState([]);
  const [form, setForm] = useState({
    pickup_point_index: '',
    branch_name: '',
    region: '',
    city: '',
    street: '',
    house: '',
    municipality: '',
    oktmo: '',
    service_windows_count: '',
    accessibility_for_mgn: false,
    hotline_phone: '',
    work_mode: ''
  });

  // Загружаем список всех доступных услуг
  useEffect(() => {
    const loadServices = async () => {
      try {
        const response = await getServices();
        setServices(response.data);
      } catch (err) {
        console.error('Ошибка при загрузке услуг:', err);
      }
    };
    loadServices();
  }, []);

  // Инициализируем форму при редактировании
  useEffect(() => {
    const loadPickupPointData = async () => {
      if (isEditMode && location.state?.pickupPoint) {
        const point = location.state.pickupPoint;
        setForm({
          pickup_point_index: point.pickup_point_index || '',
          branch_name: point.branch_name || '',
          region: point.region || '',
          city: point.city || '',
          street: point.street || '',
          house: point.house || '',
          municipality: point.municipality || '',
          oktmo: point.oktmo?.toString() || '',
          service_windows_count: point.service_windows_count?.toString() || '',
          accessibility_for_mgn: point.accessibility_for_mgn === 1,
          hotline_phone: maskPhone(point.hotline_phone || '') || '',
          work_mode: point.work_mode || ''
        });

        // Загружаем услуги пункта выдачи
        try {
          const servicesResponse = await getPickupPointServices(point.pickup_point_index);
          setSelectedServices(servicesResponse.data.map(s => s.service_name));
        } catch (err) {
          console.error('Ошибка при загрузке услуг пункта выдачи:', err);
        }

        // Загружаем специальные расписания
        try {
          const schedulesResponse = await getSpecialSchedules(point.pickup_point_index);
          setSpecialSchedules(schedulesResponse.data);
        } catch (err) {
          console.error('Ошибка при загрузке специальных расписаний:', err);
        }
      }
    };
    loadPickupPointData();
  }, [isEditMode, location.state, index]);

  const validateForm = () => {
    const newErrors = {};

    // pickup_point_index: char(6), NOT NULL, PRIMARY KEY
    const indexDigits = form.pickup_point_index.replace(/\D/g, '');
    if (!indexDigits) {
      newErrors.pickup_point_index = 'Индекс обязателен';
    } else if (indexDigits.length !== 6) {
      newErrors.pickup_point_index = 'Должно быть ровно 6 цифр';
    }

    // branch_name: varchar(100), NOT NULL
    if (!form.branch_name.trim()) {
      newErrors.branch_name = 'Название отделения обязательно';
    } else if (form.branch_name.trim().length > 100) {
      newErrors.branch_name = 'Не более 100 символов';
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

    // municipality: varchar(255), NOT NULL
    if (!form.municipality.trim()) {
      newErrors.municipality = 'Муниципалитет обязателен';
    } else if (form.municipality.trim().length > 255) {
      newErrors.municipality = 'Не более 255 символов';
    }

    // oktmo: bigint(20) unsigned, NOT NULL
    if (!form.oktmo.trim()) {
      newErrors.oktmo = 'ОКТМО обязателен';
    } else {
      const oktmoValue = parseInt(form.oktmo);
      if (isNaN(oktmoValue) || oktmoValue < 0) {
        newErrors.oktmo = 'Должно быть положительным числом';
      }
    }

    // service_windows_count: int(11), NOT NULL
    if (!form.service_windows_count.trim()) {
      newErrors.service_windows_count = 'Количество окон обязательно';
    } else {
      const windows = parseInt(form.service_windows_count);
      if (isNaN(windows) || windows < 1) {
        newErrors.service_windows_count = 'Должно быть положительным числом';
      }
    }

    // hotline_phone: varchar(16), может быть null
    if (form.hotline_phone.trim()) {
      const phoneDigits = form.hotline_phone.replace(/\D/g, '');
      if (phoneDigits.length !== 11) {
        newErrors.hotline_phone = 'Должно быть 11 цифр (формат +7(XXX)XXX-XX-XX)';
      }
    }

    // work_mode: varchar(255), NOT NULL
    if (!form.work_mode.trim()) {
      newErrors.work_mode = 'Режим работы обязателен';
    } else if (form.work_mode.trim().length > 255) {
      newErrors.work_mode = 'Не более 255 символов';
    }

    return newErrors;
  };

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;

    let formattedValue = value;

    if (name === 'pickup_point_index' && !isEditMode) {
      formattedValue = maskPostalIndex(value);
    } else if (name === 'hotline_phone') {
      formattedValue = maskPhone(value);
    }

    setForm(prev => ({ 
      ...prev, 
      [name]: type === 'checkbox' ? checked : formattedValue 
    }));

    if (errors[name]) {
      setErrors(prev => {
        const updated = { ...prev };
        delete updated[name];
        return updated;
      });
    }
  };

  const handleServiceToggle = (serviceName) => {
    setSelectedServices(prev => {
      if (prev.includes(serviceName)) {
        return prev.filter(s => s !== serviceName);
      } else {
        return [...prev, serviceName];
      }
    });
  };

  // Управление специальными расписаниями
  const addSpecialSchedule = () => {
    setSpecialSchedules(prev => [
      ...prev,
      {
        schedule_date: '',
        start_time: '09:00',
        end_time: '18:00',
        note: ''
      }
    ]);
  };

  const removeSpecialSchedule = (index) => {
    setSpecialSchedules(prev => prev.filter((_, i) => i !== index));
  };

  const updateSpecialSchedule = (index, field, value) => {
    setSpecialSchedules(prev => {
      const updated = [...prev];
      updated[index] = { ...updated[index], [field]: value };
      return updated;
    });
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
        pickup_point_index: form.pickup_point_index.replace(/\D/g, ''),
        branch_name: form.branch_name.trim(),
        region: form.region.trim(),
        city: form.city.trim(),
        street: form.street.trim(),
        house: form.house.trim(),
        municipality: form.municipality.trim(),
        oktmo: parseInt(form.oktmo),
        service_windows_count: parseInt(form.service_windows_count),
        accessibility_for_mgn: form.accessibility_for_mgn ? 1 : 0,
        hotline_phone: form.hotline_phone.trim() || null,
        work_mode: form.work_mode.trim(),
        services: selectedServices,
        special_schedules: specialSchedules.filter(s => s.schedule_date) // Только с указанной датой
      };

      if (isEditMode) {
        await updatePickupPoint(index, payload);
      } else {
        await createPickupPoint(payload);
      }
      navigate('/admin/pickup-points');
    } catch (err) {
      console.error('Ошибка при сохранении пункта выдачи:', err);
      if (err.response?.data?.message?.includes('pickup_point_index')) {
        setErrors({ pickup_point_index: 'Пункт выдачи с таким индексом уже существует' });
      } else {
        setErrors({ submit: 'Не удалось сохранить пункт выдачи. Проверьте данные.' });
      }
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    navigate('/admin/pickup-points');
  };

  return (
    <div className={styles.pageWrapper}>
      <Header />
      <main className={styles.content}>
        <div className={styles.pageHeader}>
          <h1>{isEditMode ? 'Редактировать пункт выдачи' : 'Добавить новый пункт выдачи'}</h1>
        </div>

        <div className={styles.formContainer}>
          <form onSubmit={handleSubmit} className={styles.form} noValidate>
            <div className={styles.formSection}>
              <h2 className={styles.sectionTitle}>Основная информация</h2>
              <div className={styles.formGrid}>
                <Input
                  label="Индекс (6 цифр)"
                  name="pickup_point_index"
                  value={form.pickup_point_index}
                  onChange={handleChange}
                  placeholder="123456"
                  required
                  maxLength={6}
                  error={errors.pickup_point_index}
                  disabled={isEditMode}
                />
                <Input
                  label="Название отделения"
                  name="branch_name"
                  value={form.branch_name}
                  onChange={handleChange}
                  placeholder="Отделение №1"
                  required
                  maxLength={100}
                  error={errors.branch_name}
                />
              </div>
            </div>

            <div className={styles.formSection}>
              <h2 className={styles.sectionTitle}>Адрес</h2>
              <div className={styles.formGrid}>
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
                <Input
                  label="Муниципалитет"
                  name="municipality"
                  value={form.municipality}
                  onChange={handleChange}
                  placeholder="Муниципальное образование"
                  required
                  maxLength={255}
                  error={errors.municipality}
                />
                <Input
                  label="ОКТМО"
                  name="oktmo"
                  type="number"
                  value={form.oktmo}
                  onChange={handleChange}
                  placeholder="12345678"
                  required
                  error={errors.oktmo}
                />
              </div>
            </div>

            <div className={styles.formSection}>
              <h2 className={styles.sectionTitle}>Рабочие параметры</h2>
              <div className={styles.formGrid}>
                <Input
                  label="Количество окон обслуживания"
                  name="service_windows_count"
                  type="number"
                  value={form.service_windows_count}
                  onChange={handleChange}
                  placeholder="5"
                  required
                  error={errors.service_windows_count}
                />
                <Input
                  label="Режим работы"
                  name="work_mode"
                  value={form.work_mode}
                  onChange={handleChange}
                  placeholder="Пн-Пт: 9:00-18:00, Сб: 10:00-16:00"
                  required
                  maxLength={255}
                  error={errors.work_mode}
                />
                <Input
                  label="Телефон горячей линии"
                  name="hotline_phone"
                  type="tel"
                  value={form.hotline_phone}
                  onChange={handleChange}
                  placeholder="+7(999)123-45-67 (необязательно)"
                  maxLength={16}
                  error={errors.hotline_phone}
                />
                <div className={styles.checkboxField}>
                  <label className={styles.checkboxLabel}>
                    <input
                      type="checkbox"
                      name="accessibility_for_mgn"
                      checked={form.accessibility_for_mgn}
                      onChange={handleChange}
                    />
                    <span>Доступность для маломобильных групп населения</span>
                  </label>
                </div>
              </div>
            </div>

            <div className={styles.formSection}>
              <h2 className={styles.sectionTitle}>Предоставляемые услуги</h2>
              <div className={styles.servicesGrid}>
                {services.length === 0 ? (
                  <p>Загрузка списка услуг...</p>
                ) : (
                  services.map(service => (
                    <div key={service.service_name} className={styles.serviceItem}>
                      <label className={styles.checkboxLabel}>
                        <input
                          type="checkbox"
                          checked={selectedServices.includes(service.service_name)}
                          onChange={() => handleServiceToggle(service.service_name)}
                        />
                        <span>{service.service_name} ({service.service_category})</span>
                      </label>
                    </div>
                  ))
                )}
              </div>
            </div>

            <div className={styles.formSection}>
              <h2 className={styles.sectionTitle}>
                Специальные расписания
                <Button 
                  type="button" 
                  variant="secondary" 
                  onClick={addSpecialSchedule}
                  style={{ marginLeft: '10px', padding: '4px 8px', fontSize: '12px' }}
                >
                  + Добавить расписание
                </Button>
              </h2>
              
              {specialSchedules.length === 0 ? (
                <p style={{ color: '#666', fontStyle: 'italic' }}>Нет специальных расписаний</p>
              ) : (
                <div className={styles.specialSchedules}>
                  {specialSchedules.map((schedule, idx) => (
                    <div key={idx} className={styles.scheduleItem}>
                      <div className={styles.scheduleGrid}>
                        <Input
                          label="Дата"
                          name={`schedule_date_${idx}`}
                          type="date"
                          value={schedule.schedule_date}
                          onChange={(e) => updateSpecialSchedule(idx, 'schedule_date', e.target.value)}
                          required
                        />
                        <Input
                          label="Начало работы"
                          name={`start_time_${idx}`}
                          type="time"
                          value={schedule.start_time}
                          onChange={(e) => updateSpecialSchedule(idx, 'start_time', e.target.value)}
                          required
                        />
                        <Input
                          label="Окончание работы"
                          name={`end_time_${idx}`}
                          type="time"
                          value={schedule.end_time}
                          onChange={(e) => updateSpecialSchedule(idx, 'end_time', e.target.value)}
                          required
                        />
                        <Input
                          label="Примечание"
                          name={`note_${idx}`}
                          value={schedule.note}
                          onChange={(e) => updateSpecialSchedule(idx, 'note', e.target.value)}
                          placeholder="Например: Праздничный день"
                          maxLength={255}
                        />
                        <Button
                          type="button"
                          variant="danger"
                          onClick={() => removeSpecialSchedule(idx)}
                          style={{ padding: '4px 8px', fontSize: '12px', alignSelf: 'flex-end' }}
                        >
                          ✕
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
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