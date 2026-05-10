import express from 'express';
import pool from '../db.js';
import { requireRole } from '../middleware/auth.js';

const router = express.Router();

// Получить все тарифы
router.get('/', async (req, res) => {
  try {
    const [rows] = await pool.query('SELECT * FROM tariff ORDER BY tariff_start_date DESC');
    res.json(rows);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

// Создать новый тариф
router.post('/', requireRole(['Системный администратор']), async (req, res) => {
  try {
    const {
      tariff_code,
      tariff_up_to_500g,
      tariff_up_to_1kg,
      additional_500g_charge,
      oversize_surcharge,
      careful_surcharge,
      max_weight,
      tariff_start_date
    } = req.body;

    const [result] = await pool.query(
      `INSERT INTO tariff (
        tariff_code, tariff_up_to_500g, tariff_up_to_1kg, additional_500g_charge,
        oversize_surcharge, careful_surcharge, max_weight, tariff_start_date
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        tariff_code, tariff_up_to_500g, tariff_up_to_1kg, additional_500g_charge,
        oversize_surcharge, careful_surcharge, max_weight, tariff_start_date
      ]
    );

    res.status(201).json({
      message: 'Тариф успешно создан',
      tariff_code: tariff_code
    });
  } catch (err) {
    console.error(err.message);
    
    if (err.code === 'ER_DUP_ENTRY') {
      return res.status(409).json({ 
        message: 'Тариф с таким кодом уже существует' 
      });
    }
    
    res.status(500).send('Server Error');
  }
});

// Обновить тариф
router.put('/:tariff_code', requireRole(['Системный администратор']), async (req, res) => {
  try {
    const { tariff_code } = req.params;
    const {
      tariff_up_to_500g,
      tariff_up_to_1kg,
      additional_500g_charge,
      oversize_surcharge,
      careful_surcharge,
      max_weight,
      tariff_start_date
    } = req.body;

    const [result] = await pool.query(
      `UPDATE tariff SET
        tariff_up_to_500g = ?, tariff_up_to_1kg = ?, additional_500g_charge = ?,
        oversize_surcharge = ?, careful_surcharge = ?, max_weight = ?, tariff_start_date = ?
      WHERE tariff_code = ?`,
      [
        tariff_up_to_500g, tariff_up_to_1kg, additional_500g_charge,
        oversize_surcharge, careful_surcharge, max_weight, tariff_start_date, tariff_code
      ]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ message: 'Тариф не найден' });
    }

    res.json({ message: 'Тариф успешно обновлен' });
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

// Удалить тариф
router.delete('/:tariff_code', requireRole(['Системный администратор']), async (req, res) => {
  try {
    const { tariff_code } = req.params;

    const [result] = await pool.query(
      'DELETE FROM tariff WHERE tariff_code = ?',
      [tariff_code]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ message: 'Тариф не найден' });
    }

    res.json({ message: 'Тариф успешно удален' });
  } catch (err) {
    console.error(err.message);
    
    if (err.code === 'ER_ROW_IS_REFERENCED_2') {
      return res.status(409).json({ 
        message: 'Невозможно удалить тариф, так как он используется' 
      });
    }
    
    res.status(500).send('Server Error');
  }
});

export default router;