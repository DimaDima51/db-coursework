import { Footer } from '../../components/footer/Footer';
import { Header } from '../../components/header/Header';
import { Table } from '../../components/ui/Table/Table';
import { Button } from '../../components/ui/Button/Button';
import { Loader } from '../../components/ui/Loader/Loader';
import { useAsyncData } from '../../hooks/useAsyncData';
import { getPickupPoints, deletePickupPoint } from '../../api/axios';
import { useNavigate } from 'react-router-dom';
import { useState } from 'react';
import styles from "./../default.module.css";

export const PickupPointsPage = () => {
  const navigate = useNavigate();
  const [refreshKey, setRefreshKey] = useState(0);
  const [deletingId, setDeletingId] = useState(null);

  const { data, loading, error } = useAsyncData(async () => {
    const response = await getPickupPoints();
    return response.data;
  }, [refreshKey]);

  const pickupPoints = data ?? [];

  const headers = [
    { key: 'pickup_point_index', label: 'Индекс' },
    { key: 'branch_name', label: 'Название отделения' },
    { key: 'city', label: 'Город' },
    { key: 'address', label: 'Адрес' },
    { key: 'service_windows_count', label: 'Окон обслуживания' },
    { key: 'work_mode', label: 'Режим работы' },
    { key: 'hotline_phone', label: 'Телефон' }
  ];

  const transformedPickupPoints = pickupPoints.map(point => ({
    ...point,
    address: `${point.street}, ${point.house}`,
    accessibility_for_mgn: point.accessibility_for_mgn ? 'Да' : 'Нет'
  }));

  const handleEdit = (pickupPoint) => {
    navigate(`/admin/pickup-points/edit/${pickupPoint.pickup_point_index}`, {
      state: { pickupPoint }
    });
  };

  const handleDelete = async (pickupPoint) => {
    if (!confirm(`Вы уверены, что хотите удалить пункт выдачи "${pickupPoint.branch_name}"?`)) {
      return;
    }

    try {
      setDeletingId(pickupPoint.pickup_point_index);
      await deletePickupPoint(pickupPoint.pickup_point_index);
      setRefreshKey(prev => prev + 1);
    } catch (err) {
      alert(`Ошибка при удалении: ${err.response?.data?.message || err.message}`);
    } finally {
      setDeletingId(null);
    }
  };

  const handleAdd = () => {
    navigate('/admin/pickup-points/create');
  };

  const renderActions = (row) => (
    <div style={{ display: 'flex', gap: '8px', alignItems: 'center', flexWrap: 'nowrap', margin: 0 }}>
      <Button
        variant="secondary"
        onClick={(e) => {
          e.stopPropagation();
          handleEdit(row);
        }}
        style={{ padding: '6px 12px', fontSize: '12px', margin: 0 }}
      >
        ✏️
      </Button>
      <Button
        variant="danger"
        onClick={(e) => {
          e.stopPropagation();
          handleDelete(row);
        }}
        style={{ padding: '6px 12px', fontSize: '12px', margin: 0 }}
        disabled={deletingId === row.pickup_point_index}
      >
        🗑️
      </Button>
    </div>
  );

  if (loading) {
    return (
      <div className={styles.pageWrapper}>
        <Header />
        <main className={styles.content}>
          <h1>Пункты выдачи</h1>
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
          <h1>Пункты выдачи</h1>
          <div className={styles.error}>Загрузка пунктов выдачи не удалась. Пожалуйста, попробуйте позже.</div>
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className={styles.pageWrapper}>
      <Header />
      <main className={styles.content}>
        <div
          className={styles.pageHeader}
          style={{
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            position: 'relative',
            width: '100%'
          }}
        >
          <h2 style={{ margin: 0 }}>Пункты выдачи</h2>

          <div style={{
            position: 'absolute',
            left: 'calc(50% + 150px)'
          }}>
            <Button variant="primary" onClick={handleAdd}>
              Добавить пункт выдачи
            </Button>
          </div>
        </div>
        <Table
          headers={headers}
          data={transformedPickupPoints}
          emptyMessage="Пункты выдачи не найдены"
          actions={renderActions}
        />
      </main>
      <Footer />
    </div>
  );


};