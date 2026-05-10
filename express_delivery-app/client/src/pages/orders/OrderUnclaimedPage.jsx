import { Header } from '../../components/header/Header';
import { Footer } from '../../components/footer/Footer';
import styles from "./../default.module.css";
import { Button } from '../../components/ui/Button/Button';
import { Loader } from '../../components/ui/Loader/Loader';
import { useAsyncData } from '../../hooks/useAsyncData';
import { getUnclaimedShipments } from '../../api/axios';
import { useState } from 'react';
import tableStyles from './OrderUnclaimedPage.module.css';

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

  const unclaimedShipments = shipments.filter(s => s.shipment_status === 'Не востребована');
  const utilizedShipments = shipments.filter(s => s.shipment_status === 'Утилизирована');

  const renderShipmentTable = (items, title, icon, variant) => {
    if (items.length === 0) {
      return null;
    }

    return (
      <div className={tableStyles.tableSection}>
        <h3 className={tableStyles.tableTitle}>
          {icon} {title} ({items.length})
        </h3>
        <div className={tableStyles.tableWrapper}>
          <table className={tableStyles.table}>
            <thead>
              <tr>
                <th className={tableStyles.th}>IPO</th>
                <th className={tableStyles.th}>Получатель</th>
                <th className={tableStyles.th}>Тип</th>
                <th className={tableStyles.th}>Дата регистрации</th>
                <th className={`${tableStyles.th} ${tableStyles.thCenter}`}>Дней ждёт</th>
                <th className={tableStyles.th}>Статус</th>
              </tr>
            </thead>
            <tbody>
              {items.map((shipment) => {
                const daysOld = getDaysOld(shipment.registration_date);
                const isOverdue30 = daysOld > 30 && variant === 'unclaimed';
                
                return (
                  <tr
                    key={shipment.ipo}
                    className={`${tableStyles.tr} ${isOverdue30 ? tableStyles.overdue : ''}`}
                  >
                    <td className={`${tableStyles.td} ${tableStyles.tdBold}`}>
                      {shipment.ipo}
                    </td>
                    <td className={tableStyles.td}>
                      {shipment.receiver_passport_number || '-'}
                    </td>
                    <td className={tableStyles.td}>
                      {shipment.package_type || '-'}
                    </td>
                    <td className={tableStyles.td}>
                      {shipment.registration_date ? new Date(shipment.registration_date).toLocaleDateString('ru-RU') : '-'}
                    </td>
                    <td className={`${tableStyles.td} ${tableStyles.tdCenter} ${tableStyles.tdBold}`}>
                      <span className={isOverdue30 ? tableStyles.daysOverdue : tableStyles.daysNormal}>
                        {daysOld} дней
                      </span>
                      {isOverdue30 && (
                        <span className={tableStyles.overdueBadge}>(30+ дн.)</span>
                      )}
                    </td>
                    <td 
                      className={`${tableStyles.td} ${tableStyles.tdBold}`}
                      style={{ color: getStatusColor(shipment.shipment_status) }}
                    >
                      {shipment.shipment_status === 'Утилизирована' && '⚠️ '}
                      {shipment.shipment_status}
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

        <div className={tableStyles.statsGrid}>
          <div className={`${tableStyles.statCard} ${tableStyles.statCardWarning}`}>
            <div className={tableStyles.statLabel}>Невостребованные</div>
            <div className={`${tableStyles.statValue} ${tableStyles.statValueWarning}`}>
              {unclaimedShipments.length}
            </div>
          </div>
          <div className={`${tableStyles.statCard} ${tableStyles.statCardMuted}`}>
            <div className={tableStyles.statLabel}>Утилизированные</div>
            <div className={`${tableStyles.statValue} ${tableStyles.statValueMuted}`}>
              {utilizedShipments.length}
            </div>
          </div>
          <div className={`${tableStyles.statCard} ${tableStyles.statCardInfo}`}>
            <div className={tableStyles.statLabel}>Всего</div>
            <div className={`${tableStyles.statValue} ${tableStyles.statValueInfo}`}>
              {shipments.length}
            </div>
          </div>
        </div>

        <div className={tableStyles.infoBox}>
          <span className={tableStyles.infoIcon}>ℹ️</span>
          <span>Отправления со статусом "Невостребована" более 30 дней автоматически переводятся в статус "Утилизирована"</span>
        </div>

        {shipments.length === 0 ? (
          <div className={tableStyles.emptyState}>
            <p className={tableStyles.emptyTitle}>✓ Все хорошо!</p>
            <p>Невостребованных отправлений нет</p>
          </div>
        ) : (
          <>
            {renderShipmentTable(unclaimedShipments, 'Невостребованные посылки', '🕐', 'unclaimed')}
            {renderShipmentTable(utilizedShipments, 'Утилизированные посылки', '♻️', 'utilized')}
          </>
        )}
      </main>
      <Footer />
    </div>
  );
};