import express from 'express';
import cors from 'cors';
import authRouter from './routes/auth.js';
import shipmentsRouter from './routes/shipments.js';
import clientRouter from './routes/client.js';
import employeeRouter from './routes/employee.js';
import positionRouter from './routes/position.js';
import pickupPointsRouter from './routes/pickupPoints.js';
import servicesRouter from './routes/services.js';
import tariffsRouter from './routes/tariffs.js';
import transferActsRouter from './routes/transfer_acts.js';
import { verifyToken } from './middleware/auth.js';

const app = express();
const PORT = 3001;

app.use(cors());
app.use(express.json());

app.use('/api/auth', authRouter);
app.use('/api', verifyToken);

app.use('/api/shipments', shipmentsRouter);
app.use('/api/clients', clientRouter);
app.use('/api/employees', employeeRouter);
app.use('/api/positions', positionRouter);
app.use('/api/pickup-points', pickupPointsRouter);
app.use('/api/services', servicesRouter);
app.use('/api/tariffs', tariffsRouter);
app.use('/api/transfer-acts', transferActsRouter);

app.listen(PORT, () => {
  console.log(`Сервер запущен на http://localhost:${PORT}`);
});