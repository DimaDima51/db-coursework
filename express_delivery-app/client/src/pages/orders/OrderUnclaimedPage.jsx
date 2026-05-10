import { Header } from '../../components/header/Header';
import { Footer } from '../../components/footer/Footer';
import styles from "./../default.module.css";
import { Button } from '../../components/ui/Button/Button';
import { Loader } from '../../components/ui/Loader/Loader';
import { useAsyncData } from '../../hooks/useAsyncData';
import { getUnclaimedShipments } from '../../api/axios';
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

const getDaysOld = (dateStr) => {
  const registrationDate = new Date(dateStr);
  const today = new Date();
  const diffMs = today - registrationDate;
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
  return diffDays;
};

export const OrderUnclaimedPage = () => {
  const [refreshKey, setRefreshKey] = useState(0);

  const { data, loading, error } = useAsyncData(async () => {
    const response = await getUnclaimedShipments();
    return response.data;
  }, [refreshKey]);

  const shipments = data ?? [];

  // Separate unclaimed and utilized shipments
  const unclaimedShipments = shipments.filter(s => s.shipment_status === 'Не востребована');
  const utilizedShipments = shipments.filter(s => s.shipment_status === 'Утилизирована');

  const renderShipmentTable = (items, title) => {
    if (items.length === 0) {
      return null;
    }

    return (
      <div style={{ marginBottom: '30px' }}>
        <h3 style={{ marginBottom: '15px', color: '#333' }}>
          {title} ({items.length})
        </h3>
        <div style={{ overflowX: 'auto' }}>
          <table style={{
            width: '100%',
            borderCollapse: 'collapse',
            backgroundColor: '#fff',
            border: '1px solid #ddd'
          }}>
            <thead>
              <tr style={{ backgroundColor: '#f5f5f5', borderBottom: '2px solid #ddd' }}>
                <th style={{ padding: '12px', textAlign: 'left', fontWeight: 'bold', borderRight: '1px solid #ddd' }}>
                  IPO
                </th>
                <th style={{ padding: '12px', textAlign: 'left', fontWeight: 'bold', borderRight: '1px solid #ddd' }}>
                  Получатель
                </th>
                <th style={{ padding: '12px', textAlign: 'left', fontWeight: 'bold', borderRight: '1px solid #ddd' }}>
                  Тип
                </th>
                <th style={{ padding: '12px', textAlign: 'left', fontWeight: 'bold', borderRight: '1px solid #ddd' }}>
                  Дата регистрации
                </th>
                <th style={{ padding: '12px', textAlign: 'center', fontWeight: 'bold', borderRight: '1px solid #ddd' }}>
                  Дней ждёт
                </th>
                <th style={{ padding: '12px', textAlign: 'left', fontWeight: 'bold' }}>
                  Статус
                </th>
              </tr>
            </thead>
            <tbody>
              {items.map((shipment) => {
                const daysOld = getDaysOld(shipment.registration_date);
                return (
                  <tr
                    key={shipment.ipo}
                    style={{
                      borderBottom: '1px solid #eee',
                      backgroundColor: daysOld > 30 ? '#ffebee' : 'transparent'
                    }}
                  >
                    <td style={{ padding: '12px', borderRight: '1px solid #eee', fontWeight: 'bold' }}>
                      {shipment.ipo}
                    </td>
                    <td style={{ padding: '12px', borderRight: '1px solid #eee' }}>
                      {shipment.receiver_passport_number}
                    </td>
                    <td style={{ padding: '12px', borderRight: '1px solid #eee' }}>
                      {shipment.package_type}
                    </td>
                    <td style={{ padding: '12px', borderRight: '1px solid #eee' }}>
                      {shipment.registration_date ? new Date(shipment.registration_date).toLocaleDateString('ru-RU') : '-'}
                    </td>
                    <td style={{
                      padding: '12px',
                      textAlign: 'center',
                      borderRight: '1px solid #eee',
                      fontWeight: 'bold',
                      color: daysOld > 30 ? '#d32f2f' : '#666'
                    }}>
                      {daysOld} дней
                      {daysOld > 30 && <span style={{ display: 'block', fontSize: '11px', color: '#d32f2f' }}>(30+ дн.)</span>}
                    </td>
                    <td style={{
                      padding: '12px',
                      color: getStatusColor(shipment.shipment_status),
                      fontWeight: 'bold'
                    }}>
                      {shipment.shipment_status === 'Утилизирована' && '⚠️ '}{shipment.shipment_status}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    );
  };

  if (loading) {
    return (
      <div className={styles.pageWrapper}>
        <Header />
        <main className={styles.content}>
          <h1>Невостребованные отправления</h1>
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
          <h1>Невостребованные отправления</h1>
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
          <h2>Невостребованные отправления</h2>
          <Button 
            variant="secondary" 
            onClick={() => setRefreshKey(prev => prev + 1)}
            style={{ marginLeft: 'auto' }}
          >
            🔄 Обновить
          </Button>
        </div>

        {/* Summary */}
        <div style={{
          marginBottom: '20px',
          padding: '15px',
          backgroundColor: '#fff3e0',
          border: '1px solid #ffb74d',
          borderRadius: '4px',
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
          gap: '15px'
        }}>
          <div>
            <div style={{ fontSize: '12px', color: '#666', marginBottom: '5px' }}>Невостребованные</div>
            <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#f57c00' }}>
              {unclaimedShipments.length}
            </div>
          </div>
          <div>
            <div style={{ fontSize: '12px', color: '#666', marginBottom: '5px' }}>Утилизированные</div>
            <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#9e9e9e' }}>
              {utilizedShipments.length}
            </div>
          </div>
          <div>
            <div style={{ fontSize: '12px', color: '#666', marginBottom: '5px' }}>Всего</div>
            <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#333' }}>
              {shipments.length}
            </div>
          </div>
        </div>

        {/* Info box */}
        <div style={{
          marginBottom: '20px',
          padding: '12px',
          backgroundColor: '#e3f2fd',
          border: '1px solid #90caf9',
          borderRadius: '4px',
          fontSize: '14px',
          color: '#1565c0'
        }}>
          ℹ️ Отправления со статусом "Невостребована" более 30 дней автоматически переводятся в статус "Утилизирована"
        </div>

        {/* Tables */}
        {shipments.length === 0 ? (
          <div style={{
            padding: '40px',
            textAlign: 'center',
            backgroundColor: '#f5f5f5',
            borderRadius: '4px',
            color: '#999'
          }}>
            <p style={{ fontSize: '18px', marginBottom: '10px' }}>✓ Все хорошо!</p>
            <p>Невостребованных отправлений нет</p>
          </div>
        ) : (
          <>
            {renderShipmentTable(unclaimedShipments, '🕐 Невостребованные посылки')}
            {renderShipmentTable(utilizedShipments, '♻️ Утилизированные посылки')}
          </>
        )}
      </main>
      <Footer />
    </div>
  );
}