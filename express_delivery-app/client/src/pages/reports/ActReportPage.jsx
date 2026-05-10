import { Header } from '../../components/header/Header';
import { Footer } from '../../components/footer/Footer';
import styles from "./../default.module.css";
import { Button } from '../../components/ui/Button/Button';
import { Loader } from '../../components/ui/Loader/Loader';
import { useAsyncData } from '../../hooks/useAsyncData';
import { getTransferActs, getTransferAct, getShipments } from '../../api/axios';
import { useState, useMemo, useEffect } from 'react';
import tableStyles from '../orders/OrderListPage.module.css';

const VAT_RATE = 0.20;

// Статусы, при которых посылка считается "активной" (ещё в процессе передачи)
const ACTIVE_STATUSES = ['Принято', 'В пути', 'Готова к выдаче'];

export const ActReportPage = () => {
  const [selectedActNumber, setSelectedActNumber] = useState('');
  const [searchActNumber, setSearchActNumber] = useState('');
  const [actData, setActData] = useState(null);
  const [viewMode, setViewMode] = useState('list');
  const [loadingDetail, setLoadingDetail] = useState(false);
  const [actsWithShipments, setActsWithShipments] = useState([]);
  const [loadingShipments, setLoadingShipments] = useState(false);

  const { data: actsList, loading: actsLoading, error: actsError } = useAsyncData(async () => {
    const response = await getTransferActs();
    return response.data;
  }, []);

  const { data: shipmentsData } = useAsyncData(async () => {
    const response = await getShipments();
    return response.data;
  }, []);

  const shipments = shipmentsData ?? [];

  // Загружаем содержимое всех актов
  useEffect(() => {
    const loadActDetails = async () => {
      if (!actsList || actsList.length === 0) {
        setActsWithShipments([]);
        return;
      }
      setLoadingShipments(true);
      try {
        const actsWithDetails = await Promise.all(
          actsList.map(async (act) => {
            try {
              const detailResponse = await getTransferAct(act.act_number);
              const contents = detailResponse.data.contents || detailResponse.data.shipments || [];
              return { ...act, ...detailResponse.data, contents };
            } catch (err) {
              console.error(`Error loading act ${act.act_number}:`, err);
              return { ...act, contents: [] };
            }
          })
        );
        setActsWithShipments(actsWithDetails);
      } catch (err) {
        console.error('Error loading act details:', err);
        setActsWithShipments(actsList.map(act => ({ ...act, contents: [] })));
      } finally {
        setLoadingShipments(false);
      }
    };
    loadActDetails();
  }, [actsList]);

  // Только активные акты - где есть посылки, которые ещё не выданы и не утилизированы
  const activeActs = useMemo(() => {
    return actsWithShipments.filter(act => {
      const contents = act.contents || [];
      return contents.some(item => ACTIVE_STATUSES.includes(item.shipment_status));
    });
  }, [actsWithShipments]);

  // Фильтрация по поиску
  const filteredActs = useMemo(() => {
    if (!searchActNumber) return activeActs;
    const searchLower = searchActNumber.toLowerCase();
    return activeActs.filter(act => {
      return String(act.act_number).toLowerCase().includes(searchLower);
    });
  }, [activeActs, searchActNumber]);

  const loadActDetail = async (actNumber) => {
    setLoadingDetail(true);
    try {
      const response = await getTransferAct(actNumber);
      const act = response.data;
      
      const rawItems = act.contents || act.shipments || [];
      
      // Обогащаем позиции данными из shipment
      const enrichedItems = rawItems.map((item, idx) => {
        const shipment = shipments.find(s => s.ipo === item.ipo);
        
        const actualWeight = parseFloat(item.actual_weight || shipment?.actual_weight || 0);
        const totalPayable = parseFloat(item.total_payable || shipment?.total_payable || 0);
        const vatAmount = totalPayable * VAT_RATE;
        const totalWithVat = totalPayable + vatAmount;

        return {
          ipo: item.ipo || '-',
          package_type: item.package_type || shipment?.package_type || '-',
          weight: actualWeight,
          totalPayable,
          vatAmount,
          totalWithVat,
          status: item.shipment_status || shipment?.shipment_status || '-'
        };
      });

      const totals = enrichedItems.reduce((acc, item) => {
        acc.totalWeight += item.weight;
        acc.totalPayable += item.totalPayable;
        acc.totalVat += item.vatAmount;
        acc.totalWithVat += item.totalWithVat;
        return acc;
      }, {
        totalWeight: 0,
        totalPayable: 0,
        totalVat: 0,
        totalWithVat: 0
      });

      setActData({
        act_number: act.act_number,
        creation_date: act.creation_date,
        sender_staff_number: act.sender_staff_number,
        receiver_staff_number: act.receiver_staff_number,
        // Имена сотрудников, если API их возвращает
        sender_surname: act.sender_surname,
        sender_first_name: act.sender_first_name,
        receiver_surname: act.receiver_surname,
        receiver_first_name: act.receiver_first_name,
        enrichedItems,
        totals
      });
      
      setSelectedActNumber(actNumber);
      setViewMode('detail');
    } catch (error) {
      console.error('Ошибка загрузки акта:', error);
      alert('Не удалось загрузить акт. Проверьте номер.');
    } finally {
      setLoadingDetail(false);
    }
  };

  const handleSelectAct = (act) => {
    loadActDetail(act.act_number);
  };

  const handleSearchByNumber = () => {
    if (searchActNumber.trim()) {
      loadActDetail(searchActNumber.trim());
    }
  };

  const handleBackToList = () => {
    setViewMode('list');
    setActData(null);
    setSelectedActNumber('');
  };

  const formatMoney = (amount) => {
    return new Intl.NumberFormat('ru-RU', {
      style: 'currency',
      currency: 'RUB',
      minimumFractionDigits: 2
    }).format(amount);
  };

  const formatWeight = (weight) => {
    if (!weight || weight === 0) return '-';
    if (weight >= 1000) {
      return `${(weight / 1000).toFixed(3)} кг`;
    }
    return `${weight.toFixed(0)} г`;
  };

  const getStatusColor = (status) => {
    const colors = {
      'Принято': '#4CAF50',
      'В пути': '#2196F3',
      'Готова к выдаче': '#FF9800',
      'Выдана': '#8BC34A',
      'Не востребована': '#F44336',
      'Утилизирована': '#9E9E9E'
    };
    return colors[status] || '#999';
  };

  const generatePDF = () => {
    if (!actData) return;

    const printWindow = window.open('', '_blank');
    
    const formatDate = (dateStr) => {
      if (!dateStr) return '-';
      return new Date(dateStr).toLocaleDateString('ru-RU', {
        day: '2-digit', month: 'long', year: 'numeric'
      });
    };

    const senderLabel = actData.sender_surname && actData.sender_first_name
      ? `${actData.sender_surname} ${actData.sender_first_name} (№${actData.sender_staff_number})`
      : `Сотрудник №${actData.sender_staff_number || '-'}`;

    const receiverLabel = actData.receiver_surname && actData.receiver_first_name
      ? `${actData.receiver_surname} ${actData.receiver_first_name} (№${actData.receiver_staff_number})`
      : `Сотрудник №${actData.receiver_staff_number || '-'}`;

    const itemsRows = actData.enrichedItems.map((item, idx) => `
      <tr>
        <td class="text-center">${idx + 1}</td>
        <td>${item.ipo}</td>
        <td>${item.package_type}</td>
        <td class="text-right">${formatWeight(item.weight)}</td>
        <td class="text-right">${formatMoney(item.totalPayable)}</td>
        <td class="text-right">${formatMoney(item.vatAmount)}</td>
        <td class="text-right"><strong>${formatMoney(item.totalWithVat)}</strong></td>
      </tr>
    `).join('');

    const printContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <title>Акт приема-передачи №${actData.act_number}</title>
        <style>
          * { margin: 0; padding: 0; box-sizing: border-box; }
          body { 
            font-family: 'Times New Roman', serif; 
            padding: 40px 50px; 
            color: #000;
            line-height: 1.6;
            font-size: 13px;
          }
          .header { text-align: center; margin-bottom: 25px; }
          .header h1 { font-size: 20px; text-transform: uppercase; margin-bottom: 10px; }
          .header .act-number { font-size: 16px; font-weight: bold; margin-bottom: 5px; }
          .header .act-date { font-size: 14px; color: #333; }
          .info-block { margin-bottom: 25px; display: grid; grid-template-columns: 1fr 1fr; gap: 15px; }
          .info-item { margin-bottom: 8px; }
          .info-label { font-weight: bold; margin-right: 8px; }
          .info-value { border-bottom: 1px solid #000; padding-bottom: 2px; }
          table { width: 100%; border-collapse: collapse; margin-bottom: 20px; }
          th { background: #f0f0f0; border: 1px solid #000; padding: 8px 6px; font-size: 11px; font-weight: bold; text-align: center; }
          td { border: 1px solid #000; padding: 6px; font-size: 12px; }
          .text-right { text-align: right; }
          .text-center { text-align: center; }
          .total-table { width: 400px; margin-left: auto; margin-top: 20px; }
          .total-table td { padding: 6px 15px; font-size: 13px; }
          .total-label { font-weight: bold; text-align: right; }
          .total-value { text-align: right; font-weight: bold; }
          .grand-total { font-size: 15px; border-top: 2px solid #000; }
          .signatures { display: grid; grid-template-columns: 1fr 1fr; gap: 40px; margin-top: 50px; }
          .signature-block { text-align: center; }
          .signature-line { border-bottom: 1px solid #000; margin: 30px 0 8px 0; width: 100%; }
          .signature-label { font-size: 12px; }
          .footer-text { margin-top: 30px; font-size: 11px; color: #666; text-align: center; }
          @media print { body { padding: 30px; } @page { margin: 20mm; } }
        </style>
      </head>
      <body>
        <div class="header">
          <h1>Акт приема-передачи</h1>
          <div class="act-number">№ ${actData.act_number}</div>
          <div class="act-date">от ${formatDate(actData.creation_date)}</div>
        </div>

        <div class="info-block">
          <div>
            <div class="info-item">
              <span class="info-label">Сдал:</span>
              <span class="info-value">${senderLabel}</span>
            </div>
            <div class="info-item">
              <span class="info-label">Дата создания:</span>
              <span class="info-value">${formatDate(actData.creation_date)}</span>
            </div>
          </div>
          <div>
            <div class="info-item">
              <span class="info-label">Принял:</span>
              <span class="info-value">${receiverLabel}</span>
            </div>
            <div class="info-item">
              <span class="info-label">Количество позиций:</span>
              <span class="info-value">${actData.enrichedItems.length} шт.</span>
            </div>
          </div>
        </div>

        <p style="margin-bottom: 15px; font-style: italic;">
          Настоящий акт составлен о том, что нижеперечисленные почтовые отправления переданы 
          от отправителя к получателю в указанном количестве и состоянии.
        </p>

        <table>
          <thead>
            <tr>
              <th style="width: 40px;">№ п/п</th>
              <th style="width: 140px;">ИПО</th>
              <th style="width: 90px;">Тип</th>
              <th style="width: 90px;">Вес</th>
              <th style="width: 100px;">Стоимость</th>
              <th style="width: 100px;">НДС 20%</th>
              <th style="width: 110px;">Всего с НДС</th>
            </tr>
          </thead>
          <tbody>
            ${itemsRows}
            <tr style="font-weight: bold; background: #f5f5f5;">
              <td colspan="3" style="text-align: right;"><strong>ИТОГО:</strong></td>
              <td class="text-right">${formatWeight(actData.totals.totalWeight)}</td>
              <td class="text-right">${formatMoney(actData.totals.totalPayable)}</td>
              <td class="text-right">${formatMoney(actData.totals.totalVat)}</td>
              <td class="text-right"><strong>${formatMoney(actData.totals.totalWithVat)}</strong></td>
            </tr>
          </tbody>
        </table>

        <table class="total-table">
          <tr>
            <td class="total-label">Стоимость без НДС:</td>
            <td class="total-value">${formatMoney(actData.totals.totalPayable)}</td>
          </tr>
          <tr>
            <td class="total-label">НДС 20%:</td>
            <td class="total-value">${formatMoney(actData.totals.totalVat)}</td>
          </tr>
          <tr class="grand-total">
            <td class="total-label">ИТОГО с НДС:</td>
            <td class="total-value">${formatMoney(actData.totals.totalWithVat)}</td>
          </tr>
        </table>

        <p style="margin-top: 15px; font-size: 14px; font-weight: bold;">
          Всего позиций: ${actData.enrichedItems.length}, 
          на сумму: ${formatMoney(actData.totals.totalWithVat)}
        </p>
        <p style="margin-top: 5px; font-style: italic;">
          В том числе НДС 20% - ${formatMoney(actData.totals.totalVat)}
        </p>

        <div class="signatures">
          <div class="signature-block">
            <div class="signature-label">Сдал:</div>
            <div class="signature-line"></div>
            <div style="font-size: 11px;">_________________ / _______________</div>
          </div>
          <div class="signature-block">
            <div class="signature-label">Принял:</div>
            <div class="signature-line"></div>
            <div style="font-size: 11px;">_________________ / _______________</div>
          </div>
        </div>

        <div class="footer-text">
          Акт сформирован автоматически • ${new Date().toLocaleDateString('ru-RU')}
        </div>
      </body>
      </html>
    `;

    printWindow.document.write(printContent);
    printWindow.document.close();
    
    setTimeout(() => {
      printWindow.print();
    }, 500);
  };

  if (actsLoading || loadingShipments) {
    return (
      <div className={styles.pageWrapper}>
        <Header />
        <main className={styles.content}>
          <h1>Акт приема-передачи</h1>
          <Loader />
        </main>
        <Footer />
      </div>
    );
  }

  if (actsError) {
    return (
      <div className={styles.pageWrapper}>
        <Header />
        <main className={styles.content}>
          <h1>Акт приема-передачи</h1>
          <div className={styles.error}>Не удалось загрузить список актов.</div>
        </main>
        <Footer />
      </div>
    );
  }

  // Детальный просмотр акта
  if (viewMode === 'detail' && actData) {
    const senderLabel = actData.sender_surname && actData.sender_first_name
      ? `${actData.sender_surname} ${actData.sender_first_name}`
      : `Сотрудник №${actData.sender_staff_number || '-'}`;

    const receiverLabel = actData.receiver_surname && actData.receiver_first_name
      ? `${actData.receiver_surname} ${actData.receiver_first_name}`
      : `Сотрудник №${actData.receiver_staff_number || '-'}`;

    // Определяем статус акта по посылкам
    const allCompleted = actData.enrichedItems.every(
      item => item.status === 'Выдана' || item.status === 'Утилизирована'
    );

    return (
      <div className={styles.pageWrapper}>
        <Header />
        <main className={styles.content}>
          <div className={styles.pageHeader}>
            <div>
              <h2>📋 Акт приема-передачи №{actData.act_number}</h2>
              <p style={{ color: '#999', fontSize: '13px', margin: 0 }}>
                от {new Date(actData.creation_date).toLocaleDateString('ru-RU', {
                  day: '2-digit', month: 'long', year: 'numeric'
                })}
              </p>
            </div>
            <div style={{ display: 'flex', gap: '10px' }}>
              <Button variant="secondary" onClick={handleBackToList}>
                ← К списку
              </Button>
              <Button variant="primary" onClick={generatePDF}>
                📄 Печать акта
              </Button>
            </div>
          </div>

          <div style={{
            display: 'grid',
            gridTemplateColumns: '1fr 1fr',
            gap: '20px',
            marginBottom: '25px',
            padding: '20px',
            backgroundColor: '#1a1a1a',
            borderRadius: '8px'
          }}>
            <div>
              <div style={{ marginBottom: '12px' }}>
                <span style={{ color: '#999', fontSize: '12px' }}>Сдал (отправитель):</span><br/>
                <strong>{senderLabel}</strong>
                <span style={{ color: '#999', marginLeft: '8px', fontSize: '12px' }}>
                  (№{actData.sender_staff_number || '-'})
                </span>
              </div>
              <div style={{ marginBottom: '12px' }}>
                <span style={{ color: '#999', fontSize: '12px' }}>Дата создания:</span><br/>
                <strong>{new Date(actData.creation_date).toLocaleDateString('ru-RU', {
                  day: '2-digit', month: 'long', year: 'numeric'
                })}</strong>
              </div>
            </div>
            <div>
              <div style={{ marginBottom: '12px' }}>
                <span style={{ color: '#999', fontSize: '12px' }}>Принял (получатель):</span><br/>
                <strong>{receiverLabel}</strong>
                <span style={{ color: '#999', marginLeft: '8px', fontSize: '12px' }}>
                  (№{actData.receiver_staff_number || '-'})
                </span>
              </div>
              <div>
                <span style={{ color: '#999', fontSize: '12px' }}>Статус акта:</span><br/>
                <span style={{
                  display: 'inline-block',
                  padding: '4px 12px',
                  borderRadius: '12px',
                  fontSize: '12px',
                  fontWeight: 'bold',
                  backgroundColor: allCompleted ? 'rgba(139, 195, 74, 0.2)' : 'rgba(33, 150, 243, 0.2)',
                  color: allCompleted ? '#8BC34A' : '#2196F3'
                }}>
                  {allCompleted ? 'Завершён' : 'Активен'}
                </span>
              </div>
            </div>
          </div>

          <div style={{ marginBottom: '30px' }}>
            <h3 style={{ marginBottom: '15px', color: '#aaa' }}>
              📦 Позиции акта ({actData.enrichedItems.length})
            </h3>
            <div className={tableStyles.tableWrapper} style={{ overflowX: 'auto' }}>
              <table className={tableStyles.table} style={{ minWidth: '800px' }}>
                <thead>
                  <tr>
                    <th className={tableStyles.th} style={{ width: '50px' }}>№</th>
                    <th className={tableStyles.th} style={{ width: '150px' }}>ИПО</th>
                    <th className={tableStyles.th} style={{ width: '90px' }}>Тип</th>
                    <th className={tableStyles.th} style={{ width: '100px', textAlign: 'right' }}>Вес</th>
                    <th className={tableStyles.th} style={{ width: '110px', textAlign: 'right' }}>Стоимость</th>
                    <th className={tableStyles.th} style={{ width: '110px', textAlign: 'right' }}>НДС 20%</th>
                    <th className={tableStyles.th} style={{ width: '120px', textAlign: 'right' }}>Всего с НДС</th>
                    <th className={tableStyles.th} style={{ width: '120px', textAlign: 'center' }}>Статус</th>
                  </tr>
                </thead>
                <tbody>
                  {actData.enrichedItems.map((item, idx) => (
                    <tr key={idx} className={tableStyles.tr}>
                      <td className={tableStyles.td} style={{ textAlign: 'center', color: '#999' }}>
                        {idx + 1}
                      </td>
                      <td className={tableStyles.td} style={{ fontWeight: 'bold', fontFamily: 'monospace' }}>
                        {item.ipo}
                      </td>
                      <td className={tableStyles.td}>{item.package_type}</td>
                      <td className={tableStyles.td} style={{ textAlign: 'right' }}>
                        {formatWeight(item.weight)}
                      </td>
                      <td className={tableStyles.td} style={{ textAlign: 'right' }}>
                        {formatMoney(item.totalPayable)}
                      </td>
                      <td className={tableStyles.td} style={{ textAlign: 'right', color: '#f5576c' }}>
                        {formatMoney(item.vatAmount)}
                      </td>
                      <td className={tableStyles.td} style={{ textAlign: 'right', fontWeight: 'bold' }}>
                        {formatMoney(item.totalWithVat)}
                      </td>
                      <td className={tableStyles.td} style={{ 
                        textAlign: 'center',
                        color: getStatusColor(item.status),
                        fontWeight: 'bold'
                      }}>
                        {item.status}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Итоги */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: '1fr 1fr',
            gap: '20px',
            marginBottom: '30px'
          }}>
            <div style={{
              padding: '20px',
              backgroundColor: '#1a1a1a',
              borderRadius: '8px'
            }}>
              <h4 style={{ marginBottom: '15px', color: '#aaa' }}>Общие показатели</h4>
              <div style={{ display: 'grid', gap: '8px', fontSize: '14px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span>Позиций в акте:</span>
                  <strong>{actData.enrichedItems.length} шт.</strong>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span>Общий вес:</span>
                  <strong>{formatWeight(actData.totals.totalWeight)}</strong>
                </div>
              </div>
            </div>

            <div style={{
              padding: '20px',
              backgroundColor: '#1a1a1a',
              borderRadius: '8px',
              border: '1px solid rgba(255, 215, 0, 0.3)'
            }}>
              <h4 style={{ marginBottom: '15px', color: '#ffd200' }}>💰 Финансовые показатели</h4>
              <div style={{ display: 'grid', gap: '10px', fontSize: '14px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span>Стоимость без НДС:</span>
                  <strong>{formatMoney(actData.totals.totalPayable)}</strong>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', color: '#f5576c' }}>
                  <span>НДС 20%:</span>
                  <strong>{formatMoney(actData.totals.totalVat)}</strong>
                </div>
                <div style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  borderTop: '2px solid rgba(255, 215, 0, 0.3)',
                  paddingTop: '10px',
                  fontSize: '16px'
                }}>
                  <span>ИТОГО с НДС:</span>
                  <strong style={{ color: '#ffd200' }}>{formatMoney(actData.totals.totalWithVat)}</strong>
                </div>
              </div>
            </div>
          </div>

          <div style={{
            padding: '15px',
            backgroundColor: 'rgba(255, 215, 0, 0.05)',
            borderRadius: '8px',
            fontSize: '14px',
            color: '#999'
          }}>
            <span>Позиций в акте: </span>
            <strong>{actData.enrichedItems.length} шт.</strong>
            <span style={{ marginLeft: '20px' }}>
              Всего к оплате: 
            </span>
            <strong style={{ color: '#ffd200' }}>{formatMoney(actData.totals.totalWithVat)}</strong>
            <span> (в том числе НДС 20% - {formatMoney(actData.totals.totalVat)})</span>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  // Список актов
  return (
    <div className={styles.pageWrapper}>
      <Header />
      <main className={styles.content}>
        <div className={styles.pageHeader}>
          <h2>📋 Акты приема-передачи (активные)</h2>
        </div>

        <div style={{ 
          marginBottom: '25px', 
          padding: '20px', 
          backgroundColor: '#1a1a1a', 
          borderRadius: '8px',
          display: 'flex',
          gap: '15px',
          alignItems: 'flex-end',
          flexWrap: 'wrap'
        }}>
          <div style={{ flex: '1', minWidth: '250px' }}>
            <label style={{ display: 'block', marginBottom: '8px', color: '#aaa', fontSize: '13px' }}>
              Поиск по номеру акта
            </label>
            <input
              type="text"
              value={searchActNumber}
              onChange={(e) => setSearchActNumber(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSearchByNumber()}
              placeholder="Введите номер акта..."
              style={{
                width: '100%',
                padding: '10px 12px',
                backgroundColor: '#2a2a2a',
                border: '1px solid #444',
                borderRadius: '4px',
                color: '#fff',
                fontSize: '14px'
              }}
            />
          </div>
          <Button variant="primary" onClick={handleSearchByNumber} disabled={loadingDetail}>
            {loadingDetail ? '⏳ Загрузка...' : '🔍 Найти'}
          </Button>
        </div>

        <div style={{
          display: 'flex',
          gap: '20px',
          marginBottom: '20px',
          padding: '12px 15px',
          backgroundColor: '#1a1a1a',
          borderRadius: '8px',
          color: '#999',
          fontSize: '14px',
          flexWrap: 'wrap'
        }}>
          <span>
            Активных актов: <strong style={{ color: '#2196F3' }}>{activeActs.length}</strong>
          </span>
          <span>
            Всего актов: <strong>{actsWithShipments.length}</strong>
          </span>
          <span>
            Завершенных (скрыто): <strong style={{ color: '#666' }}>{actsWithShipments.length - activeActs.length}</strong>
          </span>
        </div>

        <div className={tableStyles.tableWrapper}>
          <table className={tableStyles.table}>
            <thead>
              <tr>
                <th className={tableStyles.th}>Номер акта</th>
                <th className={tableStyles.th}>Дата создания</th>
                <th className={tableStyles.th}>Сдал (№ сотр.)</th>
                <th className={tableStyles.th}>Принял (№ сотр.)</th>
                <th className={tableStyles.th} style={{ textAlign: 'center' }}>Посылок</th>
                <th className={tableStyles.th} style={{ textAlign: 'center' }}>Статус</th>
                <th className={tableStyles.th} style={{ textAlign: 'center' }}>Действия</th>
              </tr>
            </thead>
            <tbody>
              {filteredActs.length === 0 ? (
                <tr>
                  <td colSpan={7} className={tableStyles.empty}>
                    {searchActNumber 
                      ? 'Акт не найден' 
                      : 'Нет активных актов (все посылки выданы или утилизированы)'}
                  </td>
                </tr>
              ) : (
                filteredActs.map((act) => {
                  const contents = act.contents || [];
                  const activeCount = contents.filter(
                    item => ACTIVE_STATUSES.includes(item.shipment_status)
                  ).length;
                  
                  return (
                    <tr 
                      key={act.act_number}
                      className={tableStyles.tr}
                      style={{ cursor: 'pointer' }}
                      onClick={() => handleSelectAct(act)}
                    >
                      <td className={tableStyles.td} style={{ fontWeight: 'bold' }}>
                        №{act.act_number}
                      </td>
                      <td className={tableStyles.td}>
                        {act.creation_date 
                          ? new Date(act.creation_date).toLocaleDateString('ru-RU', {
                              day: '2-digit', month: 'long', year: 'numeric'
                            })
                          : '-'}
                      </td>
                      <td className={tableStyles.td}>
                        {act.sender_surname && act.sender_first_name 
                          ? `${act.sender_surname} ${act.sender_first_name.charAt(0)}.`
                          : `№${act.sender_staff_number || '-'}`}
                      </td>
                      <td className={tableStyles.td}>
                        {act.receiver_surname && act.receiver_first_name 
                          ? `${act.receiver_surname} ${act.receiver_first_name.charAt(0)}.`
                          : `№${act.receiver_staff_number || '-'}`}
                      </td>
                      <td className={tableStyles.td} style={{ textAlign: 'center' }}>
                        <strong style={{ color: '#2196F3' }}>{activeCount}</strong>
                        <span style={{ color: '#999' }}> / {contents.length}</span>
                      </td>
                      <td className={tableStyles.td} style={{ textAlign: 'center' }}>
                        <span style={{
                          padding: '4px 12px',
                          borderRadius: '12px',
                          fontSize: '12px',
                          backgroundColor: 'rgba(33, 150, 243, 0.2)',
                          color: '#2196F3'
                        }}>
                          Активен
                        </span>
                      </td>
                      <td className={tableStyles.td} style={{ textAlign: 'center' }}>
                        <Button 
                          variant="secondary" 
                          onClick={(e) => {
                            e.stopPropagation();
                            handleSelectAct(act);
                          }}
                          style={{ padding: '6px 12px', fontSize: '12px' }}
                        >
                          👁️ Открыть
                        </Button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        <div style={{ 
          marginTop: '15px',
          padding: '15px',
          backgroundColor: 'rgba(255,255,255,0.02)',
          borderRadius: '8px',
          fontSize: '13px',
          color: '#666'
        }}>
          Показано активных актов: <strong>{filteredActs.length}</strong>
          {searchActNumber && <span> (поиск: "{searchActNumber}")</span>}
        </div>
      </main>
      <Footer />
    </div>
  );
};