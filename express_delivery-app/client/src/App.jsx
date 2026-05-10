import "./App.css";
import { BrowserRouter, Route, Routes, Navigate } from 'react-router-dom';
import { HomePage } from './pages/HomePage';
import { ClientsPage } from './pages/clients/ClientsPage';
import { ClientFormPage } from './pages/clients/ClientFormPage';
import { EmployeesPage } from './pages/employees/EmployeesPage';
import { EmployeesFormPage } from './pages/employees/EmployeesFormPage';

// Отправления
import { OrderCreatePage } from './pages/orders/OrderCreatePage';
import { OrderListPage } from './pages/orders/OrderListPage';
import { OrderIssuePage } from './pages/orders/OrderIssuePage';
import { OrderUnclaimedPage } from './pages/orders/OrderUnclaimedPage';
import { TransferActsPage } from './pages/orders/TransferActsPage';
import { TransferActFormPage } from './pages/orders/TransferActFormPage';

// Отчёты
import { MovementReportPage } from './pages/reports/MovementReportPage';
import { FinanceReportPage } from './pages/reports/FinanceReportPage';
import { AnalyticsReportPage } from './pages/reports/AnalyticsReportPage';
import { PrintFormsPage } from './pages/reports/PrintFormsPage';

// Администрирование
import { PickupPointsPage } from './pages/admin/PickupPointsPage';
import { PickupPointFormPage } from './pages/admin/PickupPointFormPage';
import { TariffsPage } from './pages/admin/TariffsPage';
import { TariffFormPage } from './pages/admin/TariffFormPage';
import { ServicesPage } from './pages/admin/ServicesPage';
import { ServiceFormPage } from './pages/admin/ServiceFormPage';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Главная */}
        <Route path="/" element={<HomePage />} />

        {/* Клиенты */}
        <Route path="/clients" element={<ClientsPage />} />
        <Route path="/clients/new" element={<ClientFormPage />} />
        <Route path="/clients/create" element={<ClientFormPage />} />
        <Route path="/clients/edit/:passport_number" element={<ClientFormPage />} />

        {/* Сотрудники */}
        <Route path="/employees" element={<EmployeesPage />} />
        <Route path="/employees/new" element={<EmployeesFormPage />} />
        <Route path="/employees/create" element={<EmployeesFormPage />} />
        <Route path="/employees/edit/:staff_number" element={<EmployeesFormPage />} />

        {/* Отправления */}
        <Route path="/orders" element={<OrderListPage />} />
        <Route path="/orders/create" element={<OrderCreatePage />} />
        <Route path="/orders/issue" element={<OrderIssuePage />} />
        <Route path="/orders/unclaimed" element={<OrderUnclaimedPage />} />
        <Route path="/orders/transfer-acts" element={<TransferActsPage />} />
        <Route path="/orders/transfer-acts/create" element={<TransferActFormPage />} />

        {/* Отчёты */}
        <Route path="/reports/movement" element={<MovementReportPage />} />
        <Route path="/reports/finance" element={<FinanceReportPage />} />
        <Route path="/reports/analytics" element={<AnalyticsReportPage />} />
        <Route path="/reports/print-forms" element={<PrintFormsPage />} />

        {/* Администрирование */}
        <Route path="/admin/pickup-points" element={<PickupPointsPage />} />
        <Route path="/admin/pickup-points/create" element={<PickupPointFormPage />} />
        <Route path="/admin/pickup-points/edit/:index" element={<PickupPointFormPage />} />
        <Route path="/admin/tariffs" element={<TariffsPage />} />
        <Route path="/admin/tariffs/create" element={<TariffFormPage />} />
        <Route path="/admin/tariffs/edit/:code" element={<TariffFormPage />} />
        <Route path="/admin/services" element={<ServicesPage />} />
        <Route path="/admin/services/create" element={<ServiceFormPage />} />
        <Route path="/admin/services/edit/:name" element={<ServiceFormPage />} />

        {/* 404 */}
        <Route path="*" element={<Navigate to="/" />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;