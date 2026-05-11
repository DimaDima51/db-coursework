import { Header } from '../../components/header/Header';
import { Footer } from '../../components/footer/Footer';
import styles from "./../default.module.css";
import { Button } from '../../components/ui/Button/Button';
import { Loader } from '../../components/ui/Loader/Loader';
import { useAsyncData } from '../../hooks/useAsyncData';
import { getShipments, getTariffs, getServices } from '../../api/axios';
import { useState, useMemo } from 'react';
import tableStyles from '../orders/OrderListPage.module.css';

export const FinanceReportPage = () => {
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [appliedFilter, setAppliedFilter] = useState({ from: '', to: '' });
  
  const { data: shipmentsData, loading: shipmentsLoading, error: shipmentsError } = useAsyncData(async () => {
    const response = await getShipments();
    return response.data;
  }, []);

  const { data: tariffsData } = useAsyncData(async () => {
    const response = await getTariffs();
    return response.data;
  }, []);

  const { data: servicesData } = useAsyncData(async () => {
    const response = await getServices();
    return response.data;
  }, []);

  const shipments = shipmentsData ?? [];
  const tariffs = tariffsData ?? [];
  const services = servicesData ?? [];

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

  const financeStats = useMemo(() => {
    // Общая сумма
    const totalRevenue = filteredShipments.reduce((sum, s) => {
      return sum + parseFloat(s.total_payable || 0);
    }, 0);

    // Сумма по тарифам (базовые услуги)
    const tariffRevenue = {};
    filteredShipments.forEach(shipment => {
      const tariff = tariffs.find(t => t.tariff_code === shipment.tariff_code);
      const tariffName = tariff ? `${tariff.tariff_name || tariff.tariff_code}` : (shipment.tariff_code || 'Без тарифа');
      const amount = parseFloat(shipment.base_cost || shipment.total_payable || 0);
      
      if (!tariffRevenue[tariffName]) {
        tariffRevenue[tariffName] = { count: 0, total: 0 };
      }
      tariffRevenue[tariffName].count += 1;
      tariffRevenue[tariffName].total += amount;
    });

    // Дополнительные услуги (если есть в данных)
    const additionalServices = {};
    let additionalTotal = 0;
    
    filteredShipments.forEach(shipment => {
      if (shipment.additional_services && Array.isArray(shipment.additional_services)) {
        shipment.additional_services.forEach(service => {
          const serviceName = service.service_name || 'Доп. услуга';
          const amount = parseFloat(service.cost || 0);
          additionalTotal += amount;
          
          if (!additionalServices[serviceName]) {
            additionalServices[serviceName] = { count: 0, total: 0 };
          }
          additionalServices[serviceName].count += 1;
          additionalServices[serviceName].total += amount;
        });
      }
      
      if (shipment.additional_services && typeof shipment.additional_services === 'string') {
        try {
          const parsed = JSON.parse(shipment.additional_services);
          if (Array.isArray(parsed)) {
            parsed.forEach(service => {
              const serviceName = service.service_name || 'Доп. услуга';
              const amount = parseFloat(service.cost || 0);
              additionalTotal += amount;
              
              if (!additionalServices[serviceName]) {
                additionalServices[serviceName] = { count: 0, total: 0 };
              }
              additionalServices[serviceName].count += 1;
              additionalServices[serviceName].total += amount;
            });
          }
        } catch (e) {
        }
      }
    });

    // По месяцам
    const monthlyRevenue = {};
    filteredShipments.forEach(shipment => {
      if (!shipment.registration_date) return;
      const date = new Date(shipment.registration_date);
      const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
      
      if (!monthlyRevenue[monthKey]) {
        monthlyRevenue[monthKey] = {
          month: date.toLocaleDateString('ru-RU', { month: 'long', year: 'numeric' }),
          baseRevenue: 0,
          additionalRevenue: 0,
          total: 0,
          count: 0
        };
      }
      
      const baseAmount = parseFloat(shipment.base_cost || shipment.total_payable || 0);
      monthlyRevenue[monthKey].baseRevenue += baseAmount;
      monthlyRevenue[monthKey].total += parseFloat(shipment.total_payable || 0);
      monthlyRevenue[monthKey].count += 1;
    });

    // По типам отправлений
    const packageTypeRevenue = {};
    filteredShipments.forEach(shipment => {
      const type = shipment.package_type || 'Не указан';
      const amount = parseFloat(shipment.total_payable || 0);
      
      if (!packageTypeRevenue[type]) {
        packageTypeRevenue[type] = { count: 0, total: 0 };
      }
      packageTypeRevenue[type].count += 1;
      packageTypeRevenue[type].total += amount;
    });

    // Средний чек
    const averageCheck = filteredShipments.length > 0 
      ? totalRevenue / filteredShipments.length 
      : 0;

    return {
      totalRevenue,
      tariffRevenue: Object.entries(tariffRevenue).sort((a, b) => b[1].total - a[1].total),
      additionalServices: Object.entries(additionalServices).sort((a, b) => b[1].total - a[1].total),
      additionalTotal,
      monthlyRevenue: Object.values(monthlyRevenue).sort((a, b) => a.month.localeCompare(b.month)),
      packageTypeRevenue: Object.entries(packageTypeRevenue).sort((a, b) => b[1].total - a[1].total),
      averageCheck,
      totalShipments: filteredShipments.length
    };
  }, [filteredShipments, tariffs]);

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

    const formatMoney = (amount) => {
      return new Intl.NumberFormat('ru-RU', {
        style: 'currency',
        currency: 'RUB',
        minimumFractionDigits: 2
      }).format(amount);
    };

    const tariffRows = financeStats.tariffRevenue.map(([name, data]) => `
      <tr>
        <td><strong>${name}</strong></td>
        <td class="text-center">${data.count}</td>
        <td class="text-right">${formatMoney(data.total)}</td>
        <td class="text-right">${financeStats.totalRevenue > 0 ? ((data.total / financeStats.totalRevenue) * 100).toFixed(1) : 0}%</td>
      </tr>
    `).join('');

    const additionalRows = financeStats.additionalServices.length > 0 
      ? financeStats.additionalServices.map(([name, data]) => `
        <tr>
          <td><strong>${name}</strong></td>
          <td class="text-center">${data.count}</td>
          <td class="text-right">${formatMoney(data.total)}</td>
          <td class="text-right">${financeStats.additionalTotal > 0 ? ((data.total / financeStats.additionalTotal) * 100).toFixed(1) : 0}%</td>
        </tr>
      `).join('')
      : '<tr><td colspan="4" class="text-center" style="color: #999;">Нет данных о дополнительных услугах</td></tr>';

    const monthlyRows = financeStats.monthlyRevenue.map(month => `
      <tr>
        <td><strong>${month.month}</strong></td>
        <td class="text-center">${month.count}</td>
        <td class="text-right">${formatMoney(month.baseRevenue)}</td>
        <td class="text-right">${formatMoney(month.total)}</td>
      </tr>
    `).join('');

    const printContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <title>Финансовый отчёт по услугам доставки</title>
        <style>
          * { margin: 0; padding: 0; box-sizing: border-box; }
          body { 
            font-family: 'Arial', sans-serif; 
            padding: 40px; 
            color: #1a1a1a;
            line-height: 1.6;
          }
          .header {
            text-align: center;
            margin-bottom: 30px;
            border-bottom: 3px solid #1a1a1a;
            padding-bottom: 20px;
          }
          .header h1 {
            font-size: 26px;
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
            grid-template-columns: repeat(4, 1fr);
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
          .card.accent {
            background: #1a1a1a;
            color: white;
            border-color: #1a1a1a;
          }
          .card-label {
            font-size: 11px;
            text-transform: uppercase;
            letter-spacing: 1.5px;
            margin-bottom: 8px;
            opacity: 0.8;
          }
          .card-value {
            font-size: 28px;
            font-weight: bold;
          }
          .card-detail {
            font-size: 12px;
            margin-top: 5px;
            opacity: 0.7;
          }
          .section {
            margin-bottom: 30px;
            page-break-inside: avoid;
          }
          .section h2 {
            font-size: 18px;
            color: #1a1a1a;
            margin-bottom: 15px;
            padding-bottom: 8px;
            border-bottom: 2px solid #eee;
          }
          table {
            width: 100%;
            border-collapse: collapse;
            margin-bottom: 15px;
          }
          th {
            background: #1a1a1a;
            color: white;
            padding: 10px 12px;
            text-align: left;
            font-size: 12px;
            font-weight: 600;
            text-transform: uppercase;
            letter-spacing: 0.5px;
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
          .total-row td {
            font-weight: bold;
            background: #f8f9fa;
            border-top: 2px solid #1a1a1a;
          }
          .footer {
            margin-top: 40px;
            padding-top: 20px;
            border-top: 1px solid #eee;
            font-size: 11px;
            color: #999;
            text-align: center;
          }
          .highlight-positive {
            color: #28a745;
            font-weight: bold;
          }
          @media print {
            body { padding: 20px; }
          }
        </style>
      </head>
      <body>
        <div class="header">
          <h1>💰 Финансовый отчёт по услугам доставки</h1>
          <div class="period">
            Период: ${formatDate(appliedFilter.from)} - ${formatDate(appliedFilter.to)}
            ${!appliedFilter.from && !appliedFilter.to ? '(все время)' : ''}
          </div>
        </div>

        <div class="summary-cards">
          <div class="card accent">
            <div class="card-label">Общая выручка</div>
            <div class="card-value">${formatMoney(financeStats.totalRevenue)}</div>
            <div class="card-detail">за период</div>
          </div>
          <div class="card">
            <div class="card-label">Отправлений</div>
            <div class="card-value">${financeStats.totalShipments}</div>
            <div class="card-detail">оформлено</div>
          </div>
          <div class="card">
            <div class="card-label">Средний чек</div>
            <div class="card-value">${formatMoney(financeStats.averageCheck)}</div>
            <div class="card-detail">на отправление</div>
          </div>
          <div class="card">
            <div class="card-label">Доп. услуги</div>
            <div class="card-value">${formatMoney(financeStats.additionalTotal)}</div>
            <div class="card-detail">${financeStats.totalRevenue > 0 ? ((financeStats.additionalTotal / financeStats.totalRevenue) * 100).toFixed(1) : 0}% от выручки</div>
          </div>
        </div>

        <div class="section">
          <h2>📦 Детализация по базовым тарифам</h2>
          <table>
            <thead>
              <tr>
                <th>Тариф</th>
                <th class="text-center">Кол-во</th>
                <th class="text-right">Сумма</th>
                <th class="text-right">Доля</th>
              </tr>
            </thead>
            <tbody>
              ${tariffRows}
              <tr class="total-row">
                <td>ИТОГО</td>
                <td class="text-center">${financeStats.totalShipments}</td>
                <td class="text-right">${formatMoney(financeStats.totalRevenue)}</td>
                <td class="text-right">100%</td>
              </tr>
            </tbody>
          </table>
        </div>

        <div class="section">
          <h2>🔧 Детализация по дополнительным услугам</h2>
          <table>
            <thead>
              <tr>
                <th>Услуга</th>
                <th class="text-center">Кол-во</th>
                <th class="text-right">Сумма</th>
                <th class="text-right">Доля</th>
              </tr>
            </thead>
            <tbody>
              ${additionalRows}
              ${financeStats.additionalServices.length > 0 ? `
              <tr class="total-row">
                <td>ИТОГО доп. услуги</td>
                <td class="text-center">-</td>
                <td class="text-right">${formatMoney(financeStats.additionalTotal)}</td>
                <td class="text-right">100%</td>
              </tr>
              ` : ''}
            </tbody>
          </table>
        </div>

        <div class="section">
          <h2>📅 Помесячная выручка</h2>
          <table>
            <thead>
              <tr>
                <th>Месяц</th>
                <th class="text-center">Отправлений</th>
                <th class="text-right">Базовые услуги</th>
                <th class="text-right">Общая сумма</th>
              </tr>
            </thead>
            <tbody>
              ${monthlyRows}
              <tr class="total-row">
                <td>ИТОГО</td>
                <td class="text-center">${financeStats.totalShipments}</td>
                <td class="text-right">${formatMoney(financeStats.totalRevenue - financeStats.additionalTotal)}</td>
                <td class="text-right">${formatMoney(financeStats.totalRevenue)}</td>
              </tr>
            </tbody>
          </table>
        </div>

        <div class="footer">
          <p>Отчёт сгенерирован автоматически • ${new Date().toLocaleDateString('ru-RU', { 
            day: 'numeric', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' 
          })}</p>
          <p>Система управления логистикой отправлений • Финансовый отчёт</p>
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

  if (shipmentsLoading) {
    return (
      <div className={styles.pageWrapper}>
        <Header />
        <main className={styles.content}>
          <h1>Финансовый отчёт по услугам доставки</h1>
          <Loader />
        </main>
        <Footer />
      </div>
    );
  }

  if (shipmentsError) {
    return (
      <div className={styles.pageWrapper}>
        <Header />
        <main className={styles.content}>
          <h1>Финансовый отчёт по услугам доставки</h1>
          <div className={styles.error}>Не удалось загрузить данные. Попробуйте позже.</div>
        </main>
        <Footer />
      </div>
    );
  }

  const formatMoney = (amount) => {
    return new Intl.NumberFormat('ru-RU', {
      style: 'currency',
      currency: 'RUB',
      minimumFractionDigits: 2
    }).format(amount);
  };

  return (
    <div className={styles.pageWrapper}>
      <Header />
      <main className={styles.content}>
        <div className={styles.pageHeader}>
          <h2>💰 Финансовый отчёт по услугам доставки</h2>
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

        <div style={{ 
          display: 'grid', 
          gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', 
          gap: '15px',
          marginBottom: '30px'
        }}>
          <div style={{
            background: 'linear-gradient(135deg, #f7971e 0%, #ffd200 100%)',
            padding: '20px',
            borderRadius: '8px',
            color: '#1a1a1a'
          }}>
            <div style={{ fontSize: '11px', opacity: 0.8, marginBottom: '8px', textTransform: 'uppercase', letterSpacing: '1.5px', fontWeight: 'bold' }}>
              Общая выручка
            </div>
            <div style={{ fontSize: '28px', fontWeight: 'bold' }}>{formatMoney(financeStats.totalRevenue)}</div>
            <div style={{ fontSize: '12px', opacity: 0.7, marginTop: '5px' }}>за период</div>
          </div>
          
          <div style={{
            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
            padding: '20px',
            borderRadius: '8px',
            color: 'white'
          }}>
            <div style={{ fontSize: '11px', opacity: 0.9, marginBottom: '8px', textTransform: 'uppercase', letterSpacing: '1.5px' }}>
              Отправлений
            </div>
            <div style={{ fontSize: '28px', fontWeight: 'bold' }}>{financeStats.totalShipments}</div>
            <div style={{ fontSize: '12px', opacity: 0.8, marginTop: '5px' }}>оформлено</div>
          </div>
          
          <div style={{
            background: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
            padding: '20px',
            borderRadius: '8px',
            color: 'white'
          }}>
            <div style={{ fontSize: '11px', opacity: 0.9, marginBottom: '8px', textTransform: 'uppercase', letterSpacing: '1.5px' }}>
              Средний чек
            </div>
            <div style={{ fontSize: '28px', fontWeight: 'bold' }}>{formatMoney(financeStats.averageCheck)}</div>
            <div style={{ fontSize: '12px', opacity: 0.8, marginTop: '5px' }}>на отправление</div>
          </div>
          
          <div style={{
            background: 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)',
            padding: '20px',
            borderRadius: '8px',
            color: 'white'
          }}>
            <div style={{ fontSize: '11px', opacity: 0.9, marginBottom: '8px', textTransform: 'uppercase', letterSpacing: '1.5px' }}>
              Доп. услуги
            </div>
            <div style={{ fontSize: '28px', fontWeight: 'bold' }}>{formatMoney(financeStats.additionalTotal)}</div>
            <div style={{ fontSize: '12px', opacity: 0.8, marginTop: '5px' }}>
              {financeStats.totalRevenue > 0 
                ? ((financeStats.additionalTotal / financeStats.totalRevenue) * 100).toFixed(1) 
                : 0}% от выручки
            </div>
          </div>
        </div>

        {/* Таблица по тарифам */}
        <div style={{ marginBottom: '30px' }}>
          <h3 style={{ marginBottom: '15px', color: '#aaa' }}>📦 Детализация по базовым тарифам</h3>
          <div className={tableStyles.tableWrapper}>
            <table className={tableStyles.table}>
              <thead>
                <tr>
                  <th className={tableStyles.th}>Тариф</th>
                  <th className={tableStyles.th} style={{ textAlign: 'center' }}>Кол-во</th>
                  <th className={tableStyles.th} style={{ textAlign: 'right' }}>Сумма</th>
                  <th className={tableStyles.th} style={{ textAlign: 'right' }}>Доля</th>
                  <th className={tableStyles.th} style={{ width: '30%' }}>Структура</th>
                </tr>
              </thead>
              <tbody>
                {financeStats.tariffRevenue.length === 0 ? (
                  <tr>
                    <td colSpan={5} className={tableStyles.empty}>Нет данных по тарифам</td>
                  </tr>
                ) : (
                  financeStats.tariffRevenue.map(([name, data]) => {
                    const percent = financeStats.totalRevenue > 0 
                      ? (data.total / financeStats.totalRevenue) * 100 
                      : 0;
                    
                    return (
                      <tr key={name} className={tableStyles.tr}>
                        <td className={tableStyles.td}><strong>{name}</strong></td>
                        <td className={tableStyles.td} style={{ textAlign: 'center' }}>{data.count}</td>
                        <td className={tableStyles.td} style={{ textAlign: 'right', fontWeight: 'bold' }}>
                          {formatMoney(data.total)}
                        </td>
                        <td className={tableStyles.td} style={{ textAlign: 'right' }}>
                          {percent.toFixed(1)}%
                        </td>
                        <td className={tableStyles.td}>
                          <div style={{
                            width: '100%',
                            height: '20px',
                            backgroundColor: '#2a2a2a',
                            borderRadius: '10px',
                            overflow: 'hidden'
                          }}>
                            <div style={{
                              width: `${percent}%`,
                              height: '100%',
                              background: 'linear-gradient(90deg, #f7971e, #ffd200)',
                              borderRadius: '10px',
                              minWidth: data.count > 0 ? '40px' : '0',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center'
                            }}>
                              {data.count > 0 && (
                                <span style={{ fontSize: '11px', color: '#1a1a1a', fontWeight: 'bold' }}>
                                  {percent.toFixed(1)}%
                                </span>
                              )}
                            </div>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
                <tr className={tableStyles.tr} style={{ backgroundColor: 'rgba(255,255,255,0.05)', fontWeight: 'bold' }}>
                  <td className={tableStyles.td}><strong>ИТОГО</strong></td>
                  <td className={tableStyles.td} style={{ textAlign: 'center' }}>
                    <strong>{financeStats.totalShipments}</strong>
                  </td>
                  <td className={tableStyles.td} style={{ textAlign: 'right' }}>
                    <strong>{formatMoney(financeStats.totalRevenue)}</strong>
                  </td>
                  <td className={tableStyles.td} style={{ textAlign: 'right' }}>
                    <strong>100%</strong>
                  </td>
                  <td className={tableStyles.td}></td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        {/* Таблица по дополнительным услугам */}
        <div style={{ marginBottom: '30px' }}>
          <h3 style={{ marginBottom: '15px', color: '#aaa' }}>🔧 Детализация по дополнительным услугам</h3>
          <div className={tableStyles.tableWrapper}>
            <table className={tableStyles.table}>
              <thead>
                <tr>
                  <th className={tableStyles.th}>Услуга</th>
                  <th className={tableStyles.th} style={{ textAlign: 'center' }}>Кол-во</th>
                  <th className={tableStyles.th} style={{ textAlign: 'right' }}>Сумма</th>
                  <th className={tableStyles.th} style={{ textAlign: 'right' }}>Доля в доп. услугах</th>
                  <th className={tableStyles.th} style={{ width: '30%' }}>Структура</th>
                </tr>
              </thead>
              <tbody>
                {financeStats.additionalServices.length === 0 ? (
                  <tr>
                    <td colSpan={5} className={tableStyles.empty}>
                      Нет данных о дополнительных услугах
                    </td>
                  </tr>
                ) : (
                  financeStats.additionalServices.map(([name, data]) => {
                    const percent = financeStats.additionalTotal > 0 
                      ? (data.total / financeStats.additionalTotal) * 100 
                      : 0;
                    
                    return (
                      <tr key={name} className={tableStyles.tr}>
                        <td className={tableStyles.td}><strong>{name}</strong></td>
                        <td className={tableStyles.td} style={{ textAlign: 'center' }}>{data.count}</td>
                        <td className={tableStyles.td} style={{ textAlign: 'right', fontWeight: 'bold' }}>
                          {formatMoney(data.total)}
                        </td>
                        <td className={tableStyles.td} style={{ textAlign: 'right' }}>
                          {percent.toFixed(1)}%
                        </td>
                        <td className={tableStyles.td}>
                          <div style={{
                            width: '100%',
                            height: '20px',
                            backgroundColor: '#2a2a2a',
                            borderRadius: '10px',
                            overflow: 'hidden'
                          }}>
                            <div style={{
                              width: `${percent}%`,
                              height: '100%',
                              background: 'linear-gradient(90deg, #4facfe, #00f2fe)',
                              borderRadius: '10px',
                              minWidth: data.count > 0 ? '40px' : '0',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center'
                            }}>
                              {data.count > 0 && (
                                <span style={{ fontSize: '11px', color: '#1a1a1a', fontWeight: 'bold' }}>
                                  {percent.toFixed(1)}%
                                </span>
                              )}
                            </div>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
                {financeStats.additionalServices.length > 0 && (
                  <tr className={tableStyles.tr} style={{ backgroundColor: 'rgba(255,255,255,0.05)', fontWeight: 'bold' }}>
                    <td className={tableStyles.td}><strong>ИТОГО доп. услуги</strong></td>
                    <td className={tableStyles.td} style={{ textAlign: 'center' }}>-</td>
                    <td className={tableStyles.td} style={{ textAlign: 'right' }}>
                      <strong>{formatMoney(financeStats.additionalTotal)}</strong>
                    </td>
                    <td className={tableStyles.td} style={{ textAlign: 'right' }}>
                      <strong>100%</strong>
                    </td>
                    <td className={tableStyles.td}></td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Помесячная выручка */}
        {financeStats.monthlyRevenue.length > 0 && (
          <div style={{ marginBottom: '30px' }}>
            <h3 style={{ marginBottom: '15px', color: '#aaa' }}>📅 Помесячная детализация</h3>
            <div className={tableStyles.tableWrapper}>
              <table className={tableStyles.table}>
                <thead>
                  <tr>
                    <th className={tableStyles.th}>Месяц</th>
                    <th className={tableStyles.th} style={{ textAlign: 'center' }}>Отправлений</th>
                    <th className={tableStyles.th} style={{ textAlign: 'right' }}>Базовые услуги</th>
                    <th className={tableStyles.th} style={{ textAlign: 'right' }}>Общая сумма</th>
                    <th className={tableStyles.th} style={{ textAlign: 'right' }}>Средний чек</th>
                  </tr>
                </thead>
                <tbody>
                  {financeStats.monthlyRevenue.map((month) => (
                    <tr key={month.month} className={tableStyles.tr}>
                      <td className={tableStyles.td}><strong>{month.month}</strong></td>
                      <td className={tableStyles.td} style={{ textAlign: 'center' }}>{month.count}</td>
                      <td className={tableStyles.td} style={{ textAlign: 'right' }}>
                        {formatMoney(month.baseRevenue)}
                      </td>
                      <td className={tableStyles.td} style={{ textAlign: 'right', fontWeight: 'bold' }}>
                        {formatMoney(month.total)}
                      </td>
                      <td className={tableStyles.td} style={{ textAlign: 'right' }}>
                        {month.count > 0 ? formatMoney(month.total / month.count) : formatMoney(0)}
                      </td>
                    </tr>
                  ))}
                  <tr className={tableStyles.tr} style={{ backgroundColor: 'rgba(255,255,255,0.05)', fontWeight: 'bold' }}>
                    <td className={tableStyles.td}><strong>ИТОГО</strong></td>
                    <td className={tableStyles.td} style={{ textAlign: 'center' }}>
                      <strong>{financeStats.totalShipments}</strong>
                    </td>
                    <td className={tableStyles.td} style={{ textAlign: 'right' }}>
                      <strong>{formatMoney(financeStats.totalRevenue - financeStats.additionalTotal)}</strong>
                    </td>
                    <td className={tableStyles.td} style={{ textAlign: 'right' }}>
                      <strong>{formatMoney(financeStats.totalRevenue)}</strong>
                    </td>
                    <td className={tableStyles.td} style={{ textAlign: 'right' }}>
                      <strong>{formatMoney(financeStats.averageCheck)}</strong>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Итоговая сводка */}
        <div style={{ 
          marginTop: '25px', 
          padding: '15px', 
          backgroundColor: 'rgba(255, 215, 0, 0.05)', 
          borderRadius: '8px',
          fontSize: '13px',
          color: '#999',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '10px'
        }}>
          <span>
            Отчётный период: <strong>
              {appliedFilter.from || appliedFilter.to 
                ? `${appliedFilter.from || '...'} - ${appliedFilter.to || '...'}`
                : 'все время'}
            </strong>
          </span>
          <span>
            Общая выручка: <strong style={{ color: '#ffd200' }}>{formatMoney(financeStats.totalRevenue)}</strong>
          </span>
          <span>
            Отправлений: <strong>{financeStats.totalShipments}</strong>
          </span>
        </div>
      </main>
      <Footer />
    </div>
  );
};