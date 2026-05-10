import axios from 'axios';

// клиент API
const api = axios.create({ baseURL: '/api' });

// клиенты
export const getClients = () => api.get('/clients');
export const createClient = (data) => api.post('/clients', data);
export const updateClient = (passportNumber, data) => api.put(`/clients/${passportNumber}`, data);
export const deleteClient = (passportNumber) => api.delete(`/clients/${passportNumber}`);

// сотрудники
export const getEmployees = () => api.get('/employees');
export const createEmployee = (data) => api.post('/employees', data);
export const updateEmployee = (staffNumber, data) => api.put(`/employees/${staffNumber}`, data);
export const deleteEmployee = (staffNumber) => api.delete(`/employees/${staffNumber}`);

// должности
export const getPositions = () => api.get('/positions');

// услуги
export const getServices = () => api.get('/services');
export const createService = (data) => api.post('/services', data);
export const updateService = (serviceName, data) => api.put(`/services/${encodeURIComponent(serviceName)}`, data);
export const deleteService = (serviceName) => api.delete(`/services/${encodeURIComponent(serviceName)}`);

// тарифы
export const getTariffs = () => api.get('/tariffs');
export const createTariff = (data) => api.post('/tariffs', data);
export const updateTariff = (tariffCode, data) => api.put(`/tariffs/${tariffCode}`, data);
export const deleteTariff = (tariffCode) => api.delete(`/tariffs/${tariffCode}`);

// пункты выдачи (полный список)
export const getPickupPoints = () => api.get('/pickup-points?full=true');

// пункты выдачи (только индексы для выпадающих списков)
export const getPickupPointIndexes = () => api.get('/pickup-points');

// пункты выдачи (CRUD)
export const getPickupPoint = (index) => api.get(`/pickup-points/${index}`);
export const createPickupPoint = (data) => api.post('/pickup-points', data);
export const updatePickupPoint = (index, data) => api.put(`/pickup-points/${index}`, data);
export const deletePickupPoint = (index) => api.delete(`/pickup-points/${index}`);
export const getPickupPointServices = (index) => api.get(`/pickup-points/${index}/services`);

// особые графики работы
export const getSpecialSchedules = (index) => api.get(`/pickup-points/${index}/schedules`);

// отправления
export const getShipments = () => api.get('/shipments');
export const getDemandedShipments = () => api.get('/shipments/demanded');
export const getUnclaimedShipments = () => api.get('/shipments/unclaimed');
export const getShipment = (ipo) => api.get(`/shipments/${ipo}`);
export const createShipment = (data) => api.post('/shipments', data);
export const issueShipment = (ipo) => api.put(`/shipments/${ipo}/issue`);
export const updateShipmentStatus = (ipo, status) => api.put(`/shipments/${ipo}/status`, { shipment_status: status });

// акты приема-передачи
export const getTransferActs = () => api.get('/transfer-acts');
export const getTransferAct = (actNumber) => api.get(`/transfer-acts/${actNumber}`);
export const createTransferAct = (data) => api.post('/transfer-acts', data);
export const receiveTransferAct = (actNumber) => api.put(`/transfer-acts/${actNumber}/receive`);