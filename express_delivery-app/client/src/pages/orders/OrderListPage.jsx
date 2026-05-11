import { Header } from '../../components/header/Header';
import { Footer } from '../../components/footer/Footer';
import styles from "./../default.module.css";
import { Input } from '../../components/ui/Input/Input';
import { Button } from '../../components/ui/Button/Button';
import { Loader } from '../../components/ui/Loader/Loader';
import { useAsyncData } from '../../hooks/useAsyncData';
import { getDemandedShipments } from '../../api/axios';
import { useNavigate } from 'react-router-dom';
import { useState, useMemo } from 'react';
import { useAuth } from '../../auth/AuthProvider';
import tableStyles from './OrderListPage.module.css';

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

export const OrderListPage = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [refreshKey, setRefreshKey] = useState(0);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedShipments, setSelectedShipments] = useState(new Set());
  
  const { data, loading, error } = useAsyncData(async () => {
    const response = await getDemandedShipments();
    return response.data;
  }, [refreshKey]);

  const shipments = data ?? [];

  const filteredShipments = useMemo(() => {
    return shipments.filter(shipment => {
      if (!searchTerm) return true;
      
      const searchLower = searchTerm.toLowerCase();
      return (
        shipment.ipo.toLowerCase().includes(searchLower) ||
        shipment.sender_passport_number?.toLowerCase().includes(searchLower) ||
        shipment.receiver_passport_number?.toLowerCase().includes(searchLower) ||
        shipment.shipment_status?.toLowerCase().includes(searchLower) ||
        shipment.package_type?.toLowerCase().includes(searchLower)
      );
    });
  }, [shipments, searchTerm]);

  const handleCheckboxChange = (ipo) => {
    const newSelected = new Set(selectedShipments);
    if (newSelected.has(ipo)) {
      newSelected.delete(ipo);
    } else {
      newSelected.add(ipo);
    }
    setSelectedShipments(newSelected);
  };

  const handleSelectAll = () => {
    if (selectedShipments.size === filteredShipments.length) {
      setSelectedShipments(new Set());
    } else {
      const all = new Set(filteredShipments.map(s => s.ipo));
      setSelectedShipments(all);
    }
  };

  const handleViewDetails = (shipment) => {
    alert(`Отправление: ${shipment.ipo}\nСтатус: ${shipment.shipment_status}`);
  };

  const handleBulkAction = () => {
    if (selectedShipments.size === 0) {
      alert('Выберите хотя бы одно отправление');
      return;
    }
    alert(`Выбрано ${selectedShipments.size} отправлений для действия`);
  };

  const transformedShipments = filteredShipments.map(shipment => ({
    ipo: shipment.ipo || '',
    senderName: shipment.sender_passport_number || '-',
    receiverName: shipment.receiver_passport_number || '-',
    package_type: shipment.package_type || '-',
    status: shipment.shipment_status || 'Неизвестно',
    registration_date: shipment.registration_date ? new Date(shipment.registration_date).toLocaleDateString('ru-RU') : '-',
    total_payable: `${parseFloat(shipment.total_payable || 0).toFixed(2)} ₽`,
    _original: shipment
  }));

  const headers = [
    { key: 'ipo', label: 'IPO' },
    { key: 'senderName', label: 'Отправитель' },
    { key: 'receiverName', label: 'Получатель' },
    { key: 'package_type', label: 'Тип' },
    { key: 'status', label: 'Статус' },
    { key: 'registration_date', label: 'Дата' },
    { key: 'total_payable', label: 'Сумма (руб.)' }
  ];

  if (loading) {
    return (
      <div className={styles.pageWrapper}>
        <Header />
        <main className={styles.content}>
          <h1>Список востребованных отправлений</h1>
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
          <h1>Список востребованных отправлений</h1>
          <div className={styles.error}>Загрузка отправлений не удалась. Пожалуйста, попробуйте позже.</div>
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
          <h2>Список востребованных отправлений</h2>
          {user?.position_name !== 'Курьер' && (
            <Button 
              variant="primary" 
              onClick={() => navigate('/orders/create')}
              style={{ marginLeft: 'auto' }}
            >
              ➕ Создать отправление
            </Button>
          )}
        </div>

        <div style={{ marginBottom: '20px', padding: '15px', backgroundColor: '#1a1a1a', borderRadius: '4px' }}>
          <Input
            label="Поиск по IPO, паспорту или статусу"
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Введите IPO, номер паспорта, статус или тип..."
          />
          <div style={{ marginTop: '10px', color: '#777', fontSize: '14px' }}>
            Найдено отправлений: <strong>{filteredShipments.length}</strong>
            {searchTerm && shipments.length !== filteredShipments.length && (
              <span> (из {shipments.length})</span>
            )}
          </div>
        </div>

        {filteredShipments.length > 0 && (
          <div style={{ marginBottom: '20px', display: 'flex', gap: '10px', alignItems: 'center' }}>
            <label style={{ display: 'flex', alignItems: 'center', cursor: 'pointer', gap: '8px' }}>
              <input
                type="checkbox"
                checked={selectedShipments.size === filteredShipments.length && filteredShipments.length > 0}
                onChange={handleSelectAll}
              />
              <span>Выбрать все ({filteredShipments.length})</span>
            </label>
            {selectedShipments.size > 0 && (
              <>
                <span style={{ color: '#777' }}>|</span>
                <span>Выбрано: <strong>{selectedShipments.size}</strong></span>
                <Button 
                  variant="primary"
                  onClick={handleBulkAction}
                  style={{ marginLeft: 'auto' }}
                >
                  Действие с выбранными ({selectedShipments.size})
                </Button>
              </>
            )}
          </div>
        )}

        <div className={tableStyles.tableWrapper}>
          <table className={tableStyles.table}>
            <thead>
              <tr>
                <th className={tableStyles.th} style={{ width: '50px', textAlign: 'center' }}>
                  <input
                    type="checkbox"
                    checked={selectedShipments.size === filteredShipments.length && filteredShipments.length > 0}
                    onChange={handleSelectAll}
                  />
                </th>
                {headers.map(header => (
                  <th key={header.key} className={tableStyles.th}>
                    {header.label}
                  </th>
                ))}
                <th className={tableStyles.th} style={{ textAlign: 'center' }}>
                  Действия
                </th>
              </tr>
            </thead>
            <tbody>
              {transformedShipments.length === 0 ? (
                <tr>
                  <td colSpan={headers.length + 2} className={tableStyles.empty}>
                    {searchTerm ? 'По вашему запросу ничего не найдено' : 'Отправления не найдены'}
                  </td>
                </tr>
              ) : (
                transformedShipments.map((shipment) => (
                  <tr 
                    key={shipment.ipo}
                    className={`${tableStyles.tr} ${selectedShipments.has(shipment.ipo) ? tableStyles.selected : ''}`}
                  >
                    <td className={tableStyles.td} style={{ textAlign: 'center' }}>
                      <input
                        type="checkbox"
                        checked={selectedShipments.has(shipment.ipo)}
                        onChange={() => handleCheckboxChange(shipment.ipo)}
                      />
                    </td>
                    {headers.map(header => (
                      <td 
                        key={`${shipment.ipo}-${header.key}`}
                        className={tableStyles.td}
                        style={{
                          color: header.key === 'status' ? getStatusColor(shipment[header.key]) : undefined,
                          fontWeight: header.key === 'status' || header.key === 'ipo' ? 'bold' : 'normal'
                        }}
                      >
                        {shipment[header.key]}
                      </td>
                    ))}
                    <td className={tableStyles.td}>
                      <div className={tableStyles.actions}>
                        <Button 
                          variant="secondary" 
                          onClick={(e) => {
                            e.stopPropagation();
                            handleViewDetails(shipment._original);
                          }}
                          style={{ padding: '6px 12px', fontSize: '12px', margin: 0 }}
                        >
                          👁️
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {filteredShipments.length > 0 && (
          <div style={{ 
            marginTop: '15px', 
            padding: '15px', 
            backgroundColor: 'rgba(0, 123, 255, 0.05)', 
            borderRadius: '8px', 
            display: 'flex', 
            justifyContent: 'space-between',
            alignItems: 'center',
            fontSize: '14px',
            color: '#777'
          }}>
            <span>
              Показано: <strong>{filteredShipments.length}</strong> отправлений
              {searchTerm && shipments.length !== filteredShipments.length && (
                <span> (из {shipments.length})</span>
              )}
            </span>
            {selectedShipments.size > 0 && (
              <span style={{ color: '#2196F3' }}>
                Выбрано: <strong>{selectedShipments.size}</strong>
              </span>
            )}
          </div>
        )}
      </main>
      <Footer />
    </div>
  );
};