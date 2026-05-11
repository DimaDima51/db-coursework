import "./App.css";
import { BrowserRouter, Route, Routes, Navigate } from 'react-router-dom';
import { AuthProvider } from './auth/AuthProvider';
import { RequireAuth } from './auth/RequireAuth';
import { HomePage } from './pages/HomePage';
import { ClientsPage } from './pages/clients/ClientsPage';
import { ClientFormPage } from './pages/clients/ClientFormPage';
import { EmployeesPage } from './pages/employees/EmployeesPage';
import { EmployeesFormPage } from './pages/employees/EmployeesFormPage';
import { LoginPage } from './pages/LoginPage';

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
import { ActReportPage } from './pages/reports/ActReportPage';
import { ClientsReportPage } from './pages/reports/ClientsReportPage';
import { AnalyticReportPage } from './pages/reports/AnalyticReportPage';

// Администрирование
import { PickupPointsPage } from './pages/admin/PickupPointsPage';
import { PickupPointFormPage } from './pages/admin/PickupPointFormPage';
import { TariffsPage } from './pages/admin/TariffsPage';
import { TariffFormPage } from './pages/admin/TariffFormPage';
import { ServicesPage } from './pages/admin/ServicesPage';
import { ServiceFormPage } from './pages/admin/ServiceFormPage';

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<LoginPage />} />

          <Route element={<RequireAuth />}>
            <Route path="/" element={<HomePage />} />

            <Route
              path="/clients"
              element={
                <RequireAuth allowedRoles={['Системный администратор', 'Администратор пункта', 'Сотрудник пункта']}>
                  <ClientsPage />
                </RequireAuth>
              }
            />
            <Route
              path="/clients/new"
              element={
                <RequireAuth allowedRoles={['Системный администратор', 'Администратор пункта', 'Сотрудник пункта']}>
                  <ClientFormPage />
                </RequireAuth>
              }
            />
            <Route
              path="/clients/create"
              element={
                <RequireAuth allowedRoles={['Системный администратор', 'Администратор пункта', 'Сотрудник пункта']}>
                  <ClientFormPage />
                </RequireAuth>
              }
            />
            <Route
              path="/clients/edit/:passport_number"
              element={
                <RequireAuth allowedRoles={['Системный администратор', 'Администратор пункта', 'Сотрудник пункта']}>
                  <ClientFormPage />
                </RequireAuth>
              }
            />

            <Route
              path="/employees"
              element={
                <RequireAuth allowedRoles={['Системный администратор', 'Администратор пункта']}>
                  <EmployeesPage />
                </RequireAuth>
              }
            />
            <Route
              path="/employees/new"
              element={
                <RequireAuth allowedRoles={['Системный администратор', 'Администратор пункта']}>
                  <EmployeesFormPage />
                </RequireAuth>
              }
            />
            <Route
              path="/employees/create"
              element={
                <RequireAuth allowedRoles={['Системный администратор', 'Администратор пункта']}>
                  <EmployeesFormPage />
                </RequireAuth>
              }
            />
            <Route
              path="/employees/edit/:staff_number"
              element={
                <RequireAuth allowedRoles={['Системный администратор', 'Администратор пункта']}>
                  <EmployeesFormPage />
                </RequireAuth>
              }
            />

            <Route
              path="/orders"
              element={
                <RequireAuth allowedRoles={['Системный администратор', 'Администратор пункта', 'Сотрудник пункта', 'Курьер']}>
                  <OrderListPage />
                </RequireAuth>
              }
            />
            <Route
              path="/orders/create"
              element={
                <RequireAuth allowedRoles={['Системный администратор', 'Администратор пункта', 'Сотрудник пункта']}>
                  <OrderCreatePage />
                </RequireAuth>
              }
            />
            <Route
              path="/orders/issue"
              element={
                <RequireAuth allowedRoles={['Системный администратор', 'Администратор пункта', 'Сотрудник пункта']}>
                  <OrderIssuePage />
                </RequireAuth>
              }
            />
            <Route
              path="/orders/unclaimed"
              element={
                <RequireAuth allowedRoles={['Системный администратор', 'Администратор пункта', 'Сотрудник пункта']}>
                  <OrderUnclaimedPage />
                </RequireAuth>
              }
            />
            <Route
              path="/orders/transfer-acts"
              element={
                <RequireAuth allowedRoles={['Системный администратор', 'Администратор пункта', 'Сотрудник пункта', 'Курьер']}>
                  <TransferActsPage />
                </RequireAuth>
              }
            />
            <Route
              path="/orders/transfer-acts/create"
              element={
                <RequireAuth allowedRoles={['Системный администратор', 'Администратор пункта', 'Сотрудник пункта']}>
                  <TransferActFormPage />
                </RequireAuth>
              }
            />

            <Route
              path="/reports/movement"
              element={
                <RequireAuth allowedRoles={['Системный администратор', 'Администратор пункта', 'Сотрудник пункта']}>
                  <MovementReportPage />
                </RequireAuth>
              }
            />
            <Route
              path="/reports/act"
              element={
                <RequireAuth allowedRoles={['Системный администратор', 'Администратор пункта', 'Сотрудник пункта']}>
                  <ActReportPage />
                </RequireAuth>
              }
            />
            <Route
              path="/reports/finance"
              element={
                <RequireAuth allowedRoles={['Системный администратор', 'Администратор пункта']}>
                  <FinanceReportPage />
                </RequireAuth>
              }
            />
            <Route
              path="/reports/clients"
              element={
                <RequireAuth allowedRoles={['Системный администратор', 'Администратор пункта']}>
                  <ClientsReportPage />
                </RequireAuth>
              }
            />
            <Route
              path="/reports/analytic"
              element={
                <RequireAuth allowedRoles={['Системный администратор', 'Администратор пункта']}>
                  <AnalyticReportPage />
                </RequireAuth>
              }
            />

            <Route
              path="/admin/pickup-points"
              element={
                <RequireAuth allowedRoles={['Системный администратор']}>
                  <PickupPointsPage />
                </RequireAuth>
              }
            />
            <Route
              path="/admin/pickup-points/create"
              element={
                <RequireAuth allowedRoles={['Системный администратор']}>
                  <PickupPointFormPage />
                </RequireAuth>
              }
            />
            <Route
              path="/admin/pickup-points/edit/:index"
              element={
                <RequireAuth allowedRoles={['Системный администратор']}>
                  <PickupPointFormPage />
                </RequireAuth>
              }
            />
            <Route
              path="/admin/tariffs"
              element={
                <RequireAuth allowedRoles={['Системный администратор']}>
                  <TariffsPage />
                </RequireAuth>
              }
            />
            <Route
              path="/admin/tariffs/create"
              element={
                <RequireAuth allowedRoles={['Системный администратор']}>
                  <TariffFormPage />
                </RequireAuth>
              }
            />
            <Route
              path="/admin/tariffs/edit/:code"
              element={
                <RequireAuth allowedRoles={['Системный администратор']}>
                  <TariffFormPage />
                </RequireAuth>
              }
            />
            <Route
              path="/admin/services"
              element={
                <RequireAuth allowedRoles={['Системный администратор']}>
                  <ServicesPage />
                </RequireAuth>
              }
            />
            <Route
              path="/admin/services/create"
              element={
                <RequireAuth allowedRoles={['Системный администратор']}>
                  <ServiceFormPage />
                </RequireAuth>
              }
            />
            <Route
              path="/admin/services/edit/:name"
              element={
                <RequireAuth allowedRoles={['Системный администратор']}>
                  <ServiceFormPage />
                </RequireAuth>
              }
            />
          </Route>

          {/* 404 */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;