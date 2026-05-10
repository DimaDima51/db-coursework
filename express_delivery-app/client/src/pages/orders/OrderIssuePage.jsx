import { Header } from '../../components/header/Header';
import { Footer } from '../../components/footer/Footer';
import styles from "./../default.module.css";
import { Input } from '../../components/ui/Input/Input';
import { Button } from '../../components/ui/Button/Button';
import { Loader } from '../../components/ui/Loader/Loader';
import { useAsyncData } from '../../hooks/useAsyncData';
import { getShipments, issueShipment } from '../../api/axios';
import { useState, useMemo } from 'react';

const statusColors = {
  'Принято': '#4CAF50',
  'В пути': '#2196F3',
  'Готова к выдаче': '#FF9800',
  'Выдана': '#8BC34A',
  'Не востребована': '#F44336',
  'Утилизирована': '#9E9E9E'
};

const getStatusColor = (status) => {
  return statusColors[status] || '#999';
};

export const OrderIssuePage = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedShipments, setSelectedShipments] = useState(new Set());
  const [processingIpo, setProcessingIpo] = useState(null);

  const { data, loading, error } = useAsyncData(async () => {
    const response = await getShipments();
    return response.data;
  }, []);

  const shipments = data ?? [];

  // Фильтрация: исключаем "Выдана" и фильтруем по поиску
  const filteredShipments = useMemo(() => {
    return shipments
      .filter(shipment => shipment.shipment_status !== 'Выдана') // Не показываем выданные
      .filter(shipment => {
        if (!searchTerm) return true;
        
        const searchLower = searchTerm.toLowerCase();
        return (
          shipment.ipo.toLowerCase().includes(searchLower) ||
          shipment.sender_passport_number?.toLowerCase().includes(searchLower) ||
          shipment.receiver_passport_number?.toLowerCase().includes(searchLower) ||
          shipment.shipment_status?.toLowerCase().includes(searchLower)
        );
      });
  }, [shipments, searchTerm]);

  // Проверяем, можно ли выдать посылку
  const canIssueShipment = (status) => {
    return status !== 'Выдана' && status !== 'В пути';
  };

  // Получаем только те посылки, которые можно выдать
  const issueableShipments = useMemo(() => {
    return filteredShipments.filter(s => canIssueShipment(s.shipment_status));
  }, [filteredShipments]);

  const handleCheckboxChange = (ipo) => {
    // Разрешаем выбирать только те, которые можно выдать
    const shipment = shipments.find(s => s.ipo === ipo);
    if (!shipment || !canIssueShipment(shipment.shipment_status)) return;

    const newSelected = new Set(selectedShipments);
    if (newSelected.has(ipo)) {
      newSelected.delete(ipo);
    } else {
      newSelected.add(ipo);
    }
    setSelectedShipments(newSelected);
  };

  const handleSelectAll = () => {
    if (selectedShipments.size === issueableShipments.length) {
      setSelectedShipments(new Set());
    } else {
      const all = new Set(issueableShipments.map(s => s.ipo));
      setSelectedShipments(all);
    }
  };

  const handleIssueShipment = async (ipo) => {
    const shipment = shipments.find(s => s.ipo === ipo);
    if (!shipment || !canIssueShipment(shipment.shipment_status)) {
      alert('Эту посылку нельзя выдать');
      return;
    }

    if (!confirm('Подтвердить выдачу посылки?')) {
      return;
    }

    setProcessingIpo(ipo);
    try {
      await issueShipment(ipo);
      alert('Посылка выдана успешно');
      window.location.reload();
    } catch (err) {
      console.error('Ошибка при выдаче посылки:', err);
      alert(`Ошибка: ${err.response?.data?.message || err.message}`);
    } finally {
      setProcessingIpo(null);
    }
  };

  const handleIssueSelected = async () => {
    if (selectedShipments.size === 0) {
      alert('Выберите хотя бы одну посылку');
      return;
    }

    const count = selectedShipments.size;
    if (!confirm(`Выдать ${count} посылок? Это действие нельзя отменить.`)) {
      return;
    }

    setProcessingIpo('bulk');
    try {
      const promises = Array.from(selectedShipments).map(ipo => issueShipment(ipo));
      await Promise.all(promises);
      alert(`${count} посылок выданы успешно`);
      setSelectedShipments(new Set());
      window.location.reload();
    } catch (err) {
      console.error('Ошибка при выдаче посылок:', err);
      alert(`Ошибка: ${err.response?.data?.message || err.message}`);
    } finally {
      setProcessingIpo(null);
    }
  };

  if (loading) {
    return (
      <div className={styles.pageWrapper}>
        <Header />
        <main className={styles.content}>
          <h1>Выдача посылок</h1>
          <Loader />
        </main>
        <Footer />
      </div>
    );
  }

  if (error) {
    return (
      <div className={styles.pageWrapper}>
        <Header />
        <main className={styles.content}>
          <h1>Выдача посылок</h1>
          <div className={styles.error}>Загрузка не удалась. Пожалуйста, попробуйте позже.</div>
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
          <h2>Выдача посылок</h2>
        </div>

        {/* Search section */}
        <div style={{ marginBottom: '20px', padding: '15px', backgroundColor: '#f9f9f9', borderRadius: '4px' }}>
          <Input
            label="Поиск по IPO или паспорту"
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Введите IPO, номер паспорта или статус..."
          />
          <div style={{ marginTop: '10px', color: '#666', fontSize: '14px' }}>
            Найдено посылок: <strong>{filteredShipments.length}</strong> | 
            Можно выдать: <strong style={{ color: '#FF9800' }}>{issueableShipments.length}</strong>
          </div>
        </div>

        {/* Bulk actions */}
        {filteredShipments.length > 0 && (
          <div style={{ marginBottom: '20px', display: 'flex', gap: '10px', alignItems: 'center' }}>
            <label style={{ display: 'flex', alignItems: 'center', cursor: 'pointer', gap: '8px' }}>
              <input
                type="checkbox"
                checked={selectedShipments.size === issueableShipments.length && issueableShipments.length > 0}
                onChange={handleSelectAll}
                disabled={issueableShipments.length === 0}
              />
              <span>Выбрать все доступные ({issueableShipments.length})</span>
            </label>
            {selectedShipments.size > 0 && (
              <>
                <span style={{ color: '#666' }}>|</span>
                <span>Выбрано: <strong>{selectedShipments.size}</strong></span>
                <Button 
                  variant="primary"
                  onClick={handleIssueSelected}
                  loading={processingIpo === 'bulk'}
                  style={{ marginLeft: 'auto' }}
                >
                  Выдать выбранные ({selectedShipments.size})
                </Button>
              </>
            )}
          </div>
        )}

        {/* Shipments table */}
        <div style={{ overflowX: 'auto' }}>
          <table style={{
            width: '100%',
            borderCollapse: 'collapse',
            backgroundColor: '#fff',
            border: '1px solid #ddd'
          }}>
            <thead>
              <tr style={{ backgroundColor: '#f5f5f5', borderBottom: '2px solid #ddd' }}>
                <th style={{
                  padding: '12px',
                  textAlign: 'center',
                  fontWeight: 'bold',
                  borderRight: '1px solid #ddd',
                  width: '50px'
                }}>
                  ☑
                </th>
                <th style={{ padding: '12px', textAlign: 'left', fontWeight: 'bold', borderRight: '1px solid #ddd' }}>
                  IPO
                </th>
                <th style={{ padding: '12px', textAlign: 'left', fontWeight: 'bold', borderRight: '1px solid #ddd' }}>
                  Отправитель
                </th>
                <th style={{ padding: '12px', textAlign: 'left', fontWeight: 'bold', borderRight: '1px solid #ddd' }}>
                  Получатель
                </th>
                <th style={{ padding: '12px', textAlign: 'left', fontWeight: 'bold', borderRight: '1px solid #ddd' }}>
                  Тип
                </th>
                <th style={{ padding: '12px', textAlign: 'left', fontWeight: 'bold', borderRight: '1px solid #ddd' }}>
                  Статус
                </th>
                <th style={{ padding: '12px', textAlign: 'left', fontWeight: 'bold', borderRight: '1px solid #ddd' }}>
                  Дата
                </th>
                <th style={{ padding: '12px', textAlign: 'center', fontWeight: 'bold' }}>
                  Действие
                </th>
              </tr>
            </thead>
            <tbody>
              {filteredShipments.length === 0 ? (
                <tr>
                  <td
                    colSpan="8"
                    style={{
                      padding: '20px',
                      textAlign: 'center',
                      color: '#999'
                    }}
                  >
                    {searchTerm ? 'По вашему запросу ничего не найдено' : 'Нет посылок для выдачи'}
                  </td>
                </tr>
              ) : (
                filteredShipments.map((shipment) => {
                  const isIssueable = canIssueShipment(shipment.shipment_status);
                  
                  return (
                    <tr
                      key={shipment.ipo}
                      style={{
                        borderBottom: '1px solid #eee',
                        backgroundColor: selectedShipments.has(shipment.ipo) ? '#e3f2fd' : 'transparent'
                      }}
                    >
                      <td style={{ padding: '12px', textAlign: 'center', borderRight: '1px solid #eee' }}>
                        {isIssueable ? (
                          <input
                            type="checkbox"
                            checked={selectedShipments.has(shipment.ipo)}
                            onChange={() => handleCheckboxChange(shipment.ipo)}
                          />
                        ) : (
                          <span style={{ color: '#999' }} title="Нельзя выдать">—</span>
                        )}
                      </td>
                      <td style={{ padding: '12px', borderRight: '1px solid #eee', fontWeight: 'bold' }}>
                        {shipment.ipo}
                      </td>
                      <td style={{ padding: '12px', borderRight: '1px solid #eee' }}>
                        {shipment.sender_passport_number}
                      </td>
                      <td style={{ padding: '12px', borderRight: '1px solid #eee' }}>
                        {shipment.receiver_passport_number}
                      </td>
                      <td style={{ padding: '12px', borderRight: '1px solid #eee' }}>
                        {shipment.package_type}
                      </td>
                      <td style={{
                        padding: '12px',
                        borderRight: '1px solid #eee',
                        color: getStatusColor(shipment.shipment_status),
                        fontWeight: 'bold'
                      }}>
                        {shipment.shipment_status}
                        {shipment.shipment_status === 'В пути' && (
                          <span style={{ fontSize: '11px', color: '#999', marginLeft: '5px' }}>
                            (в доставке)
                          </span>
                        )}
                      </td>
                      <td style={{ padding: '12px', borderRight: '1px solid #eee' }}>
                        {shipment.registration_date ? new Date(shipment.registration_date).toLocaleDateString('ru-RU') : '-'}
                      </td>
                      <td style={{ padding: '12px', textAlign: 'center' }}>
                        {isIssueable ? (
                          <Button
                            variant="primary"
                            onClick={() => handleIssueShipment(shipment.ipo)}
                            loading={processingIpo === shipment.ipo}
                            disabled={processingIpo !== null}
                            style={{
                              padding: '6px 12px',
                              fontSize: '12px'
                            }}
                          >
                            Выдать
                          </Button>
                        ) : (
                          <span style={{ 
                            color: '#999', 
                            fontSize: '12px',
                            fontStyle: 'italic'
                          }}>
                            {shipment.shipment_status === 'В пути' ? 'В пути' : 'Недоступно'}
                          </span>
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {filteredShipments.length > 0 && (
          <div style={{ marginTop: '15px', padding: '10px', backgroundColor: '#f5f5f5', borderRadius: '4px', display: 'flex', justifyContent: 'space-between' }}>
            <span>Показано: <strong>{filteredShipments.length}</strong> посылок</span>
            <span style={{ color: '#666' }}>
              Доступно для выдачи: <strong style={{ color: '#FF9800' }}>{issueableShipments.length}</strong>
            </span>
          </div>
        )}
      </main>
      <Footer />
    </div>
  );
};