import express from 'express';
import pool from '../db.js';

const router = express.Router();

router.get('/', async (req, res) => {
  try {
    const [rows] = await pool.query('SELECT * FROM client');
    res.json(rows);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

router.post('/', async (req, res) => {
  try {
    const {
      passport_number,
      surname,
      first_name,
      patronymic,
      phone,
      postal_index,
      region,
      city,
      street,
      house,
      email
    } = req.body;

    const [result] = await pool.query(
      `INSERT INTO client (
        passport_number, surname, first_name, patronymic, phone,
        postal_index, region, city, street, house, email
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        passport_number, surname, first_name, patronymic, phone,
        postal_index, region, city, street, house, email
      ]
    );

    res.status(201).json({
      message: 'Клиент успешно создан',
      id: result.insertId
    });
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

router.put('/:passport_number', async (req, res) => {
  try {
    const { passport_number } = req.params;
    const {
      surname,
      first_name,
      patronymic,
      phone,
      postal_index,
      region,
      city,
      street,
      house,
      email
    } = req.body;

    const [result] = await pool.query(
      `UPDATE client SET
        surname = ?, first_name = ?, patronymic = ?, phone = ?,
        postal_index = ?, region = ?, city = ?, street = ?, house = ?, email = ?
      WHERE passport_number = ?`,
      [
        surname, first_name, patronymic, phone,
        postal_index, region, city, street, house, email, passport_number
      ]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ message: 'Клиент не найден' });
    }

    res.json({ message: 'Клиент успешно обновлен' });
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

router.delete('/:passport_number', async (req, res) => {
  try {
    const { passport_number } = req.params;

    const [result] = await pool.query(
      'DELETE FROM client WHERE passport_number = ?',
      [passport_number]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ message: 'Клиент не найден' });
    }

    res.json({ message: 'Клиент успешно удален' });
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

export default router;