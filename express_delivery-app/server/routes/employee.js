import express from 'express';
import bcrypt from 'bcrypt';
import pool from '../db.js';
import { requireRole } from '../middleware/auth.js';

const router = express.Router();
router.use(requireRole(['Системный администратор', 'Администратор', 'Сотрудник пункта', 'Курьер']));

// Функция генерации случайного шестизначного пароля из букв
const generatePassword = () => {
  const letters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz';
  let password = '';
  for (let i = 0; i < 6; i++) {
    password += letters.charAt(Math.floor(Math.random() * letters.length));
  }
  return password;
};

router.get('/', async (req, res) => {
  try {
    const { position_name, pickup_point_index } = req.user;
    const [rows] = position_name === 'Системный администратор'
      ? await pool.query(
          'SELECT staff_number, surname, first_name, patronymic, pickup_point_index, position_name, allowance, note FROM employee'
        )
      : await pool.query(
          'SELECT staff_number, surname, first_name, patronymic, pickup_point_index, position_name, allowance, note FROM employee WHERE pickup_point_index = ?',
          [pickup_point_index]
        );

    res.json(rows);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

router.post('/', async (req, res) => {
  try {
    const {
      staff_number,
      surname,
      first_name,
      patronymic,
      pickup_point_index,
      position_name,
      allowance,
      note
    } = req.body;

    // Генерируем случайный шестизначный пароль из букв
    const generatedPassword = generatePassword();
    const password_hash = await bcrypt.hash(generatedPassword, 10);

    const [result] = await pool.query(
      `INSERT INTO employee (
        staff_number, surname, first_name, patronymic,
        pickup_point_index, position_name, allowance, note, password_hash
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        staff_number, surname, first_name, patronymic,
        pickup_point_index, position_name, allowance, note, password_hash
      ]
    );

    res.status(201).json({
      message: 'Сотрудник успешно создан',
      id: result.insertId,
      generatedPassword: generatedPassword
    });
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

router.put('/:staff_number', async (req, res) => {
  try {
    const { staff_number } = req.params;
    const {
      surname,
      first_name,
      patronymic,
      pickup_point_index,
      position_name,
      allowance,
      note,
      password
    } = req.body;

    const updates = [
      surname,
      first_name,
      patronymic,
      pickup_point_index,
      position_name,
      allowance,
      note
    ];

    let query = `UPDATE employee SET
      surname = ?, first_name = ?, patronymic = ?,
      pickup_point_index = ?, position_name = ?, allowance = ?, note = ?`;

    if (password) {
      const password_hash = await bcrypt.hash(password, 10);
      query += ', password_hash = ?';
      updates.push(password_hash);
    }

    query += ' WHERE staff_number = ?';
    updates.push(staff_number);

    const [result] = await pool.query(query, updates);

    if (result.affectedRows === 0) {
      return res.status(404).json({ message: 'Сотрудник не найден' });
    }

    res.json({ message: 'Сотрудник успешно обновлен' });
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

router.delete('/:staff_number', async (req, res) => {
  try {
    const { staff_number } = req.params;

    const [result] = await pool.query(
      'DELETE FROM employee WHERE staff_number = ?',
      [staff_number]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ message: 'Сотрудник не найден' });
    }

    res.json({ message: 'Сотрудник успешно удален' });
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

export default router;
