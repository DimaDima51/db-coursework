import { Header } from '../../components/header/Header';
import { Footer } from '../../components/footer/Footer';
import styles from "./../default.module.css";
import { Input } from '../../components/ui/Input/Input';
import { Select } from '../../components/ui/Select/Select';
import { Button } from '../../components/ui/Button/Button';
import { Loader } from '../../components/ui/Loader/Loader';
import { useState, useEffect, useMemo, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { createTransferAct, getEmployees, getShipments } from '../../api/axios';
import tableStyles from './TransferActFormPage.module.css';

const STATUS_COLORS = {
  'Принято': '#4CAF50',
  'В пути': '#2196F3',
  'Готова к выдаче': '#FF9800',
  'Выдана': '#8BC34A',
  'Получено': '#00BCD4',
  'Не востребована': '#F44336',
  'Утилизирована': '#9E9E9E'
};

const getStatusColor = (status) => STATUS_COLORS[status] || '#999';

export const TransferActFormPage = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [dataLoading, setDataLoading] = useState(true);
  const [errors, setErrors] = useState({});
  
  const [employees, setEmployees] = useState([]);
  const [shipments, setShipments] = useState([]);
  const [selectedShipments, setSelectedShipments] = useState(new Set());

  const [form, setForm] = useState({
    act_number: '',
    creation_date: new Date().toISOString().split('T')[0],
    sender_staff_number: '',
    receiver_staff_number: ''
  });

  const availableShipments = useMemo(() => {
    return shipments.filter(s => 
      s.shipment_status !== 'Выдана' && 
      s.shipment_status !== 'Утилизирована' &&
      s.shipment_status !== 'Не востребована'
    );
  }, [shipments]);

  const addableShipments = useMemo(() => {
    return availableShipments.filter(s => s.shipment_status !== 'Получено');
  }, [availableShipments]);

  const allSelectedReceived = useMemo(() => {
    if (selectedShipments.size === 0) return false;
    return Array.from(selectedShipments).every(ipo => {
      const shipment = shipments.find(s => s.ipo === ipo);
      return shipment?.shipment_status === 'Получено';
    });
  }, [selectedShipments, shipments]);

  const receivedCount = useMemo(() => {
    return Array.from(selectedShipments).filter(ipo => {
      const shipment = shipments.find(s => s.ipo === ipo);
      return shipment?.shipment_status === 'Получено';
    }).length;
  }, [selectedShipments, shipments]);

  const employeeOptions = useMemo(() => 
    employees.map(emp => ({
      value: emp.staff_number,
      label: `${emp.surname} ${emp.first_name} ${emp.patronymic || ''} (№${emp.staff_number})`
    })), [employees]
  );

  useEffect(() => {
    const loadData = async () => {
      try {
        setDataLoading(true);
        const [employeesRes, shipmentsRes] = await Promise.all([
          getEmployees(),
          getShipments()
        ]);
        setEmployees(employeesRes.data || []);
        setShipments(shipmentsRes.data || []);
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
    if (!form.act_number) {
      const timestamp = Math.floor(Date.now() / 1000);
      setForm(prev => ({ ...prev, act_number: timestamp.toString() }));
    }
  }, []);

  const validateForm = () => {
    const newErrors = {};
    if (!form.act_number.trim()) newErrors.act_number = 'Номер акта обязателен';
    if (!form.sender_staff_number) newErrors.sender_staff_number = 'Отправляющий сотрудник обязателен';
    if (!form.receiver_staff_number) newErrors.receiver_staff_number = 'Принимающий сотрудник обязателен';
    if (form.sender_staff_number === form.receiver_staff_number) {
      newErrors.receiver_staff_number = 'Отправляющий и принимающий сотрудники должны быть разными';
    }
    if (selectedShipments.size === 0) newErrors.shipments = 'Выберите хотя бы одну посылку';
    if (allSelectedReceived) newErrors.shipments = 'Все выбранные посылки уже получены. Акт можно закрыть.';
    return newErrors;
  };

  const handleShipmentSelect = useCallback((ipo) => {
    const shipment = shipments.find(s => s.ipo === ipo);
    if (shipment?.shipment_status === 'Получено') return;
    setSelectedShipments(prev => {
      const newSelected = new Set(prev);
      newSelected.has(ipo) ? newSelected.delete(ipo) : newSelected.add(ipo);
      return newSelected;
    });
  }, [shipments]);

  const handleSelectAll = useCallback(() => {
    if (selectedShipments.size === addableShipments.length) {
      setSelectedShipments(new Set());
    } else {
      setSelectedShipments(new Set(addableShipments.map(s => s.ipo)));
    }
  }, [selectedShipments.size, addableShipments]);

  const handleCloseAct = useCallback(async () => {
    if (!allSelectedReceived) {
      alert('Не все посылки в акте получены');
      return;
    }
    if (!confirm('Закрыть акт? Все посылки в нем уже получены.')) return;
    setLoading(true);
    try {
      setSelectedShipments(new Set());
      setShipments(prev => prev.filter(s => s.shipment_status !== 'Получено'));
      alert('Акт закрыт успешно');
    } catch (err) {
      console.error('Ошибка при закрытии акта:', err);
      alert(`Ошибка: ${err.response?.data?.message || err.message}`);
    } finally {
      setLoading(false);
    }
  }, [allSelectedReceived]);

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
        act_number: parseInt(form.act_number),
        creation_date: form.creation_date,
        sender_staff_number: parseInt(form.sender_staff_number),
        receiver_staff_number: parseInt(form.receiver_staff_number),
        shipment_ipos: Array.from(selectedShipments)
      };
      await createTransferAct(payload);
      alert('Акт доставки успешно создан');
      navigate('/orders/transfer-acts');
    } catch (err) {
      console.error('Ошибка при создании акта:', err);
      if (err.response?.data?.message?.includes('act_number')) {
        setErrors({ act_number: 'Акт с таким номером уже существует' });
      } else {
        setErrors({ submit: 'Не удалось создать акт. Проверьте данные.' });
      }
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => navigate('/orders/transfer-acts');

  if (dataLoading) {
    return (
      <div className={styles.pageWrapper}>
        <Header />
        <main className={styles.content}>
          <h1>Создать акт доставки</h1>
          <Loader />
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
          <h1>Создать акт доставки между пунктами</h1>
        </div>

        <div className={styles.formContainer}>
          <form onSubmit={handleSubmit} className={styles.form} noValidate>
            <div className={styles.formSection}>
              <h2 className={styles.sectionTitle}>Информация об акте</h2>
              <div className={styles.formGrid}>
                <Input
                  label="Номер акта"
                  name="act_number"
                  value={form.act_number}
                  onChange={(e) => setForm(prev => ({ ...prev, act_number: e.target.value }))}
                  placeholder="Номер акта"
                  required
                  readOnly
                  error={errors.act_number}
                />
                <Input
                  label="Дата создания"
                  name="creation_date"
                  type="date"
                  value={form.creation_date}
                  onChange={(e) => setForm(prev => ({ ...prev, creation_date: e.target.value }))}
                  required
                  error={errors.creation_date}
                />
              </div>
            </div>

            <div className={styles.formSection}>
              <h2 className={styles.sectionTitle}>Участники перемещения</h2>
              <div className={styles.formGrid}>
                <Select
                  label="Отправляющий сотрудник"
                  name="sender_staff_number"
                  value={form.sender_staff_number}
                  onChange={(e) => setForm(prev => ({ ...prev, sender_staff_number: e.target.value }))}
                  options={employeeOptions}
                  placeholder="Выберите отправляющего сотрудника"
                  required
                  error={errors.sender_staff_number}
                />
                <Select
                  label="Принимающий сотрудник"
                  name="receiver_staff_number"
                  value={form.receiver_staff_number}
                  onChange={(e) => setForm(prev => ({ ...prev, receiver_staff_number: e.target.value }))}
                  options={employeeOptions}
                  placeholder="Выберите принимающего сотрудника"
                  required
                  error={errors.receiver_staff_number}
                />
              </div>
            </div>

            <div className={styles.formSection}>
              <div className={tableStyles.sectionHeader}>
                <h2 className={styles.sectionTitle}>Выбор посылок для перемещения</h2>
                {allSelectedReceived && (
                  <Button
                    type="button"
                    variant="secondary"
                    onClick={handleCloseAct}
                    loading={loading}
                    className={tableStyles.closeActButton}
                  >
                    Закрыть акт (все получено)
                  </Button>
                )}
              </div>
              
              {errors.shipments && (
                <div className={tableStyles.errorMessage}>{errors.shipments}</div>
              )}

              {selectedShipments.size > 0 && (
                <div className={`${tableStyles.selectionStats} ${allSelectedReceived ? tableStyles.selectionStatsSuccess : tableStyles.selectionStatsInfo}`}>
                  <span>
                    Выбрано: <strong>{selectedShipments.size}</strong>
                    {receivedCount > 0 && (
                      <span className={tableStyles.receivedCount}> (получено: {receivedCount})</span>
                    )}
                  </span>
                  {allSelectedReceived && (
                    <span className={tableStyles.allReceived}>✓ Все посылки получены</span>
                  )}
                </div>
              )}

              {availableShipments.length === 0 ? (
                <div className={tableStyles.emptyWarning}>
                  Нет доступных посылок для перемещения
                </div>
              ) : (
                <>
                  <div className={tableStyles.selectAllContainer}>
                    <label className={tableStyles.selectAllLabel}>
                      <input
                        type="checkbox"
                        checked={selectedShipments.size === addableShipments.length && addableShipments.length > 0}
                        onChange={handleSelectAll}
                        disabled={addableShipments.length === 0}
                      />
                      <span>Выбрать все доступные ({addableShipments.length})</span>
                    </label>
                  </div>

                  <div className={tableStyles.tableWrapper}>
                    <table className={tableStyles.table}>
                      <thead>
                        <tr>
                          <th className={`${tableStyles.th} ${tableStyles.thCheckbox}`}>☑</th>
                          <th className={tableStyles.th}>IPO</th>
                          <th className={tableStyles.th}>Получатель</th>
                          <th className={tableStyles.th}>Тип</th>
                          <th className={tableStyles.th}>Статус</th>
                        </tr>
                      </thead>
                      <tbody>
                        {availableShipments.map(shipment => {
                          const isReceived = shipment.shipment_status === 'Получено';
                          const isSelected = selectedShipments.has(shipment.ipo);
                          
                          return (
                            <tr 
                              key={shipment.ipo}
                              className={`${tableStyles.tr} ${isReceived ? tableStyles.trReceived : ''} ${isSelected ? tableStyles.trSelected : ''}`}
                              onClick={() => !isReceived && handleShipmentSelect(shipment.ipo)}
                            >
                              <td className={`${tableStyles.td} ${tableStyles.tdCenter}`}>
                                {isReceived ? (
                                  <span className={tableStyles.receivedIcon}>✓</span>
                                ) : (
                                  <input
                                    type="checkbox"
                                    checked={isSelected}
                                    onChange={() => {}}
                                    onClick={(e) => e.stopPropagation()}
                                  />
                                )}
                              </td>
                              <td className={`${tableStyles.td} ${tableStyles.tdBold}`}>{shipment.ipo}</td>
                              <td className={tableStyles.td}>{shipment.receiver_passport_number || '-'}</td>
                              <td className={tableStyles.td}>{shipment.package_type || '-'}</td>
                              <td className={tableStyles.td} style={{ color: getStatusColor(shipment.shipment_status), fontWeight: 'bold' }}>
                                {shipment.shipment_status}
                                {isReceived && <span className={tableStyles.statusNote}>(получена)</span>}
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </>
              )}
            </div>

            {errors.submit && <div className={styles.errorBlock}>{errors.submit}</div>}

            <div className={styles.buttonGroup}>
              <Button 
                type="submit" 
                variant="primary" 
                loading={loading}
                disabled={allSelectedReceived}
              >
                {allSelectedReceived ? 'Акт готов к закрытию' : 'Создать акт'}
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