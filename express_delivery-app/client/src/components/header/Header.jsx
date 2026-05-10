import { Link } from "react-router-dom";
import { Dropbox } from "../ui/DropBox/DropBox";
import { useAuth } from "../../auth/AuthProvider";
import styles from "./Header.module.css";

export const Header = () => {
  const { user, logout } = useAuth();
  
  const userRole = user?.position_name;
  
  // Определяем доступные разделы меню для каждой роли
  const getAvailableMenus = () => {
    const menus = [];
    
    // Клиенты - доступно: Системный администратор, Администратор, Сотрудник пункта
    if (['Системный администратор', 'Администратор', 'Сотрудник пункта'].includes(userRole)) {
      menus.push(
        <Dropbox key="clients" label="Клиенты" items={[
          { label: "Все клиенты", to: "/clients" },
          { label: "Добавить нового", to: "/clients/new" },
        ]} />
      );
    }
    
    // Отправления - доступно: Системный администратор, Администратор, Сотрудник пункта, Курьер
    if (['Системный администратор', 'Администратор', 'Сотрудник пункта', 'Курьер'].includes(userRole)) {
      const orderItems = [];
      
      // Общие пункты для всех ролей
      orderItems.push(
        { label: "Список отправлений", to: "/orders" }
      );
      
      // Пункты только для не-курьеров
      if (userRole !== 'Курьер') {
        orderItems.push(
          { label: "Приём и оформление", to: "/orders/create" },
          { label: "Выдача посылок", to: "/orders/issue" },
          { label: "Невостребованные", to: "/orders/unclaimed" },
          { label: "Перемещение (Акты)", to: "/orders/transfer-acts" }
        );
      }
      
      menus.push(
        <Dropbox key="orders" label="Отправления" items={orderItems} />
      );
    }
    
    // Сотрудники - доступно: Системный администратор, Администратор
    if (['Системный администратор', 'Администратор'].includes(userRole)) {
      menus.push(
        <Dropbox key="employees" label="Сотрудники" items={[
          { label: "Все сотрудники", to: "/employees" },
          { label: "Добавить нового", to: "/employees/new" },
        ]} />
      );
    }
    
    // Отчёты - доступно: Системный администратор, Администратор, Сотрудник пункта
    if (['Системный администратор', 'Администратор', 'Сотрудник пункта'].includes(userRole)) {
      const reportItems = [];
      
      // Базовые отчёты - всем операторам и администраторам
      reportItems.push(
        { label: "Движение отправлений", to: "/reports/movement" },
        { label: "Акт приема-передачи", to: "/reports/act" }
      );
      
      // Расширенные отчёты - только администраторам
      if (['Системный администратор', 'Администратор'].includes(userRole)) {
        reportItems.push(
          { label: "Финансовый отчёт", to: "/reports/finance" },
          { label: "Отчет по клиентам", to: "/reports/clients" },
          { label: "Аналитический отчёт", to: "/reports/analytic" }
        );
      }
      
      menus.push(
        <Dropbox key="reports" label="Отчёты" items={reportItems} />
      );
    }
    
    // Администрирование - доступно только: Системный администратор
    if (userRole === 'Системный администратор') {
      menus.push(
        <Dropbox key="admin" label="Администрирование" items={[
          { label: "Пункты приёма/выдачи", to: "/admin/pickup-points" },
          { label: "Тарифы", to: "/admin/tariffs" },
          { label: "Справочник услуг", to: "/admin/services" },
        ]} />
      );
    }
    
    return menus;
  };

  return (
    <header className={styles.header}>
      <Link to="/" className={styles.logo}>Экспресс Доставка</Link>

      <nav className={styles.nav}>
        {getAvailableMenus()}
      </nav>

      <div className={styles.userInfo}>
        <span className={styles.userName}>
          {user?.position_name} - {user?.staff_number}
        </span>
        <button 
          onClick={logout} 
          className={styles.logoutButton}
          title="Выйти из системы"
        >
          Выйти
        </button>
      </div>
    </header>
  );
};