import { Footer } from '../../components/footer/Footer';
import { Header } from '../../components/header/Header';
import { Table } from '../../components/ui/Table/Table';
import { Button } from '../../components/ui/Button/Button';
import { Loader } from '../../components/ui/Loader/Loader';
import { useAsyncData } from '../../hooks/useAsyncData';
import { getTariffs, deleteTariff } from '../../api/axios';
import { useNavigate } from 'react-router-dom';
import { useState } from 'react';
import styles from "./../default.module.css";

const formatDateForDisplay = (dateString) => {
  if (!dateString) return '';
  
  const date = new Date(dateString);
  if (!isNaN(date.getTime())) {
    return date.toLocaleDateString('ru-RU');
  }
  
  return dateString;
};

export const TariffsPage = () => {
  const navigate = useNavigate();
  const [refreshKey, setRefreshKey] = useState(0);
  const [deletingId, setDeletingId] = useState(null);
  
  const { data, loading, error } = useAsyncData(async () => {
    const response = await getTariffs();
    return response.data;
  }, [refreshKey]);

  const tariffs = data ?? [];

  const headers = [
    { key: 'tariff_code', label: 'Код тарифа' },
    { key: 'tariff_up_to_500g', label: 'До 500г (₽)' },
    { key: 'tariff_up_to_1kg', label: 'До 1кг (₽)' },
    { key: 'additional_500g_charge', label: 'За каждые 500г (₽)' },
    { key: 'oversize_surcharge', label: 'Надбавка (Сверхгабарит) (₽)' },
    { key: 'careful_surcharge', label: 'Надбавка (Осторожно) (₽)' },
    { key: 'max_weight', label: 'Макс. вес (кг)' },
    { key: 'tariff_start_date', label: 'Дата начала' }
  ];

  // Форматируем дату и числа для отображения
  const transformedTariffs = tariffs.map(tariff => ({
    ...tariff,
    tariff_up_to_500g: Number(tariff.tariff_up_to_500g).toFixed(2),
    tariff_up_to_1kg: Number(tariff.tariff_up_to_1kg).toFixed(2),
    additional_500g_charge: Number(tariff.additional_500g_charge).toFixed(2),
    oversize_surcharge: Number(tariff.oversize_surcharge).toFixed(2),
    careful_surcharge: Number(tariff.careful_surcharge).toFixed(2),
    max_weight: Number(tariff.max_weight).toFixed(2),
    tariff_start_date: formatDateForDisplay(tariff.tariff_start_date)
  }));

  const handleEdit = (tariff) => {
    navigate(`/admin/tariffs/edit/${tariff.tariff_code}`, { 
      state: { tariff } 
    });
  };

  const handleDelete = async (tariff) => {
    if (!confirm(`Вы уверены, что хотите удалить тариф с кодом ${tariff.tariff_code}?`)) {
      return;
    }

    try {
      setDeletingId(tariff.tariff_code);
      await deleteTariff(tariff.tariff_code);
      setRefreshKey(prev => prev + 1);
    } catch (err) {
      alert(`Ошибка при удалении: ${err.response?.data?.message || err.message}`);
    } finally {
      setDeletingId(null);
    }
  };

  const handleAdd = () => {
    navigate('/admin/tariffs/create');
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
        disabled={deletingId === row.tariff_code}
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
          <h1>Тарифы</h1>
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
          <h1>Тарифы</h1>
          <div className={styles.error}>Загрузка тарифов не удалась. Пожалуйста, попробуйте позже.</div>
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
          <h2>Тарифы</h2>
          <Button variant="primary" onClick={handleAdd}>
            Добавить тариф
          </Button>
        </div>
        <Table 
          headers={headers} 
          data={transformedTariffs} 
          emptyMessage="Тарифы не найдены"
          actions={renderActions}
        />
      </main>
      <Footer />
    </div>
  );
};