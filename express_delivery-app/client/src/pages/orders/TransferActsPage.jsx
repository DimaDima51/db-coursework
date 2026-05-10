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

const statusColors = {
  'В пути': '#2196F3',
  'Готова к выдаче': '#FF9800',
  'Получено': '#00BCD4',
  'Выдана': '#8BC34A'
};

const getStatusColor = (status) => statusColors[status] || '#999';

export const TransferActsPage = () => {
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState('');
  const [expandedAct, setExpandedAct] = useState(null);
  const [processingAct, setProcessingAct] = useState(null);
  const [actsWithShipments, setActsWithShipments] = useState([]);
  const [loadingShipments, setLoadingShipments] = useState(false);

  const { data, loading, error } = useAsyncData(async () => {
    const response = await getTransferActs();
    console.log('Transfer acts response:', response.data);
    return response.data;
  }, []);

  const acts = data ?? [];

  // Загружаем детали каждого акта (с посылками)
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
              console.log(`Act ${act.act_number} details:`, detailResponse.data);
              
              // Посылки могут быть в поле contents или shipments
              const shipments = detailResponse.data.contents || detailResponse.data.shipments || [];
              
              return {
                ...act,
                ...detailResponse.data,
                shipments: shipments
              };
            } catch (err) {
              console.error(`Error loading act ${act.act_number}:`, err);
              return {
                ...act,
                shipments: []
              };
            }
          })
        );
        
        console.log('Acts with shipments:', actsWithDetails);
        setActsWithShipments(actsWithDetails);
      } catch (err) {
        console.error('Error loading act details:', err);
        // Если не удалось загрузить детали, используем базовые данные
        const basicActs = acts.map(act => ({
          ...act,
          shipments: act.contents || act.shipments || []
        }));
        setActsWithShipments(basicActs);
      } finally {
        setLoadingShipments(false);
      }
    };

    loadActDetails();
  }, [acts]);

  // Фильтруем акты: показываем только те, где есть посылки в статусе "В пути"
  const activeActs = useMemo(() => {
    console.log('All acts with shipments:', actsWithShipments);
    
    return actsWithShipments.filter(act => {
      const shipments = act.shipments || [];
      console.log(`Act ${act.act_number} shipments:`, shipments);
      
      const hasInTransitShipments = shipments.some(
        shipment => shipment.shipment_status === 'В пути'
      );
      
      console.log(`Act ${act.act_number} hasInTransitShipments:`, hasInTransitShipments);
      return hasInTransitShipments;
    });
  }, [actsWithShipments]);

  // Фильтруем по поиску
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

  // Считаем статистику по посылкам в акте
  const getActStats = (act) => {
    const shipments = act.shipments || [];
    if (shipments.length === 0) {
      return { total: 0, inTransit: 0 };
    }
    
    const inTransit = shipments.filter(s => s.shipment_status === 'В пути').length;
    return {
      total: shipments.length,
      inTransit
    };
  };

  const handleToggleExpand = (actNumber) => {
    setExpandedAct(expandedAct === actNumber ? null : actNumber);
  };

  const handleReceiveAct = async (actNumber) => {
    if (!confirm(`Подтвердить получение акта №${actNumber}? Статус посылок изменится.`)) {
      return;
    }

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

        {/* Search section */}
        <div style={{ marginBottom: '20px', padding: '15px', backgroundColor: '#f9f9f9', borderRadius: '4px' }}>
          <Input
            label="Поиск по номеру акта или сотруднику"
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Введите номер акта или табельный номер..."
          />
          <div style={{ marginTop: '10px', color: '#666', fontSize: '14px' }}>
            Активных актов: <strong>{activeActs.length}</strong> | 
            Завершенных (скрыто): <strong>{actsWithShipments.length - activeActs.length}</strong>
          </div>
        </div>

        {/* Acts list */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
          {filteredActs.length === 0 ? (
            <div style={{
              padding: '30px',
              textAlign: 'center',
              backgroundColor: '#FFF3E0',
              borderRadius: '4px',
              color: '#E65100'
            }}>
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
                <div 
                  key={act.act_number}
                  style={{
                    border: '1px solid #ddd',
                    borderRadius: '8px',
                    backgroundColor: '#fff',
                    boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
                  }}
                >
                  {/* Act header */}
                  <div 
                    onClick={() => handleToggleExpand(act.act_number)}
                    style={{
                      padding: '20px',
                      cursor: 'pointer',
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center'
                    }}
                  >
                    <div style={{ display: 'flex', gap: '30px', alignItems: 'center' }}>
                      <div>
                        <div style={{ fontSize: '12px', color: '#666', marginBottom: '4px' }}>
                          Акт №
                        </div>
                        <div style={{ fontSize: '18px', fontWeight: 'bold' }}>
                          {act.act_number}
                        </div>
                      </div>
                      
                      <div>
                        <div style={{ fontSize: '12px', color: '#666', marginBottom: '4px' }}>
                          Дата создания
                        </div>
                        <div>
                          {act.creation_date ? new Date(act.creation_date).toLocaleDateString('ru-RU') : '-'}
                        </div>
                      </div>

                      <div>
                        <div style={{ fontSize: '12px', color: '#666', marginBottom: '4px' }}>
                          Посылок в пути
                        </div>
                        <div style={{ 
                          fontSize: '18px',
                          fontWeight: 'bold',
                          color: stats.inTransit > 0 ? '#2196F3' : '#4CAF50'
                        }}>
                          {stats.inTransit} / {stats.total}
                        </div>
                      </div>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
                      <span style={{ fontSize: '20px', color: '#666' }}>
                        {isExpanded ? '▼' : '▶'}
                      </span>
                    </div>
                  </div>

                  {/* Expanded content */}
                  {isExpanded && (
                    <div style={{ 
                      borderTop: '1px solid #eee',
                      padding: '20px',
                      backgroundColor: '#fafafa'
                    }}>
                      {/* Сотрудники */}
                      <div style={{ marginBottom: '20px', display: 'flex', gap: '30px' }}>
                        <div>
                          <div style={{ fontSize: '12px', color: '#666', marginBottom: '4px' }}>
                            Отправляющий сотрудник
                          </div>
                          <div style={{ fontWeight: 'bold' }}>
                            {act.sender_surname && act.sender_first_name 
                              ? `${act.sender_surname} ${act.sender_first_name} (№${act.sender_staff_number})`
                              : `Сотрудник №${act.sender_staff_number}`}
                          </div>
                        </div>
                        <div>
                          <div style={{ fontSize: '12px', color: '#666', marginBottom: '4px' }}>
                            Принимающий сотрудник
                          </div>
                          <div style={{ fontWeight: 'bold' }}>
                            {act.receiver_surname && act.receiver_first_name 
                              ? `${act.receiver_surname} ${act.receiver_first_name} (№${act.receiver_staff_number})`
                              : `Сотрудник №${act.receiver_staff_number}`}
                          </div>
                        </div>
                      </div>

                      {/* Посылки */}
                      <h3 style={{ marginBottom: '15px' }}>
                        Посылки в акте ({stats.inTransit} в пути из {stats.total})
                      </h3>
                      
                      {shipments.length > 0 ? (
                        <div style={{
                          maxHeight: '300px',
                          overflowY: 'auto',
                          border: '1px solid #ddd',
                          borderRadius: '4px',
                          backgroundColor: '#fff'
                        }}>
                          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                            <thead>
                              <tr style={{ backgroundColor: '#f5f5f5', borderBottom: '1px solid #ddd' }}>
                                <th style={{ padding: '10px', textAlign: 'left', borderRight: '1px solid #ddd' }}>
                                  IPO
                                </th>
                                <th style={{ padding: '10px', textAlign: 'left', borderRight: '1px solid #ddd' }}>
                                  Тип
                                </th>
                                <th style={{ padding: '10px', textAlign: 'left', borderRight: '1px solid #ddd' }}>
                                  Вес (кг)
                                </th>
                                <th style={{ padding: '10px', textAlign: 'left' }}>
                                  Статус
                                </th>
                              </tr>
                            </thead>
                            <tbody>
                              {shipments.map(shipment => {
                                const isInTransit = shipment.shipment_status === 'В пути';
                                return (
                                  <tr 
                                    key={shipment.ipo}
                                    style={{
                                      borderBottom: '1px solid #eee',
                                      backgroundColor: isInTransit ? '#E3F2FD' : 'transparent'
                                    }}
                                  >
                                    <td style={{ padding: '10px', borderRight: '1px solid #eee', fontWeight: 'bold' }}>
                                      {shipment.ipo}
                                    </td>
                                    <td style={{ padding: '10px', borderRight: '1px solid #eee' }}>
                                      {shipment.package_type}
                                    </td>
                                    <td style={{ padding: '10px', borderRight: '1px solid #eee' }}>
                                      {shipment.actual_weight}
                                    </td>
                                    <td style={{ 
                                      padding: '10px',
                                      fontWeight: 'bold',
                                      color: getStatusColor(shipment.shipment_status)
                                    }}>
                                      {shipment.shipment_status}
                                      {isInTransit && (
                                        <span style={{ fontSize: '11px', color: '#666', marginLeft: '5px' }}>
                                          (ожидает)
                                        </span>
                                      )}
                                    </td>
                                  </tr>
                                );
                              })}
                            </tbody>
                          </table>
                        </div>
                      ) : (
                        <div style={{ 
                          padding: '20px', 
                          textAlign: 'center', 
                          color: '#999',
                          backgroundColor: '#f5f5f5',
                          borderRadius: '4px'
                        }}>
                          Нет данных о посылках в этом акте
                        </div>
                      )}

                      {/* Actions */}
                      <div style={{ 
                        marginTop: '20px',
                        paddingTop: '20px',
                        borderTop: '1px solid #eee',
                        display: 'flex',
                        justifyContent: 'flex-end'
                      }}>
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

        {/* Статистика */}
        <div style={{ 
          marginTop: '20px',
          padding: '15px',
          backgroundColor: '#f5f5f5',
          borderRadius: '4px',
          display: 'flex',
          justifyContent: 'space-between',
          color: '#666'
        }}>
          <span>Всего актов: <strong>{actsWithShipments.length}</strong></span>
          <span>Активных: <strong style={{ color: '#2196F3' }}>{activeActs.length}</strong></span>
          <span>Завершенных: <strong style={{ color: '#4CAF50' }}>{actsWithShipments.length - activeActs.length}</strong></span>
        </div>
      </main>
      <Footer />
    </div>
  );
};