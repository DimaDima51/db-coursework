import { Header } from '../../components/header/Header';
import { Footer } from '../../components/footer/Footer';
import styles from "./../default.module.css";
import { Input } from '../../components/ui/Input/Input';
import { Button } from '../../components/ui/Button/Button';
import { Loader } from '../../components/ui/Loader/Loader';
import { useAsyncData } from '../../hooks/useAsyncData';
import { getTransferActs, getTransferAct, receiveTransferAct } from '../../api/axios';
import { useState, useMemo, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import tableStyles from './TransferActsPage.module.css';

const STATUS_COLORS = {
  'В пути': '#2196F3',
  'Готова к выдаче': '#FF9800',
  'Получено': '#00BCD4',
  'Выдана': '#8BC34A'
};

const getStatusColor = (status) => STATUS_COLORS[status] || '#999';

export const TransferActsPage = () => {
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState('');
  const [expandedAct, setExpandedAct] = useState(null);
  const [processingAct, setProcessingAct] = useState(null);
  const [actsWithShipments, setActsWithShipments] = useState([]);
  const [loadingShipments, setLoadingShipments] = useState(false);

  const { data, loading, error } = useAsyncData(async () => {
    const response = await getTransferActs();
    return response.data;
  }, []);

  const acts = data ?? [];

  useEffect(() => {
    const loadActDetails = async () => {
      if (!acts || acts.length === 0) {
        setActsWithShipments([]);
        return;
      }
      setLoadingShipments(true);
      try {
        const actsWithDetails = await Promise.all(
          acts.map(async (act) => {
            try {
              const detailResponse = await getTransferAct(act.act_number);
              const shipments = detailResponse.data.contents || detailResponse.data.shipments || [];
              return { ...act, ...detailResponse.data, shipments };
            } catch (err) {
              console.error(`Error loading act ${act.act_number}:`, err);
              return { ...act, shipments: [] };
            }
          })
        );
        setActsWithShipments(actsWithDetails);
      } catch (err) {
        console.error('Error loading act details:', err);
        setActsWithShipments(acts.map(act => ({ ...act, shipments: act.contents || act.shipments || [] })));
      } finally {
        setLoadingShipments(false);
      }
    };
    loadActDetails();
  }, [acts]);

  const activeActs = useMemo(() => {
    return actsWithShipments.filter(act => {
      const shipments = act.shipments || [];
      return shipments.some(shipment => shipment.shipment_status === 'В пути');
    });
  }, [actsWithShipments]);

  const filteredActs = useMemo(() => {
    if (!searchTerm) return activeActs;
    const searchLower = searchTerm.toLowerCase();
    return activeActs.filter(act => {
      return (
        String(act.act_number).toLowerCase().includes(searchLower) ||
        act.sender_staff_number?.toString().toLowerCase().includes(searchLower) ||
        act.receiver_staff_number?.toString().toLowerCase().includes(searchLower)
      );
    });
  }, [activeActs, searchTerm]);

  const getActStats = (act) => {
    const shipments = act.shipments || [];
    if (shipments.length === 0) return { total: 0, inTransit: 0 };
    const inTransit = shipments.filter(s => s.shipment_status === 'В пути').length;
    return { total: shipments.length, inTransit };
  };

  const handleToggleExpand = (actNumber) => {
    setExpandedAct(expandedAct === actNumber ? null : actNumber);
  };

  const handleReceiveAct = async (actNumber) => {
    if (!confirm(`Подтвердить получение акта №${actNumber}? Статус посылок изменится.`)) return;
    setProcessingAct(actNumber);
    try {
      await receiveTransferAct(actNumber);
      alert(`Акт №${actNumber} подтвержден`);
      window.location.reload();
    } catch (err) {
      console.error('Ошибка при подтверждении акта:', err);
      alert(`Ошибка: ${err.response?.data?.message || err.message}`);
    } finally {
      setProcessingAct(null);
    }
  };

  if (loading || loadingShipments) {
    return (
      <div className={styles.pageWrapper}>
        <Header />
        <main className={styles.content}>
          <h1>Акты доставки</h1>
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
          <h1>Акты доставки</h1>
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
          <h1>Акты доставки</h1>
          <Button 
            variant="primary"
            onClick={() => navigate('/orders/transfer-acts/create')}
          >
            Создать акт
          </Button>
        </div>

        <div className={tableStyles.searchSection}>
          <Input
            label="Поиск по номеру акта или сотруднику"
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Введите номер акта или табельный номер..."
          />
          <div className={tableStyles.searchStats}>
            Активных актов: <strong>{activeActs.length}</strong> | 
            Завершенных (скрыто): <strong>{actsWithShipments.length - activeActs.length}</strong>
          </div>
        </div>

        <div className={tableStyles.actsList}>
          {filteredActs.length === 0 ? (
            <div className={tableStyles.emptyState}>
              {searchTerm 
                ? 'По вашему запросу ничего не найдено' 
                : 'Нет активных актов доставки (все посылки уже доставлены)'}
            </div>
          ) : (
            filteredActs.map(act => {
              const stats = getActStats(act);
              const isExpanded = expandedAct === act.act_number;
              const shipments = act.shipments || [];
              
              return (
                <div key={act.act_number} className={tableStyles.actCard}>
                  <div 
                    onClick={() => handleToggleExpand(act.act_number)}
                    className={tableStyles.actHeader}
                  >
                    <div className={tableStyles.actHeaderInfo}>
                      <div className={tableStyles.actStat}>
                        <div className={tableStyles.actStatLabel}>Акт №</div>
                        <div className={tableStyles.actStatValue}>{act.act_number}</div>
                      </div>
                      <div className={tableStyles.actStat}>
                        <div className={tableStyles.actStatLabel}>Дата создания</div>
                        <div className={tableStyles.actStatText}>
                          {act.creation_date ? new Date(act.creation_date).toLocaleDateString('ru-RU') : '-'}
                        </div>
                      </div>
                      <div className={tableStyles.actStat}>
                        <div className={tableStyles.actStatLabel}>Посылок в пути</div>
                        <div className={`${tableStyles.actStatValue} ${stats.inTransit > 0 ? tableStyles.statWarning : tableStyles.statSuccess}`}>
                          {stats.inTransit} / {stats.total}
                        </div>
                      </div>
                    </div>
                    <span className={`${tableStyles.expandIcon} ${isExpanded ? tableStyles.expandIconRotated : ''}`}>
                      ▶
                    </span>
                  </div>

                  {isExpanded && (
                    <div className={tableStyles.actContent}>
                      <div className={tableStyles.actEmployees}>
                        <div>
                          <div className={tableStyles.employeeLabel}>Отправляющий сотрудник</div>
                          <div className={tableStyles.employeeName}>
                            {act.sender_surname && act.sender_first_name 
                              ? `${act.sender_surname} ${act.sender_first_name} (№${act.sender_staff_number})`
                              : `Сотрудник №${act.sender_staff_number}`}
                          </div>
                        </div>
                        <div>
                          <div className={tableStyles.employeeLabel}>Принимающий сотрудник</div>
                          <div className={tableStyles.employeeName}>
                            {act.receiver_surname && act.receiver_first_name 
                              ? `${act.receiver_surname} ${act.receiver_first_name} (№${act.receiver_staff_number})`
                              : `Сотрудник №${act.receiver_staff_number}`}
                          </div>
                        </div>
                      </div>

                      <h3 className={tableStyles.shipmentsTitle}>
                        Посылки в акте ({stats.inTransit} в пути из {stats.total})
                      </h3>
                      
                      {shipments.length > 0 ? (
                        <div className={tableStyles.tableWrapper}>
                          <table className={tableStyles.table}>
                            <thead>
                              <tr>
                                <th className={tableStyles.th}>IPO</th>
                                <th className={tableStyles.th}>Тип</th>
                                <th className={tableStyles.th}>Вес (кг)</th>
                                <th className={tableStyles.th}>Статус</th>
                              </tr>
                            </thead>
                            <tbody>
                              {shipments.map(shipment => {
                                const isInTransit = shipment.shipment_status === 'В пути';
                                return (
                                  <tr 
                                    key={shipment.ipo}
                                    className={`${tableStyles.tr} ${isInTransit ? tableStyles.trInTransit : ''}`}
                                  >
                                    <td className={`${tableStyles.td} ${tableStyles.tdBold}`}>{shipment.ipo}</td>
                                    <td className={tableStyles.td}>{shipment.package_type || '-'}</td>
                                    <td className={tableStyles.td}>{shipment.actual_weight || '-'}</td>
                                    <td className={tableStyles.td} style={{ color: getStatusColor(shipment.shipment_status), fontWeight: 'bold' }}>
                                      {shipment.shipment_status}
                                      {isInTransit && <span className={tableStyles.statusWaiting}>(ожидает)</span>}
                                    </td>
                                  </tr>
                                );
                              })}
                            </tbody>
                          </table>
                        </div>
                      ) : (
                        <div className={tableStyles.noShipments}>
                          Нет данных о посылках в этом акте
                        </div>
                      )}

                      <div className={tableStyles.actActions}>
                        <Button
                          variant="primary"
                          onClick={() => handleReceiveAct(act.act_number)}
                          loading={processingAct === act.act_number}
                          disabled={processingAct !== null}
                        >
                          Подтвердить получение
                        </Button>
                      </div>
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>

        <div className={tableStyles.footerStats}>
          <span>Всего актов: <strong>{actsWithShipments.length}</strong></span>
          <span>Активных: <strong className={tableStyles.footerStatActive}>{activeActs.length}</strong></span>
          <span>Завершенных: <strong className={tableStyles.footerStatCompleted}>{actsWithShipments.length - activeActs.length}</strong></span>
        </div>
      </main>
      <Footer />
    </div>
  );
};