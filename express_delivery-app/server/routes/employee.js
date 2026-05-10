import express from 'express';
import pool from '../db.js';

const router = express.Router();

router.get('/', async (req, res) => {
  try {
    const [rows] = await pool.query('SELECT * FROM employee');
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

    const [result] = await pool.query(
      `INSERT INTO employee (
        staff_number, surname, first_name, patronymic,
        pickup_point_index, position_name, allowance, note
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        staff_number, surname, first_name, patronymic,
        pickup_point_index, position_name, allowance, note
      ]
    );

    res.status(201).json({
      message: 'Сотрудник успешно создан',
      id: result.insertId
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
      note
    } = req.body;

    const [result] = await pool.query(
      `UPDATE employee SET
        surname = ?, first_name = ?, patronymic = ?,
        pickup_point_index = ?, position_name = ?, allowance = ?, note = ?
      WHERE staff_number = ?`,
      [
        surname, first_name, patronymic,
        pickup_point_index, position_name, allowance, note, staff_number
      ]
    );

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
