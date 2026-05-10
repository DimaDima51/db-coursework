import { Header } from '../../components/header/Header';
import { Footer } from '../../components/footer/Footer';
import styles from "./../default.module.css";
import { Table } from '../../components/ui/Table/Table';
import { Button } from '../../components/ui/Button/Button';
import { Loader } from '../../components/ui/Loader/Loader';
import { useAsyncData } from '../../hooks/useAsyncData';
import { getDemandedShipments } from '../../api/axios';
import { useNavigate } from 'react-router-dom';
import { useState } from 'react';

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
  const [refreshKey, setRefreshKey] = useState(0);
  
  const { data, loading, error } = useAsyncData(async () => {
    const response = await getDemandedShipments();
    return response.data;
  }, [refreshKey]);

  const shipments = data ?? [];

  const headers = [
    { key: 'ipo', label: 'IPO' },
    { key: 'senderName', label: 'Отправитель' },
    { key: 'receiverName', label: 'Получатель' },
    { key: 'package_type', label: 'Тип' },
    { key: 'status', label: 'Статус' },
    { key: 'registration_date', label: 'Дата' },
    { key: 'total_payable', label: 'Сумма (руб.)' }
  ];

  // Трансформируем данные для таблицы
  const transformedShipments = shipments.map(shipment => ({
    ipo: shipment.ipo || '',
    senderName: `Отправитель ${shipment.sender_passport_number}`,
    receiverName: `Получатель ${shipment.receiver_passport_number}`,
    package_type: shipment.package_type || '-',
    status: shipment.shipment_status || 'Неизвестно',
    registration_date: shipment.registration_date ? new Date(shipment.registration_date).toLocaleDateString('ru-RU') : '-',
    total_payable: `${parseFloat(shipment.total_payable).toFixed(2)} ₽`,
    _original: shipment
  }));

  const handleViewDetails = (shipment) => {
    // Navigate to details or edit page if needed
    alert(`Отправление: ${shipment._original.ipo}\nСтатус: ${shipment._original.shipment_status}`);
  };

  const renderActions = (row) => (
    <div style={{ display: 'flex', gap: '8px', alignItems: 'center', flexWrap: 'nowrap', margin: 0 }}>
      <Button 
        variant="secondary" 
        onClick={(e) => {
          e.stopPropagation();
          handleViewDetails(row);
        }}
        style={{ padding: '6px 12px', fontSize: '12px', margin: 0 }}
      >
        👁️
      </Button>
    </div>
  );

  // Custom render for status with color
  const renderRow = (row) => {
    return (
      <tr key={row.ipo}>
        {headers.map(header => (
          <td 
            key={`${row.ipo}-${header.key}`}
            style={header.key === 'status' ? { 
              color: getStatusColor(row[header.key]),
              fontWeight: 'bold'
            } : {}}
          >
            {row[header.key]}
          </td>
        ))}
        <td>{renderActions(row)}</td>
      </tr>
    );
  };

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
          <Button 
            variant="primary" 
            onClick={() => navigate('/orders/create')}
            style={{ marginLeft: 'auto' }}
          >
            ➕ Создать отправление
          </Button>
        </div>

        <div style={{ overflowX: 'auto' }}>
          <table style={{ 
            width: '100%', 
            borderCollapse: 'collapse',
            backgroundColor: '#fff',
            border: '1px solid #ddd'
          }}>
            <thead>
              <tr style={{ backgroundColor: '#f5f5f5', borderBottom: '2px solid #ddd' }}>
                {headers.map(header => (
                  <th 
                    key={header.key}
                    style={{ 
                      padding: '12px', 
                      textAlign: 'left',
                      fontWeight: 'bold',
                      borderRight: '1px solid #ddd'
                    }}
                  >
                    {header.label}
                  </th>
                ))}
                <th style={{ padding: '12px', textAlign: 'center', fontWeight: 'bold' }}>
                  Действия
                </th>
              </tr>
            </thead>
            <tbody>
              {shipments.length === 0 ? (
                <tr>
                  <td 
                    colSpan={headers.length + 1}
                    style={{ 
                      padding: '20px', 
                      textAlign: 'center', 
                      color: '#999'
                    }}
                  >
                    Отправления не найдены
                  </td>
                </tr>
              ) : (
                transformedShipments.map((shipment) => (
                  <tr 
                    key={shipment.ipo}
                    style={{ 
                      borderBottom: '1px solid #eee',
                      '&:hover': { backgroundColor: '#f9f9f9' }
                    }}
                  >
                    {headers.map(header => (
                      <td 
                        key={`${shipment.ipo}-${header.key}`}
                        style={{
                          padding: '12px',
                          borderRight: '1px solid #eee',
                          color: header.key === 'status' ? getStatusColor(shipment[header.key]) : 'inherit',
                          fontWeight: header.key === 'status' ? 'bold' : 'normal'
                        }}
                      >
                        {shipment[header.key]}
                      </td>
                    ))}
                    <td style={{ padding: '12px', textAlign: 'center' }}>
                      {renderActions(shipment)}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {shipments.length > 0 && (
          <div style={{ marginTop: '15px', padding: '10px', backgroundColor: '#f5f5f5', borderRadius: '4px' }}>
            Всего отправлений: <strong>{shipments.length}</strong>
          </div>
        )}
      </main>
      <Footer />
    </div>
  );
};
