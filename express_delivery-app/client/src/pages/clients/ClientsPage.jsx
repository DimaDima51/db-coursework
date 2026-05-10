import { Footer } from '../../components/footer/Footer';
import { Header } from '../../components/header/Header';
import { Table } from '../../components/ui/Table/Table';
import { Button } from '../../components/ui/Button/Button';
import { Loader } from '../../components/ui/Loader/Loader';
import { useAsyncData } from '../../hooks/useAsyncData';
import { getClients, deleteClient } from '../../api/axios';
import { useNavigate } from 'react-router-dom';
import { useState } from 'react';
import styles from "./../default.module.css";

export const ClientsPage = () => {
  const navigate = useNavigate();
  const [refreshKey, setRefreshKey] = useState(0);
  const [deletingId, setDeletingId] = useState(null);
  
  const { data, loading, error } = useAsyncData(async () => {
    const response = await getClients();
    return response.data;
  }, [refreshKey]);

  const clients = data ?? [];

  // Определяем заголовки и ключи для маппинга
  const headers = [
    { key: 'passport_number', label: 'Паспорт' },
    { key: 'fullName', label: 'ФИО' },
    { key: 'phone', label: 'Телефон' },
    { key: 'email', label: 'e-mail' },
    { key: 'address', label: 'Адрес' }
  ];

  // Трансформируем данные клиентов для отображения
  const transformedClients = clients.map(client => ({
    passport_number: client.passport_number || '',
    fullName: `${client.surname} ${client.first_name} ${client.patronymic || ''}`.trim(),
    phone: client.phone || '-',
    email: client.email || '-',
    address: `${client.street}, ${client.house}, ${client.city}, ${client.region}, ${client.postal_index}`,
    _original: client // Сохраняем исходные данные
  }));

  const handleEdit = (client) => {
    navigate(`/clients/edit/${client.passport_number}`, { state: { client: client._original } });
  };

  const handleDelete = async (client) => {
    if (!confirm(`Вы уверены, что хотите удалить клиента ${client.fullName}?`)) {
      return;
    }

    try {
      setDeletingId(client.passport_number);
      await deleteClient(client.passport_number);
      setRefreshKey(prev => prev + 1); // Обновляем список
    } catch (err) {
      alert(`Ошибка при удалении: ${err.response?.data?.message || err.message}`);
    } finally {
      setDeletingId(null);
    }
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
          <h1>Клиенты</h1>
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
          <h1>Клиенты</h1>
          <div className={styles.error}>Загрузка клиентов не удалась. Пожалуйста, попробуйте позже.</div>
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
          <h2>Клиенты</h2>
        </div>
        <Table 
          headers={headers} 
          data={transformedClients} 
          emptyMessage="Клиенты не найдены"
          actions={renderActions}
        />
      </main>
      <Footer />
    </div>
  );
};