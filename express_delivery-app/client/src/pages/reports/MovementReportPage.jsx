import { Header } from '../../components/header/Header';
import { Footer } from '../../components/footer/Footer';
import styles from "./../default.module.css";
import { Button } from '../../components/ui/Button/Button';
import { Loader } from '../../components/ui/Loader/Loader';
import { useAsyncData } from '../../hooks/useAsyncData';
import { getShipments } from '../../api/axios';
import { useState, useMemo, useRef } from 'react';
import tableStyles from '../orders/OrderListPage.module.css';

const STATUSES = ['Принята', 'В пути', 'Готова к выдаче', 'Выдана', 'Утилизирована'];

const statusColors = {
  'Принята': '#4CAF50',
  'В пути': '#2196F3',
  'Готова к выдаче': '#FF9800',
  'Выдана': '#8BC34A',
  'Утилизирована': '#9E9E9E'
};

const STATUS_LABELS = {
  'Принята': 'Принято',
  'В пути': 'В пути',
  'Готова к выдаче': 'Готово к выдаче',
  'Выдана': 'Выдано',
  'Утилизирована': 'Утилизировано'
};

export const MovementReportPage = () => {
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [appliedFilter, setAppliedFilter] = useState({ from: '', to: '' });
  const reportRef = useRef(null);
  
  const { data, loading, error } = useAsyncData(async () => {
    const response = await getShipments();
    return response.data;
  }, []);

  const shipments = data ?? [];

  const filteredShipments = useMemo(() => {
    if (!appliedFilter.from && !appliedFilter.to) return shipments;
    
    return shipments.filter(shipment => {
      const shipDate = new Date(shipment.registration_date);
      const from = appliedFilter.from ? new Date(appliedFilter.from) : null;
      const to = appliedFilter.to ? new Date(appliedFilter.to) : null;
      
      if (from && to) {
        to.setHours(23, 59, 59, 999);
        return shipDate >= from && shipDate <= to;
      }
      if (from) return shipDate >= from;
      if (to) {
        to.setHours(23, 59, 59, 999);
        return shipDate <= to;
      }
      return true;
    });
  }, [shipments, appliedFilter]);

  const statusStats = useMemo(() => {
    const stats = {};
    STATUSES.forEach(status => {
      stats[status] = filteredShipments.filter(s => s.shipment_status === status).length;
    });
    stats['Всего'] = filteredShipments.length;
    return stats;
  }, [filteredShipments]);

  const statusHistory = useMemo(() => {
    // Группировка по месяцам для графика динамики
    const monthlyData = {};
    
    filteredShipments.forEach(shipment => {
      if (!shipment.registration_date) return;
      const date = new Date(shipment.registration_date);
      const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
      
      if (!monthlyData[monthKey]) {
        monthlyData[monthKey] = {
          month: date.toLocaleDateString('ru-RU', { month: 'long', year: 'numeric' }),
          ...Object.fromEntries(STATUSES.map(s => [s, 0])),
          'Всего': 0
        };
      }
      
      monthlyData[monthKey][shipment.shipment_status] = (monthlyData[monthKey][shipment.shipment_status] || 0) + 1;
      monthlyData[monthKey]['Всего'] += 1;
    });
    
    return Object.values(monthlyData).sort((a, b) => a.month.localeCompare(b.month));
  }, [filteredShipments]);

  const handleApplyFilter = () => {
    setAppliedFilter({ from: dateFrom, to: dateTo });
  };

  const handleResetFilter = () => {
    setDateFrom('');
    setDateTo('');
    setAppliedFilter({ from: '', to: '' });
  };

  const generatePDF = () => {
    const printWindow = window.open('', '_blank');
    
    const formatDate = (dateStr) => {
      if (!dateStr) return '...';
      return new Date(dateStr).toLocaleDateString('ru-RU');
    };

    const totalMovements = statusStats['Всего'];
    const maxStatus = Object.entries(statusStats)
      .filter(([key]) => key !== 'Всего')
      .sort((a, b) => b[1] - a[1])[0];

    const printContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <title>Отчёт о движении отправлений</title>
        <style>
          * { margin: 0; padding: 0; box-sizing: border-box; }
          body { 
            font-family: 'Arial', sans-serif; 
            padding: 40px; 
            color: #333;
            line-height: 1.6;
          }
          .header {
            text-align: center;
            margin-bottom: 30px;
            border-bottom: 2px solid #1a1a1a;
            padding-bottom: 20px;
          }
          .header h1 {
            font-size: 24px;
            color: #1a1a1a;
            margin-bottom: 5px;
          }
          .header .period {
            font-size: 14px;
            color: #777;
            margin-top: 10px;
          }
          .summary-cards {
            display: grid;
            grid-template-columns: repeat(3, 1fr);
            gap: 15px;
            margin-bottom: 30px;
          }
          .card {
            background: #f8f9fa;
            border: 1px solid #dee2e6;
            border-radius: 8px;
            padding: 20px;
            text-align: center;
          }
          .card.primary {
            background: #1a1a1a;
            color: white;
            border-color: #1a1a1a;
          }
          .card-label {
            font-size: 12px;
            text-transform: uppercase;
            letter-spacing: 1px;
            margin-bottom: 8px;
            opacity: 0.8;
          }
          .card-value {
            font-size: 32px;
            font-weight: bold;
          }
          .card-detail {
            font-size: 13px;
            margin-top: 5px;
            opacity: 0.7;
          }
          .section {
            margin-bottom: 30px;
          }
          .section h2 {
            font-size: 18px;
            color: #1a1a1a;
            margin-bottom: 15px;
            padding-bottom: 8px;
            border-bottom: 1px solid #eee;
          }
          table {
            width: 100%;
            border-collapse: collapse;
            margin-bottom: 20px;
          }
          th {
            background: #1a1a1a;
            color: white;
            padding: 10px 12px;
            text-align: left;
            font-size: 13px;
            font-weight: 600;
          }
          td {
            padding: 10px 12px;
            border-bottom: 1px solid #eee;
            font-size: 13px;
          }
          tr:hover td {
            background: #f8f9fa;
          }
          .text-right { text-align: right; }
          .text-center { text-align: center; }
          .status-dot {
            display: inline-block;
            width: 10px;
            height: 10px;
            border-radius: 50%;
            margin-right: 8px;
          }
          .progress-bar {
            width: 100%;
            height: 6px;
            background: #eee;
            border-radius: 3px;
            overflow: hidden;
          }
          .progress-fill {
            height: 100%;
            border-radius: 3px;
            transition: width 0.3s;
          }
          .footer {
            margin-top: 40px;
            padding-top: 20px;
            border-top: 1px solid #eee;
            font-size: 11px;
            color: #999;
            text-align: center;
          }
          .highlight-box {
            background: #fff3cd;
            border-left: 4px solid #ffc107;
            padding: 12px 15px;
            margin-bottom: 20px;
            font-size: 13px;
            border-radius: 4px;
          }
          @media print {
            body { padding: 20px; }
            .summary-cards { grid-template-columns: repeat(3, 1fr); }
          }
        </style>
      </head>
      <body>
        <div class="header">
          <h1>📊 Отчёт о движении отправлений</h1>
          <div class="period">
            Период: ${formatDate(appliedFilter.from)} - ${formatDate(appliedFilter.to)}
            ${!appliedFilter.from && !appliedFilter.to ? '(все время)' : ''}
          </div>
        </div>

        <div class="summary-cards">
          <div class="card primary">
            <div class="card-label">Всего отправлений</div>
            <div class="card-value">${totalMovements}</div>
            <div class="card-detail">за выбранный период</div>
          </div>
          <div class="card">
            <div class="card-label">В обработке</div>
            <div class="card-value">${statusStats['Принята'] + statusStats['В пути']}</div>
            <div class="card-detail">принято + в пути</div>
          </div>
          <div class="card">
            <div class="card-label">Завершено</div>
            <div class="card-value">${statusStats['Выдана'] + statusStats['Утилизирована']}</div>
            <div class="card-detail">выдано + утилизировано</div>
          </div>
        </div>

        <div class="section">
          <h2>📈 Распределение по статусам</h2>
          <table>
            <thead>
              <tr>
                <th>Статус</th>
                <th class="text-center">Количество</th>
                <th class="text-center">Доля</th>
                <th>Прогресс</th>
              </tr>
            </thead>
            <tbody>
              ${STATUSES.map(status => `
                <tr>
                  <td>
                    <span class="status-dot" style="background: ${statusColors[status]}"></span>
                    <strong>${STATUS_LABELS[status]}</strong>
                  </td>
                  <td class="text-center"><strong>${statusStats[status]}</strong></td>
                  <td class="text-center">${totalMovements > 0 ? ((statusStats[status] / totalMovements) * 100).toFixed(1) : 0}%</td>
                  <td>
                    <div class="progress-bar">
                      <div class="progress-fill" style="width: ${totalMovements > 0 ? ((statusStats[status] / totalMovements) * 100).toFixed(1) : 0}%; background: ${statusColors[status]}"></div>
                    </div>
                  </td>
                </tr>
              `).join('')}
              <tr style="font-weight: bold; background: #f8f9fa;">
                <td><strong>ИТОГО</strong></td>
                <td class="text-center"><strong>${totalMovements}</strong></td>
                <td class="text-center"><strong>100%</strong></td>
                <td></td>
              </tr>
            </tbody>
          </table>
        </div>

        ${statusHistory.length > 0 ? `
        <div class="section">
          <h2>📅 Динамика по месяцам</h2>
          <table>
            <thead>
              <tr>
                <th>Период</th>
                ${STATUSES.map(s => `<th class="text-center">${STATUS_LABELS[s]}</th>`).join('')}
                <th class="text-center"><strong>Всего</strong></th>
              </tr>
            </thead>
            <tbody>
              ${statusHistory.map(month => `
                <tr>
                  <td><strong>${month.month}</strong></td>
                  ${STATUSES.map(s => `<td class="text-center">${month[s] || 0}</td>`).join('')}
                  <td class="text-center"><strong>${month['Всего']}</strong></td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        </div>
        ` : ''}


        <div class="footer">
          <p>Отчёт сгенерирован автоматически • ${new Date().toLocaleDateString('ru-RU', { 
            day: 'numeric', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' 
          })}</p>
          <p>Система управления логистикой отправлений</p>
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

  if (loading) {
    return (
      <div className={styles.pageWrapper}>
        <Header />
        <main className={styles.content}>
          <h1>Отчёт о движении отправлений</h1>
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
          <h1>Отчёт о движении отправлений</h1>
          <div className={styles.error}>Не удалось загрузить данные. Попробуйте позже.</div>
        </main>
        <Footer />
      </div>
    );
  }

  const totalMovements = statusStats['Всего'];

  return (
    <div className={styles.pageWrapper}>
      <Header />
      <main className={styles.content}>
        <div className={styles.pageHeader}>
          <h2>📊 Отчёт о движении отправлений</h2>
          <Button 
            variant="primary" 
            onClick={generatePDF}
            style={{ marginLeft: 'auto' }}
          >
            📄 Сформировать PDF
          </Button>
        </div>

        {/* Фильтры */}
        <div style={{ 
          marginBottom: '25px', 
          padding: '20px', 
          backgroundColor: '#1a1a1a', 
          borderRadius: '8px',
          display: 'flex',
          gap: '20px',
          alignItems: 'flex-end',
          flexWrap: 'wrap'
        }}>
          <div style={{ flex: '1', minWidth: '200px' }}>
            <label style={{ display: 'block', marginBottom: '8px', color: '#aaa', fontSize: '13px' }}>
              Дата с
            </label>
            <input
              type="date"
              value={dateFrom}
              onChange={(e) => setDateFrom(e.target.value)}
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
          <div style={{ flex: '1', minWidth: '200px' }}>
            <label style={{ display: 'block', marginBottom: '8px', color: '#aaa', fontSize: '13px' }}>
              Дата по
            </label>
            <input
              type="date"
              value={dateTo}
              onChange={(e) => setDateTo(e.target.value)}
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
          <div style={{ display: 'flex', gap: '10px' }}>
            <Button variant="primary" onClick={handleApplyFilter}>
              🔍 Применить
            </Button>
            <Button variant="secondary" onClick={handleResetFilter}>
              ↺ Сбросить
            </Button>
          </div>
        </div>

        {/* Карточки с KPI */}
        <div style={{ 
          display: 'grid', 
          gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', 
          gap: '15px',
          marginBottom: '30px'
        }}>
          <div style={{
            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
            padding: '20px',
            borderRadius: '8px',
            color: 'white'
          }}>
            <div style={{ fontSize: '12px', opacity: 0.9, marginBottom: '8px', textTransform: 'uppercase', letterSpacing: '1px' }}>
              Всего отправлений
            </div>
            <div style={{ fontSize: '32px', fontWeight: 'bold' }}>{totalMovements}</div>
            <div style={{ fontSize: '12px', opacity: 0.8, marginTop: '5px' }}>за период</div>
          </div>
          
          <div style={{
            background: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
            padding: '20px',
            borderRadius: '8px',
            color: 'white'
          }}>
            <div style={{ fontSize: '12px', opacity: 0.9, marginBottom: '8px', textTransform: 'uppercase', letterSpacing: '1px' }}>
              В обработке
            </div>
            <div style={{ fontSize: '32px', fontWeight: 'bold' }}>
              {statusStats['Принята'] + statusStats['В пути']}
            </div>
            <div style={{ fontSize: '12px', opacity: 0.8, marginTop: '5px' }}>
              принято + в пути
            </div>
          </div>
          
          <div style={{
            background: 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)',
            padding: '20px',
            borderRadius: '8px',
            color: 'white'
          }}>
            <div style={{ fontSize: '12px', opacity: 0.9, marginBottom: '8px', textTransform: 'uppercase', letterSpacing: '1px' }}>
              Готово к выдаче
            </div>
            <div style={{ fontSize: '32px', fontWeight: 'bold' }}>{statusStats['Готова к выдаче']}</div>
            <div style={{ fontSize: '12px', opacity: 0.8, marginTop: '5px' }}>
              {totalMovements > 0 ? ((statusStats['Готова к выдаче'] / totalMovements) * 100).toFixed(1) : 0}% от всех
            </div>
          </div>
          
          <div style={{
            background: 'linear-gradient(135deg, #43e97b 0%, #38f9d7 100%)',
            padding: '20px',
            borderRadius: '8px',
            color: 'white'
          }}>
            <div style={{ fontSize: '12px', opacity: 0.9, marginBottom: '8px', textTransform: 'uppercase', letterSpacing: '1px' }}>
              Завершено
            </div>
            <div style={{ fontSize: '32px', fontWeight: 'bold' }}>
              {statusStats['Выдана'] + statusStats['Утилизирована']}
            </div>
            <div style={{ fontSize: '12px', opacity: 0.8, marginTop: '5px' }}>
              выдано + утилизировано
            </div>
          </div>
        </div>

        {/* Таблица статусов */}
        <div ref={reportRef} className={tableStyles.tableWrapper}>
          <table className={tableStyles.table}>
            <thead>
              <tr>
                <th className={tableStyles.th}>Статус</th>
                <th className={tableStyles.th} style={{ textAlign: 'center' }}>Количество</th>
                <th className={tableStyles.th} style={{ textAlign: 'center' }}>Доля</th>
                <th className={tableStyles.th} style={{ width: '40%' }}>Прогресс</th>
              </tr>
            </thead>
            <tbody>
              {STATUSES.map(status => {
                const count = statusStats[status];
                const percent = totalMovements > 0 ? (count / totalMovements) * 100 : 0;
                
                return (
                  <tr key={status} className={tableStyles.tr}>
                    <td className={tableStyles.td}>
                      <span style={{
                        display: 'inline-block',
                        width: '10px',
                        height: '10px',
                        borderRadius: '50%',
                        backgroundColor: statusColors[status],
                        marginRight: '10px'
                      }}></span>
                      <strong>{STATUS_LABELS[status]}</strong>
                    </td>
                    <td className={tableStyles.td} style={{ textAlign: 'center', fontWeight: 'bold', fontSize: '16px' }}>
                      {count}
                    </td>
                    <td className={tableStyles.td} style={{ textAlign: 'center' }}>
                      {percent.toFixed(1)}%
                    </td>
                    <td className={tableStyles.td}>
                      <div style={{
                        width: '100%',
                        height: '20px',
                        backgroundColor: '#2a2a2a',
                        borderRadius: '10px',
                        overflow: 'hidden',
                        position: 'relative'
                      }}>
                        <div style={{
                          width: `${percent}%`,
                          height: '100%',
                          backgroundColor: statusColors[status],
                          borderRadius: '10px',
                          transition: 'width 0.5s ease',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          minWidth: count > 0 ? '35px' : '0'
                        }}>
                          {count > 0 && (
                            <span style={{ fontSize: '11px', color: 'white', fontWeight: 'bold' }}>
                              {count}
                            </span>
                          )}
                        </div>
                      </div>
                    </td>
                  </tr>
                );
              })}
              <tr className={tableStyles.tr} style={{ backgroundColor: 'rgba(255,255,255,0.03)', fontWeight: 'bold' }}>
                <td className={tableStyles.td}>
                  <strong>ИТОГО</strong>
                </td>
                <td className={tableStyles.td} style={{ textAlign: 'center', fontSize: '16px' }}>
                  <strong>{totalMovements}</strong>
                </td>
                <td className={tableStyles.td} style={{ textAlign: 'center' }}>
                  <strong>100%</strong>
                </td>
                <td className={tableStyles.td}></td>
              </tr>
            </tbody>
          </table>
        </div>

        {/* Детализация по месяцам */}
        {statusHistory.length > 0 && (
          <div style={{ marginTop: '30px' }}>
            <h3 style={{ marginBottom: '15px', color: '#aaa' }}>📅 Динамика по месяцам</h3>
            <div className={tableStyles.tableWrapper}>
              <table className={tableStyles.table}>
                <thead>
                  <tr>
                    <th className={tableStyles.th}>Период</th>
                    {STATUSES.map(status => (
                      <th key={status} className={tableStyles.th} style={{ textAlign: 'center' }}>
                        {STATUS_LABELS[status]}
                      </th>
                    ))}
                    <th className={tableStyles.th} style={{ textAlign: 'center' }}>
                      <strong>Всего</strong>
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {statusHistory.map((month, idx) => (
                    <tr key={idx} className={tableStyles.tr}>
                      <td className={tableStyles.td}><strong>{month.month}</strong></td>
                      {STATUSES.map(status => (
                        <td key={status} className={tableStyles.td} style={{ textAlign: 'center' }}>
                          {month[status] || 0}
                        </td>
                      ))}
                      <td className={tableStyles.td} style={{ textAlign: 'center', fontWeight: 'bold' }}>
                        {month['Всего']}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Итоговая сводка */}
        <div style={{ 
          marginTop: '25px', 
          padding: '15px', 
          backgroundColor: 'rgba(0, 123, 255, 0.05)', 
          borderRadius: '8px',
          fontSize: '13px',
          color: '#999',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center'
        }}>
          <span>
            Отчётный период: <strong>
              {appliedFilter.from || appliedFilter.to 
                ? `${appliedFilter.from || '...'} - ${appliedFilter.to || '...'}`
                : 'все время'}
            </strong>
          </span>
          <span>
            Всего отправлений в отчёте: <strong>{totalMovements}</strong>
          </span>
        </div>
      </main>
      <Footer />
    </div>
  );
};