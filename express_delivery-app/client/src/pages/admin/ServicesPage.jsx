import { Footer } from '../../components/footer/Footer';
import { Header } from '../../components/header/Header';
import { Table } from '../../components/ui/Table/Table';
import { Button } from '../../components/ui/Button/Button';
import { Loader } from '../../components/ui/Loader/Loader';
import { useAsyncData } from '../../hooks/useAsyncData';
import { getServices, deleteService } from '../../api/axios';
import { useNavigate } from 'react-router-dom';
import { useState } from 'react';
import styles from "./../default.module.css";

export const ServicesPage = () => {
  const navigate = useNavigate();
  const [refreshKey, setRefreshKey] = useState(0);
  const [deletingId, setDeletingId] = useState(null);

  const { data, loading, error } = useAsyncData(async () => {
    const response = await getServices();
    return response.data;
  }, [refreshKey]);

  const services = data ?? [];

  const headers = [
    { key: 'service_name', label: 'Название услуги' },
    { key: 'service_category', label: 'Категория' }
  ];

  const handleEdit = (service) => {
    navigate(`/admin/services/edit/${encodeURIComponent(service.service_name)}`, {
      state: { service }
    });
  };

  const handleDelete = async (service) => {
    if (!confirm(`Вы уверены, что хотите удалить услугу "${service.service_name}"?`)) {
      return;
    }

    try {
      setDeletingId(service.service_name);
      await deleteService(service.service_name);
      setRefreshKey(prev => prev + 1);
    } catch (err) {
      alert(`Ошибка при удалении: ${err.response?.data?.message || err.message}`);
    } finally {
      setDeletingId(null);
    }
  };

  const handleAdd = () => {
    navigate('/admin/services/create');
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
        disabled={deletingId === row.service_name}
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
          <h1>Услуги</h1>
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
          <h1>Услуги</h1>
          <div className={styles.error}>Загрузка услуг не удалась. Пожалуйста, попробуйте позже.</div>
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
          <h2>Услуги</h2>
          <Button variant="primary" onClick={handleAdd}>
            Добавить услугу
          </Button>
        </div>
        <Table
          headers={headers}
          data={services}
          emptyMessage="Услуги не найдены"
          actions={renderActions}
        />
      </main>
      <Footer />
    </div>
  );
};