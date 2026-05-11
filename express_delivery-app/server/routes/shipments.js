import express from 'express';
import pool from '../db.js';
import { requireRole } from '../middleware/auth.js';

const router = express.Router();
router.use(requireRole(['Системный администратор', 'Администратор', 'Сотрудник пункта', 'Курьер']));

router.get('/', async (req, res) => {
  try {
    const { position_name, pickup_point_index } = req.user;
    const [rows] = position_name === 'Системный администратор'
      ? await pool.query('SELECT * FROM shipment')
      : await pool.query('SELECT * FROM shipment WHERE pickup_point_index = ?', [pickup_point_index]);
    res.json(rows);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

router.get('/demanded', async (req, res) => {
  try {
    const { position_name, pickup_point_index } = req.user;
    const text = `
      SELECT * FROM shipment 
      WHERE shipment_status NOT IN ('Не востребована', 'Утилизирована')
      ${position_name === 'Системный администратор' ? '' : 'AND pickup_point_index = ?'}
      ORDER BY registration_date DESC
    `;
    const [rows] = position_name === 'Системный администратор'
      ? await pool.query(text)
      : await pool.query(text, [pickup_point_index]);
    res.json(rows);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

router.get('/unclaimed', async (req, res) => {
  try {
    const { position_name, pickup_point_index } = req.user;
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    const thirtyDaysAgoStr = thirtyDaysAgo.toISOString().split('T')[0];

    await pool.query(`
      UPDATE shipment 
      SET shipment_status = 'Утилизирована'
      WHERE shipment_status = 'Не востребована' 
        AND registration_date < ?
    `, [thirtyDaysAgoStr]);

    const text = `
      SELECT * FROM shipment 
      WHERE shipment_status IN ('Не востребована', 'Утилизирована')
      ${position_name === 'Системный администратор' ? '' : 'AND pickup_point_index = ?'}
      ORDER BY registration_date DESC
    `;
    const [rows] = position_name === 'Системный администратор'
      ? await pool.query(text)
      : await pool.query(text, [pickup_point_index]);
    res.json(rows);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

router.get('/:ipo', async (req, res) => {
  try {
    const { ipo } = req.params;
    const { position_name, pickup_point_index } = req.user;
    const query = position_name === 'Системный администратор'
      ? 'SELECT * FROM shipment WHERE ipo = ?'
      : 'SELECT * FROM shipment WHERE ipo = ? AND pickup_point_index = ?';
    const params = position_name === 'Системный администратор' ? [ipo] : [ipo, pickup_point_index];
    const [rows] = await pool.query(query, params);

    if (rows.length === 0) {
      return res.status(404).json({ message: 'Отправление не найдено' });
    }

    res.json(rows[0]);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

router.post('/', async (req, res) => {
  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();

    const {
      ipo,
      sender_passport_number,
      receiver_passport_number,
      staff_number,
      pickup_point_index,
      tariff_code,
      package_type,
      actual_weight,
      volumetric_weight,
      length_cm,
      width_cm,
      height_cm,
      declared_value,
      service_cost,
      additional_service_cost,
      total_payable,
      registration_date,
      cash_register_number,
      shift_number,
      shipping_method,
      operation_time,
      inventory_items
    } = req.body;

    const { position_name, pickup_point_index: userPickupPoint } = req.user;

    await connection.query(
      `INSERT INTO shipment (
        ipo, sender_passport_number, receiver_passport_number, staff_number,
        pickup_point_index, tariff_code, package_type, actual_weight, 
        volumetric_weight, length_cm, width_cm, height_cm, declared_value,
        service_cost, additional_service_cost, total_payable, registration_date, shipment_status
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        ipo, sender_passport_number, receiver_passport_number, staff_number,
        pickup_point_index, tariff_code, package_type, actual_weight,
        volumetric_weight, length_cm, width_cm, height_cm, declared_value,
        service_cost, additional_service_cost, total_payable, registration_date, 'Принято'
      ]
    );

    await connection.query(
      `INSERT INTO receipt (
        ipo, cash_register_number, shift_number, staff_number, 
        shipping_method, operation_date, operation_time
      ) VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [
        ipo, cash_register_number, shift_number, staff_number,
        "Пункт выдачи", registration_date, operation_time
      ]
    );

    if (inventory_items && Array.isArray(inventory_items) && inventory_items.length > 0) {
      for (let i = 0; i < inventory_items.length; i++) {
        const item = inventory_items[i];
        await connection.query(
          `INSERT INTO shipment_inventory (
            ipo, item_no, item_name, item_count, declared_value_per_unit
          ) VALUES (?, ?, ?, ?, ?)`,
          [ipo, i + 1, item.item_name, item.item_count, item.declared_value_per_unit]
        );
      }
    }

    await connection.commit();
    res.status(201).json({
      message: 'Отправление успешно создано',
      ipo: ipo
    });
  } catch (err) {
    await connection.rollback();
    console.error(err.message);
    res.status(500).json({ message: 'Ошибка при создании отправления' });
  } finally {
    connection.release();
  }
});

router.put('/:ipo/issue', async (req, res) => {
  try {
    const { ipo } = req.params;
    const { position_name, pickup_point_index } = req.user;

    const query = position_name === 'Системный администратор'
      ? `UPDATE shipment SET shipment_status = 'Выдана' WHERE ipo = ?`
      : `UPDATE shipment SET shipment_status = 'Выдана' WHERE ipo = ? AND pickup_point_index = ?`;
    const params = position_name === 'Системный администратор' ? [ipo] : [ipo, pickup_point_index];

    const [result] = await pool.query(query, params);

    if (result.affectedRows === 0) {
      return res.status(404).json({ message: 'Отправление не найдено или доступ запрещен' });
    }

    res.json({ message: 'Отправление выдано' });
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

router.put('/:ipo/status', async (req, res) => {
  try {
    const { ipo } = req.params;
    const { shipment_status } = req.body;
    const { position_name, pickup_point_index } = req.user;

    const query = position_name === 'Системный администратор'
      ? 'UPDATE shipment SET shipment_status = ? WHERE ipo = ?'
      : 'UPDATE shipment SET shipment_status = ? WHERE ipo = ? AND pickup_point_index = ?';
    const params = position_name === 'Системный администратор' ? [shipment_status, ipo] : [shipment_status, ipo, pickup_point_index];

    const [result] = await pool.query(query, params);

    if (result.affectedRows === 0) {
      return res.status(404).json({ message: 'Отправление не найдено или доступ запрещен' });
    }

    res.json({ message: 'Статус отправления обновлен' });
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

export default router;