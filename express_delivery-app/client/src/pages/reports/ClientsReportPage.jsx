import { Header } from '../../components/header/Header';
import { Footer } from '../../components/footer/Footer';
import styles from "./../default.module.css";
import { Loader } from '../../components/ui/Loader/Loader';
import { useAsyncData } from '../../hooks/useAsyncData';
import { getClients, getShipments } from '../../api/axios';
import { useMemo } from 'react';
import { Table } from '../../components/ui/Table/Table';

export const ClientsReportPage = () => {
  const { data: clientsData, loading: clientsLoading, error: clientsError } = useAsyncData(async () => {
    const response = await getClients();
    return response.data;
  }, []);

  const { data: shipmentsData, loading: shipmentsLoading, error: shipmentsError } = useAsyncData(async () => {
    const response = await getShipments();
    return response.data;
  }, []);

  const reportData = useMemo(() => {
    if (!clientsData || !shipmentsData) return [];

    return clientsData.map(client => {
      const sentShipments = shipmentsData.filter(s => s.sender_passport_number === client.passport_number);
      const receivedShipments = shipmentsData.filter(s => s.receiver_passport_number === client.passport_number);

      const sentCount = sentShipments.length;
      const receivedCount = receivedShipments.length;

      const sentTypes = sentShipments.reduce((acc, s) => {
        acc[s.package_type] = (acc[s.package_type] || 0) + 1;
        return acc;
      }, {});

      const receivedTypes = receivedShipments.reduce((acc, s) => {
        acc[s.package_type] = (acc[s.package_type] || 0) + 1;
        return acc;
      }, {});

      return {
        client: `${client.surname} ${client.first_name} ${client.patronymic || ''}`.trim(),
        passport: client.passport_number,
        sentCount,
        receivedCount,
        sentTypes: Object.entries(sentTypes).map(([type, count]) => `${type}: ${count}`).join(', '),
        receivedTypes: Object.entries(receivedTypes).map(([type, count]) => `${type}: ${count}`).join(', ')
      };
    }).filter(item => item.sentCount > 0 || item.receivedCount > 0);
  }, [clientsData, shipmentsData]);

  if (clientsLoading || shipmentsLoading) {
    return (
      <div className={styles.pageWrapper}>
        <Header />
        <main className={styles.content}>
          <Loader />
        </main>
        <Footer />
      </div>
    );
  }

  if (clientsError || shipmentsError) {
    return (
      <div className={styles.pageWrapper}>
        <Header />
        <main className={styles.content}>
          <p>Ошибка загрузки данных</p>
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className={styles.pageWrapper}>
      <Header />
      <main className={styles.content}>
        <h1>Отчет по клиентам</h1>
        <Table
          headers={['Клиент', 'Паспорт', 'Отправлено', 'Получено', 'Типы отправленных', 'Типы полученных']}
          data={reportData}
          renderRow={(item) => [
            item.client,
            item.passport,
            item.sentCount,
            item.receivedCount,
            item.sentTypes,
            item.receivedTypes
          ]}
        />
      </main>
      <Footer />
    </div>
  );
}