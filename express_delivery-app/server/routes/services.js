import express from 'express';
import pool from '../db.js';
import { requireRole } from '../middleware/auth.js';

const router = express.Router();

// Получить все услуги
router.get('/', async (req, res) => {
  try {
    const [rows] = await pool.query('SELECT * FROM service');
    res.json(rows);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

// Создать новую услугу
router.post('/', requireRole(['Системный администратор', 'Администратор', 'Сотрудник пункта', 'Курьер']), async (req, res) => {
  try {
    const { service_name, service_category } = req.body;

    // Проверка обязательных полей
    if (!service_name || !service_category) {
      return res.status(400).json({
        message: 'Название услуги и категория обязательны'
      });
    }

    const [result] = await pool.query(
      'INSERT INTO service (service_name, service_category) VALUES (?, ?)',
      [service_name, service_category]
    );

    res.status(201).json({
      message: 'Услуга успешно создана',
      service_name: service_name
    });
  } catch (err) {
    console.error(err.message);

    if (err.code === 'ER_DUP_ENTRY') {
      return res.status(409).json({
        message: 'Услуга с таким названием уже существует'
      });
    }

    res.status(500).send('Server Error');
  }
});

// Обновить услугу
router.put('/:service_name', requireRole(['Системный администратор', 'Администратор', 'Сотрудник пункта', 'Курьер']), async (req, res) => {
  try {
    const { service_name } = req.params;
    const { service_category, new_service_name } = req.body;

    // Если передано новое имя, используем его, иначе оставляем старое
    const finalName = new_service_name || service_name;

    const [result] = await pool.query(
      'UPDATE service SET service_name = ?, service_category = ? WHERE service_name = ?',
      [finalName, service_category, service_name]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ message: 'Услуга не найдена' });
    }

    res.json({ message: 'Услуга успешно обновлена' });
  } catch (err) {
    console.error(err.message);

    if (err.code === 'ER_DUP_ENTRY') {
      return res.status(409).json({
        message: 'Услуга с таким названием уже существует'
      });
    }

    res.status(500).send('Server Error');
  }
});

router.delete('/:service_name', requireRole(['Системный администратор', 'Администратор', 'Сотрудник пункта', 'Курьер']), async (req, res) => {
  try {
    const { service_name } = req.params;

    const [result] = await pool.query(
      'DELETE FROM service WHERE service_name = ?',
      [service_name]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ message: 'Услуга не найдена' });
    }

    res.json({ message: 'Услуга успешно удалена' });
  } catch (err) {
    console.error(err.message);

    if (err.code === 'ER_ROW_IS_REFERENCED_2') {
      return res.status(409).json({
        message: 'Невозможно удалить услугу, так как она используется в других записях'
      });
    }

    res.status(500).send('Server Error');
  }
});

export default router;