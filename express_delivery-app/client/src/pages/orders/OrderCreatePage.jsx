import { Header } from '../../components/header/Header';
import { Footer } from '../../components/footer/Footer';
import styles from "./../default.module.css";
import { Input } from '../../components/ui/Input/Input';
import { Select } from '../../components/ui/Select/Select';
import { Button } from '../../components/ui/Button/Button';
import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  createShipment,
  getClients,
  getEmployees,
  getPickupPoints,
  getTariffs,
  getServices
} from '../../api/axios';

const maskIPO = (value) => {
  const digits = value.replace(/\D/g, '').substring(0, 14);
  return digits;
};

export const OrderCreatePage = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});
  const [dataLoading, setDataLoading] = useState(true);

  const [clients, setClients] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [pickupPoints, setPickupPoints] = useState([]);
  const [tariffs, setTariffs] = useState([]);
  const [services, setServices] = useState([]);

  const [form, setForm] = useState({
    // Shipment data
    ipo: '',
    sender_passport_number: '',
    receiver_passport_number: '',
    staff_number: '',
    pickup_point_index: '',
    tariff_code: '',
    package_type: 'Стандарт',
    actual_weight: '',
    length_cm: '',
    width_cm: '',
    height_cm: '',
    declared_value: '',
    service_cost: '',
    additional_service_cost: '',
    total_payable: '',
    registration_date: new Date().toISOString().split('T')[0],
    // Receipt data
    cash_register_number: '',
    shift_number: '',
    operation_time: new Date().toTimeString().substring(0, 5),
  });

  const [inventoryItems, setInventoryItems] = useState([]);
  const [newItem, setNewItem] = useState({ item_name: '', item_count: '', declared_value_per_unit: '' });
  const [hasInventory, setHasInventory] = useState(false);

  // Load initial data
  useEffect(() => {
    const loadData = async () => {
      try {
        setDataLoading(true);
        const [clientsRes, employeesRes, pickupPointsRes, tariffsRes, servicesRes] = await Promise.all([
          getClients(),
          getEmployees(),
          getPickupPoints(),
          getTariffs(),
          getServices()
        ]);

        setClients(clientsRes.data || []);
        setEmployees(employeesRes.data || []);
        setPickupPoints(pickupPointsRes.data || []);
        setTariffs(tariffsRes.data || []);
        setServices(servicesRes.data || []);
      } catch (err) {
        console.error('Ошибка при загрузке данных:', err);
        alert('Не удалось загрузить справочные данные');
      } finally {
        setDataLoading(false);
      }
    };
    loadData();
  }, []);

  useEffect(() => {
    if (!form.ipo) {
      const timestamp = Date.now().toString().substring(0, 15);
      setForm(prev => ({ ...prev, ipo: timestamp }));
    }
  }, []);

  const clientOptions = clients.map(client => ({
    value: client.passport_number,
    label: `${client.surname} ${client.first_name} ${client.patronymic || ''} (${client.passport_number})`
  }));

  const employeeOptions = employees.map(emp => ({
    value: emp.staff_number,
    label: `${emp.surname} ${emp.first_name} ${emp.patronymic || ''} (№${emp.staff_number})`
  }));

  const pickupPointOptions = pickupPoints.map(point => ({
    value: point.pickup_point_index,
    label: `${point.city} (${point.pickup_point_index})`
  }));

  const tariffOptions = tariffs.map(tariff => ({
    value: tariff.tariff_code,
    label: `Тариф ${tariff.tariff_code} - ${Number(tariff.tariff_up_to_500g).toFixed(2)} руб.`
  }));

  const calculateCost = useCallback(() => {
    if (!form.tariff_code || !tariffs || tariffs.length === 0) {
      return { baseCost: 0, additionalCost: 0, totalCost: 0 };
    }

    const selectedTariff = tariffs.find(t =>
      String(t.tariff_code) === String(form.tariff_code)
    );

    if (!selectedTariff) {
      return { baseCost: 0, additionalCost: 0, totalCost: 0 };
    }

    const actualWeight = parseFloat(form.actual_weight) || 0;
    const length = parseFloat(form.length_cm) || 0;
    const width = parseFloat(form.width_cm) || 0;
    const height = parseFloat(form.height_cm) || 0;

    const volumetricWeight = (length * width * height) / 5000;

    const weightForPayment = Math.max(actualWeight, volumetricWeight);

    const tariffUpTo500 = parseFloat(selectedTariff.tariff_up_to_500g) || 0;
    const tariffUpTo1kg = parseFloat(selectedTariff.tariff_up_to_1kg) || 0;
    const additional500Charge = parseFloat(selectedTariff.additional_500g_charge) || 0;
    const oversizePercent = parseFloat(selectedTariff.oversize_surcharge) || 0;
    const carefulPercent = parseFloat(selectedTariff.careful_surcharge) || 0;

    let baseCost = 0;
    if (weightForPayment <= 0.5) {
      baseCost = tariffUpTo500;
    } else if (weightForPayment <= 1) {
      baseCost = tariffUpTo1kg;
    } else {
      const additionalUnits = Math.ceil((weightForPayment - 1) / 0.5);
      baseCost = tariffUpTo1kg + (additionalUnits * additional500Charge);
    }

    let oversizeCharge = 0;
    let carefulCharge = 0;

    const isOversize = length > 60 || width > 40 || height > 20;
    if (isOversize) {
      oversizeCharge = baseCost * (oversizePercent / 100);
    }

    if (form.package_type === 'EMS') {
      carefulCharge = baseCost * (carefulPercent / 100);
    }

    const additionalCost = oversizeCharge + carefulCharge;
    const totalCost = baseCost + additionalCost;

    return {
      baseCost: Number(baseCost.toFixed(2)),
      additionalCost: Number(additionalCost.toFixed(2)),
      totalCost: Number(totalCost.toFixed(2))
    };
  }, [form.tariff_code, form.actual_weight, form.length_cm, form.width_cm, form.height_cm, form.package_type, tariffs]);

  useEffect(() => {
    const hasRequiredFields =
      form.tariff_code &&
      form.actual_weight && parseFloat(form.actual_weight) > 0 &&
      form.length_cm && parseFloat(form.length_cm) > 0 &&
      form.width_cm && parseFloat(form.width_cm) > 0 &&
      form.height_cm && parseFloat(form.height_cm) > 0;

    if (hasRequiredFields) {
      const costs = calculateCost();

      if (costs.totalCost > 0) {
        setForm(prev => ({
          ...prev,
          service_cost: costs.baseCost.toString(),
          additional_service_cost: costs.additionalCost.toString(),
          total_payable: costs.totalCost.toString()
        }));
      }
    } else {
      setForm(prev => ({
        ...prev,
        service_cost: '',
        additional_service_cost: '',
        total_payable: ''
      }));
    }
  }, [form.tariff_code, form.actual_weight, form.length_cm, form.width_cm, form.height_cm, form.package_type, calculateCost]);

  const validateForm = () => {
    const newErrors = {};

    if (!form.ipo.trim() || form.ipo.replace(/\D/g, '').length !== 14) {
      newErrors.ipo = 'IPO должен содержать 14 цифр';
    }

    if (!form.sender_passport_number) {
      newErrors.sender_passport_number = 'Отправитель обязателен';
    }

    if (!form.receiver_passport_number) {
      newErrors.receiver_passport_number = 'Получатель обязателен';
    }

    if (!form.staff_number) {
      newErrors.staff_number = 'Сотрудник обязателен';
    }

    if (!form.pickup_point_index) {
      newErrors.pickup_point_index = 'Пункт выдачи обязателен';
    }

    if (!form.tariff_code) {
      newErrors.tariff_code = 'Тариф обязателен';
    }

    if (!form.package_type) {
      newErrors.package_type = 'Тип посылки обязателен';
    }

    const actualWeight = parseFloat(form.actual_weight);
    if (!form.actual_weight || actualWeight <= 0 || actualWeight > 9999.99) {
      newErrors.actual_weight = 'Фактический вес должен быть больше 0';
    }

    const lengthVal = parseFloat(form.length_cm);
    if (!form.length_cm || lengthVal <= 0 || lengthVal > 999.99) {
      newErrors.length_cm = 'Длина должна быть больше 0';
    }

    const widthVal = parseFloat(form.width_cm);
    if (!form.width_cm || widthVal <= 0 || widthVal > 999.99) {
      newErrors.width_cm = 'Ширина должна быть больше 0';
    }

    const heightVal = parseFloat(form.height_cm);
    if (!form.height_cm || heightVal <= 0 || heightVal > 999.99) {
      newErrors.height_cm = 'Высота должна быть больше 0';
    }

    const declaredValue = parseFloat(form.declared_value);
    if (!form.declared_value || declaredValue < 0) {
      newErrors.declared_value = 'Объявленная ценность должна быть >= 0';
    }

    if (form.total_payable <= 0) {
      newErrors.total_payable = 'Стоимость должна быть рассчитана';
    }

    const serviceCost = parseFloat(form.service_cost);
    if (!form.service_cost || serviceCost < 0) {
      newErrors.service_cost = 'Стоимость услуги обязательна и не может быть отрицательной';
    }

    const totalPayable = parseFloat(form.total_payable);
    if (!form.total_payable || totalPayable < serviceCost) {
      newErrors.total_payable = 'Сумма к оплате должна быть больше или равна стоимости услуги';
    }

    if (!form.cash_register_number.trim()) {
      newErrors.cash_register_number = 'Номер кассы обязателен';
    }

    if (!form.shift_number || parseInt(form.shift_number) <= 0) {
      newErrors.shift_number = 'Номер смены обязателен';
    }
    return newErrors;
  };

  const handleChange = useCallback((e) => {
    const { name, value } = e.target;
    let formattedValue = value;

    if (name === 'ipo') {
      formattedValue = maskIPO(value);
    }

    setForm(prev => ({ ...prev, [name]: formattedValue }));

    if (errors[name]) {
      setErrors(prev => {
        const updated = { ...prev };
        delete updated[name];
        return updated;
      });
    }
  }, [errors]);

  const handleAddInventoryItem = () => {
    if (!newItem.item_name.trim()) {
      alert('Укажите название предмета');
      return;
    }
    if (!newItem.item_count || parseInt(newItem.item_count) <= 0) {
      alert('Укажите корректное количество');
      return;
    }
    if (!newItem.declared_value_per_unit || parseFloat(newItem.declared_value_per_unit) < 0) {
      alert('Укажите корректную стоимость');
      return;
    }

    setInventoryItems([...inventoryItems, { ...newItem }]);
    setNewItem({ item_name: '', item_count: '', declared_value_per_unit: '' });
  };

  const handleRemoveInventoryItem = (index) => {
    setInventoryItems(inventoryItems.filter((_, i) => i !== index));
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
      // Расчет объемного веса перед отправкой
      const length = parseFloat(form.length_cm);
      const width = parseFloat(form.width_cm);
      const height = parseFloat(form.height_cm);
      const volumetricWeight = (length * width * height) / 5000;

      const payload = {
        ipo: form.ipo.replace(/\D/g, ''),
        sender_passport_number: form.sender_passport_number,
        receiver_passport_number: form.receiver_passport_number,
        staff_number: parseInt(form.staff_number),
        pickup_point_index: form.pickup_point_index,
        tariff_code: parseInt(form.tariff_code),
        package_type: form.package_type,
        actual_weight: parseFloat(form.actual_weight),
        volumetric_weight: parseFloat(volumetricWeight.toFixed(2)),
        length_cm: parseInt(form.length_cm),
        width_cm: parseInt(form.width_cm),
        height_cm: parseInt(form.height_cm),
        declared_value: form.declared_value ? parseFloat(form.declared_value) : null,
        service_cost: parseFloat(form.service_cost),
        additional_service_cost: form.additional_service_cost ? parseFloat(form.additional_service_cost) : null,
        total_payable: parseFloat(form.total_payable),
        registration_date: form.registration_date,
        cash_register_number: form.cash_register_number.trim(),
        shift_number: parseInt(form.shift_number),
        operation_time: form.operation_time,
        // Inventory - отправляем только если опись включена
        inventory_items: hasInventory && inventoryItems.length > 0
          ? inventoryItems.map(item => ({
            item_name: item.item_name,
            item_count: parseInt(item.item_count),
            declared_value_per_unit: parseFloat(item.declared_value_per_unit)
          }))
          : []
      };

      console.log('Отправляемые данные:', payload);
      await createShipment(payload);
      navigate('/orders/list');
    } catch (err) {
      console.error('Ошибка при создании отправления:', err);
      if (err.response?.data?.message?.includes('ipo')) {
        setErrors({ ipo: 'Отправление с таким IPO уже существует' });
      } else if (err.response?.data?.message) {
        setErrors({ submit: err.response.data.message });
      } else {
        setErrors({ submit: 'Не удалось создать отправление. Проверьте данные.' });
      }
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    navigate('/orders/list');
  };

  if (dataLoading) {
    return (
      <div className={styles.pageWrapper}>
        <Header />
        <main className={styles.content}>
          <div className={styles.pageHeader}>
            <h1>Создать отправление</h1>
          </div>
          <p>Загрузка данных...</p>
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className={styles.pageWrapper}>
      <Header />
      <main className={styles.content}>
        <div className={styles.pageHeader}>
          <h1>Создать новое отправление</h1>
        </div>

        <div className={styles.formContainer}>
          <form onSubmit={handleSubmit} className={styles.form} noValidate>
            {/* Основная информация */}
            <div className={styles.formSection}>
              <h2 className={styles.sectionTitle}>Основная информация</h2>
              <div className={styles.formGrid}>
                <Input
                  label="IPO (14 цифр)"
                  name="ipo"
                  value={form.ipo}
                  onChange={handleChange}
                  placeholder="00000000000000"
                  required
                  maxLength={14}
                  error={errors.ipo}
                />
                <Input
                  label="Дата регистрации"
                  name="registration_date"
                  type="date"
                  value={form.registration_date}
                  onChange={handleChange}
                  required
                  error={errors.registration_date}
                />
              </div>
            </div>

            {/* Участники доставки */}
            <div className={styles.formSection}>
              <h2 className={styles.sectionTitle}>Участники доставки</h2>
              <div className={styles.formGrid}>
                <Select
                  label="Отправитель"
                  name="sender_passport_number"
                  value={form.sender_passport_number}
                  onChange={handleChange}
                  options={clientOptions}
                  placeholder="Выберите отправителя"
                  required
                  error={errors.sender_passport_number}
                />
                <Select
                  label="Получатель"
                  name="receiver_passport_number"
                  value={form.receiver_passport_number}
                  onChange={handleChange}
                  options={clientOptions}
                  placeholder="Выберите получателя"
                  required
                  error={errors.receiver_passport_number}
                />
                <Select
                  label="Сотрудник"
                  name="staff_number"
                  value={form.staff_number}
                  onChange={handleChange}
                  options={employeeOptions}
                  placeholder="Выберите сотрудника"
                  required
                  error={errors.staff_number}
                />
              </div>
            </div>

            {/* Характеристики посылки */}
            <div className={styles.formSection}>
              <h2 className={styles.sectionTitle}>Характеристики посылки</h2>
              <div className={styles.formGrid}>
                <Select
                  label="Пункт выдачи"
                  name="pickup_point_index"
                  value={form.pickup_point_index}
                  onChange={handleChange}
                  options={pickupPointOptions}
                  placeholder="Выберите пункт выдачи"
                  required
                  error={errors.pickup_point_index}
                />
                <Select
                  label="Тариф"
                  name="tariff_code"
                  value={form.tariff_code}
                  onChange={handleChange}
                  options={tariffOptions}
                  placeholder="Выберите тариф"
                  required
                  error={errors.tariff_code}
                />
                <Select
                  label="Тип посылки"
                  name="package_type"
                  value={form.package_type}
                  onChange={handleChange}
                  options={[
                    { value: 'Стандарт', label: 'Стандарт' },
                    { value: 'EMS', label: 'EMS' },
                    { value: 'Экспресс', label: 'Экспресс' }
                  ]}
                  placeholder="Выберите тип посылки"
                  required
                  error={errors.package_type}
                />
              </div>
            </div>

            {/* Размеры и вес */}
            <div className={styles.formSection}>
              <h2 className={styles.sectionTitle}>Размеры и вес</h2>
              <div className={styles.formGrid}>
                <Input
                  label="Длина (см)"
                  name="length_cm"
                  type="number"
                  value={form.length_cm}
                  onChange={handleChange}
                  placeholder="20"
                  required
                  error={errors.length_cm}
                />
                <Input
                  label="Ширина (см)"
                  name="width_cm"
                  type="number"
                  value={form.width_cm}
                  onChange={handleChange}
                  placeholder="15"
                  required
                  error={errors.width_cm}
                />
                <Input
                  label="Высота (см)"
                  name="height_cm"
                  type="number"
                  value={form.height_cm}
                  onChange={handleChange}
                  placeholder="10"
                  required
                  error={errors.height_cm}
                />
                <Input
                  label="Фактический вес (кг)"
                  name="actual_weight"
                  type="number"
                  step="0.01"
                  value={form.actual_weight}
                  onChange={handleChange}
                  placeholder="2.50"
                  required
                  error={errors.actual_weight}
                />
              </div>
            </div>

            {/* Стоимость */}
            <div className={styles.formSection}>
              <h2 className={styles.sectionTitle}>Стоимость</h2>
              <div className={styles.formGrid}>
                <Input
                  label="Объявленная стоимость (руб.)"
                  name="declared_value"
                  type="number"
                  step="0.01"
                  value={form.declared_value}
                  onChange={handleChange}
                  placeholder="0.00"
                  error={errors.declared_value}
                />
                <Input
                  label="Стоимость услуги (руб.)"
                  name="service_cost"
                  type="number"
                  step="0.01"
                  value={form.service_cost || ''}
                  readOnly={true}
                  placeholder="Рассчитывается автоматически"
                  required
                  error={errors.service_cost}
                />
                <Input
                  label="Доп. услуги (руб.)"
                  name="additional_service_cost"
                  type="number"
                  step="0.01"
                  value={form.additional_service_cost || ''}
                  readOnly={true}
                  placeholder="Рассчитывается автоматически"
                  error={errors.additional_service_cost}
                />
                <Input
                  label="Итого к оплате (руб.)"
                  name="total_payable"
                  type="number"
                  step="0.01"
                  value={form.total_payable || ''}
                  readOnly={true}
                  placeholder="Рассчитывается автоматически"
                  required
                  error={errors.total_payable}
                />
              </div>
            </div>

            {/* Информация о чеке */}
            <div className={styles.formSection}>
              <h2 className={styles.sectionTitle}>Информация о чеке</h2>
              <div className={styles.formGrid}>
                <Input
                  label="Номер кассы"
                  name="cash_register_number"
                  value={form.cash_register_number}
                  onChange={handleChange}
                  placeholder="КАССА-001"
                  required
                  maxLength={15}
                  error={errors.cash_register_number}
                />
                <Input
                  label="Номер смены"
                  name="shift_number"
                  type="number"
                  value={form.shift_number}
                  onChange={handleChange}
                  placeholder="1"
                  required
                  error={errors.shift_number}
                />
                <Input
                  label="Время операции"
                  name="operation_time"
                  type="text"
                  value={form.operation_time}
                  onChange={handleChange}
                  placeholder="09:00"
                  required
                  maxLength={5}
                  error={errors.operation_time}
                />
              </div>
            </div>

            {/* Опись (опционально) */}
            <div className={styles.formSection}>
              <h2 className={styles.sectionTitle}>Опись предметов (опционально)</h2>
              <div style={{ marginBottom: '15px' }}>
                <label>
                  <input
                    type="checkbox"
                    checked={hasInventory}
                    onChange={(e) => setHasInventory(e.target.checked)}
                  />
                  {' '}Добавить описание предметов
                </label>
              </div>

              {hasInventory && (
                <>
                  <div className={styles.formGrid} style={{ marginBottom: '15px' }}>
                    <Input
                      label="Название предмета"
                      value={newItem.item_name}
                      onChange={(e) => setNewItem({ ...newItem, item_name: e.target.value })}
                      placeholder="Например: Книга"
                    />
                    <Input
                      label="Количество"
                      type="number"
                      value={newItem.item_count}
                      onChange={(e) => setNewItem({ ...newItem, item_count: e.target.value })}
                      placeholder="1"
                    />
                    <Input
                      label="Стоимость за единицу (руб.)"
                      type="number"
                      step="0.01"
                      value={newItem.declared_value_per_unit}
                      onChange={(e) => setNewItem({ ...newItem, declared_value_per_unit: e.target.value })}
                      placeholder="100.00"
                    />
                  </div>
                  <Button
                    type="button"
                    variant="secondary"
                    onClick={handleAddInventoryItem}
                    style={{ marginBottom: '15px' }}
                  >
                    Добавить предмет
                  </Button>

                  {inventoryItems.length > 0 && (
                    <div style={{ marginTop: '15px', padding: '10px', backgroundColor: '#a1a1a1', borderRadius: '4px' }}>
                      <h3>Добавленные предметы:</h3>
                      {inventoryItems.map((item, idx) => (
                        <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 0', borderBottom: '1px solid #ddd' }}>
                          <span>{idx + 1}. {item.item_name} × {item.item_count} ({item.declared_value_per_unit} руб./шт.)</span>
                          <Button
                            type="button"
                            variant="danger"
                            onClick={() => handleRemoveInventoryItem(idx)}
                            style={{ padding: '4px 8px', fontSize: '12px' }}
                          >
                            Удалить
                          </Button>
                        </div>
                      ))}
                    </div>
                  )}
                </>
              )}
            </div>

            {errors.submit && (
              <div className={styles.errorBlock}>
                {errors.submit}
              </div>
            )}

            <div className={styles.buttonGroup}>
              <Button type="submit" variant="primary" loading={loading}>
                Создать отправление
              </Button>
              <Button type="button" variant="secondary" onClick={handleCancel} disabled={loading}>
                Отмена
              </Button>
            </div>
          </form>
        </div>
      </main>
      <Footer />
    </div>
  );
};