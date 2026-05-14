import { Header } from '../../components/header/Header';
import { Footer } from '../../components/footer/Footer';
import styles from "./../default.module.css";
import { Loader } from '../../components/ui/Loader/Loader';
import { useAsyncData } from '../../hooks/useAsyncData';
import { getShipments, getPickupPoints } from '../../api/axios';
import { useMemo } from 'react';
import { Table } from '../../components/ui/Table/Table';

export const AnalyticReportPage = () => {
  const { data: shipmentsData, loading: shipmentsLoading, error: shipmentsError } = useAsyncData(async () => {
    const response = await getShipments();
    return response.data;
  }, []);

  const { data: pickupPointsData, loading: pickupPointsLoading, error: pickupPointsError } = useAsyncData(async () => {
    const response = await getPickupPoints();
    return response.data;
  }, []);

  const reportData = useMemo(() => {
    if (!shipmentsData || !pickupPointsData) return [];

    const grouped = shipmentsData.reduce((acc, shipment) => {
      const index = shipment.pickup_point_index;
      if (!acc[index]) {
        acc[index] = { total: 0, unclaimed: 0 };
      }
      acc[index].total += 1;
      if (shipment.shipment_status === 'Не востребована') {
        acc[index].unclaimed += 1;
      }
      return acc;
    }, {});

    return pickupPointsData.map(point => {
      const stats = grouped[point.pickup_point_index] || { total: 0, unclaimed: 0 };
      const unclaimedPercent = stats.total > 0 ? (stats.unclaimed / stats.total) * 100 : 0;
      return {
        pickupPoint: point.pickup_point_index,
        total: stats.total,
        unclaimed: stats.unclaimed,
        unclaimedPercent: unclaimedPercent.toFixed(2),
        isCritical: unclaimedPercent > 20
      };
    });
  }, [shipmentsData, pickupPointsData]);

  if (shipmentsLoading || pickupPointsLoading) {
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

  if (shipmentsError || pickupPointsError) {
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
        <h1>Аналитический отчет по пунктам приема и выдачи</h1>
        <Table
          headers={['Пункт', 'Всего посылок', 'Невостребованных', 'Процент невостребованных']}
          data={reportData}
          renderRow={(item) => [
            item.pickupPoint,
            item.total,
            item.unclaimed,
            `${item.unclaimedPercent}%`
          ]}
          rowClassName={(item) => item.isCritical ? 'critical-row' : ''}
        />
      </main>
      <Footer />
    </div>
  );
}