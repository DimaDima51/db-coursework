import { Footer } from '../../components/footer/Footer';
import { Header } from '../../components/header/Header';
import { Table } from '../../components/ui/Table/Table';
import { Button } from '../../components/ui/Button/Button';
import { Loader } from '../../components/ui/Loader/Loader';
import { useAsyncData } from '../../hooks/useAsyncData';
import { getEmployees, deleteEmployee } from '../../api/axios';
import { useNavigate } from 'react-router-dom';
import { useState } from 'react';
import styles from './../default.module.css';

export const EmployeesPage = () => {
  const navigate = useNavigate();
  const [refreshKey, setRefreshKey] = useState(0);
  const [deletingId, setDeletingId] = useState(null);

  const { data, loading, error } = useAsyncData(async () => {
    const response = await getEmployees();
    return response.data;
  }, [refreshKey]);

  const employees = data ?? [];

  const headers = [
    { key: 'staff_number', label: 'Табельный номер' },
    { key: 'fullName', label: 'ФИО' },
    { key: 'pickup_point_index', label: 'Подразделение' },
    { key: 'position_name', label: 'Должность' },
    { key: 'allowance', label: 'Надбавка' },
    { key: 'note', label: 'Примечание' }
  ];

  const transformedEmployees = employees.map(employee => ({
    staff_number: employee.staff_number || '',
    fullName: `${employee.surname} ${employee.first_name} ${employee.patronymic || ''}`.trim(),
    pickup_point_index: employee.pickup_point_index || '-',
    position_name: employee.position_name || '-',
    allowance: employee.allowance != null ? employee.allowance.toString() : '-',
    note: employee.note || '-',
    _original: employee // Сохраняем исходные данные
  }));

  const handleEdit = (employee) => {
    navigate(`/employees/edit/${employee.staff_number}`, { state: { employee: employee._original } });
  };

  const handleDelete = async (employee) => {
    if (!confirm(`Вы уверены, что хотите удалить сотрудника ${employee.fullName}?`)) {
      return;
    }

    try {
      setDeletingId(employee.staff_number);
      await deleteEmployee(employee.staff_number);
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
          <h1>Сотрудники</h1>
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
          <h1>Сотрудники</h1>
          <div className={styles.error}>Загрузка сотрудников не удалась. Пожалуйста, попробуйте позже.</div>
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
          <h2>Сотрудники</h2>
        </div>
        <Table 
          headers={headers} 
          data={transformedEmployees} 
          emptyMessage="Сотрудники не найдены"
          actions={renderActions}
        />
      </main>
      <Footer />
    </div>
  );
};
