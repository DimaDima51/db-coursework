import express from 'express';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import pool from '../db.js';
import { verifyToken } from '../middleware/auth.js';

const router = express.Router();
const JWT_SECRET = process.env.JWT_SECRET || 'express_delivery_secret';
const REFRESH_TOKEN_LIFETIME_SECONDS = 60 * 60 * 24 * 7; // 7 дней

const formatDateTime = (date) => date.toISOString().slice(0, 19).replace('T', ' ');

const createTokens = (employee) => {
  const accessToken = jwt.sign(
    {
      staff_number: employee.staff_number,
      position_name: employee.position_name,
      pickup_point_index: employee.pickup_point_index
    },
    JWT_SECRET,
    { expiresIn: '1h' }
  );

  const refreshToken = jwt.sign(
    { staff_number: employee.staff_number },
    JWT_SECRET,
    { expiresIn: `${REFRESH_TOKEN_LIFETIME_SECONDS}s` }
  );

  const token_expires_at = formatDateTime(new Date(Date.now() + REFRESH_TOKEN_LIFETIME_SECONDS * 1000));

  return { accessToken, refreshToken, token_expires_at };
};

const buildUserResponse = (employee) => ({
  staff_number: employee.staff_number,
  surname: employee.surname,
  first_name: employee.first_name,
  patronymic: employee.patronymic,
  position_name: employee.position_name,
  pickup_point_index: employee.pickup_point_index
});

router.post('/login', async (req, res) => {
  try {
    const { staff_number, password } = req.body;

    if (!staff_number || !password) {
      return res.status(400).json({ message: 'Табельный номер и пароль обязательны' });
    }

    const [rows] = await pool.query('SELECT * FROM employee WHERE staff_number = ?', [staff_number]);
    const employee = rows[0];

    if (!employee || !employee.password_hash) {
      return res.status(401).json({ message: 'Неверный логин или пароль' });
    }

    const isMatch = await bcrypt.compare(password, employee.password_hash);

    if (!isMatch) {
      return res.status(401).json({ message: 'Неверный логин или пароль' });
    }

    const { accessToken, refreshToken, token_expires_at } = createTokens(employee);

    await pool.query(
      'UPDATE employee SET refresh_token = ?, token_expires_at = ? WHERE staff_number = ?',
      [refreshToken, token_expires_at, staff_number]
    );

    res.json({
      accessToken,
      refreshToken,
      user: buildUserResponse(employee)
    });
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ message: 'Ошибка при авторизации' });
  }
});

router.post('/refresh', async (req, res) => {
  try {
    const { refresh_token } = req.body;

    if (!refresh_token) {
      return res.status(400).json({ message: 'Refresh token обязателен' });
    }

    let payload;
    try {
      payload = jwt.verify(refresh_token, JWT_SECRET);
    } catch (err) {
      return res.status(401).json({ message: 'Недействительный refresh token' });
    }

    const [rows] = await pool.query('SELECT * FROM employee WHERE staff_number = ?', [payload.staff_number]);
    const employee = rows[0];

    if (!employee || employee.refresh_token !== refresh_token) {
      return res.status(401).json({ message: 'Refresh token не найден' });
    }

    if (!employee.token_expires_at || new Date(employee.token_expires_at) < new Date()) {
      return res.status(401).json({ message: 'Refresh token просрочен' });
    }

    const { accessToken, refreshToken, token_expires_at } = createTokens(employee);

    await pool.query(
      'UPDATE employee SET refresh_token = ?, token_expires_at = ? WHERE staff_number = ?',
      [refreshToken, token_expires_at, employee.staff_number]
    );

    res.json({
      accessToken,
      refreshToken,
      user: buildUserResponse(employee)
    });
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ message: 'Ошибка при обновлении токена' });
  }
});

router.get('/me', verifyToken, async (req, res) => {
  try {
    const [rows] = await pool.query('SELECT * FROM employee WHERE staff_number = ?', [req.user.staff_number]);
    const employee = rows[0];

    if (!employee) {
      return res.status(404).json({ message: 'Пользователь не найден' });
    }

    res.json({ user: buildUserResponse(employee) });
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ message: 'Ошибка при получении профиля' });
  }
});

export default router;
