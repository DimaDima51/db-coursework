import { Link } from "react-router-dom";
import { Dropbox } from "../ui/DropBox/DropBox";
import styles from "./Header.module.css";

export const Header = () => {
  // 1. Клиенты (процесс 1.1)
  const clientLinks = [
    { label: "Все клиенты", to: "/clients" },
    { label: "Добавить нового", to: "/clients/new" },
  ];

  // 2. Отправления (процессы 2, 3, 4)
  const orderLinks = [
    { label: "Приём и оформление", to: "/orders/create" },       // 2.1-2.3
    { label: "Список отправлений", to: "/orders" },              // поиск, фильтры
    { label: "Выдача посылок", to: "/orders/issue" },            // 4.2
    { label: "Невостребованные", to: "/orders/unclaimed" },      // 4.3
    { label: "Перемещение (Акты)", to: "/orders/transfer-acts" },// 3.1, 3.2
  ];

  // 3. Сотрудники (процесс 5.1)
  const employeeLinks = [
    { label: "Все сотрудники", to: "/employees" },
    { label: "Добавить нового", to: "/employees/new" },
  ];

  // 4. Отчёты (требования 1.6.3)
  const reportLinks = [
    { label: "Движение отправлений", to: "/reports/movement" },
    { label: "Финансовый отчёт", to: "/reports/finance" },
    { label: "Аналитика по пунктам", to: "/reports/analytics" },
    { label: "Печатные формы", to: "/reports/print-forms" },
  ];

  // 5. Администрирование (процессы 5.2, 5.3) — НОВЫЙ РАЗДЕЛ
  const adminLinks = [
    { label: "Пункты приёма/выдачи", to: "/admin/pickup-points" },
    { label: "Тарифы", to: "/admin/tariffs" },
    { label: "Справочник услуг", to: "/admin/services" },
  ];

  return (
    <header className={styles.header}>
      <Link to="/" className={styles.logo}>Экспресс Доставка</Link>

      <nav className={styles.nav}>
        <Dropbox label="Клиенты" items={clientLinks} />
        <Dropbox label="Отправления" items={orderLinks} />
        <Dropbox label="Сотрудники" items={employeeLinks} />
        <Dropbox label="Отчёты" items={reportLinks} />
        <Dropbox label="Администрирование" items={adminLinks} />
      </nav>
    </header>
  );
};