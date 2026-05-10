import express from 'express';
import pool from '../db.js';

const router = express.Router();

// GET all shipments
router.get('/', async (req, res) => {
  try {
    const [rows] = await pool.query('SELECT * FROM shipment');
    res.json(rows);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

// GET demanded shipments (not unclaimed, not utilized)
router.get('/demanded', async (req, res) => {
  try {
    const [rows] = await pool.query(`
      SELECT * FROM shipment 
      WHERE shipment_status NOT IN ('Не востребована', 'Утилизирована')
      ORDER BY registration_date DESC
    `);
    res.json(rows);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

// GET unclaimed shipments
router.get('/unclaimed', async (req, res) => {
  try {
    // Mark shipments as utilized if status = unclaimed and > 30 days old
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    const thirtyDaysAgoStr = thirtyDaysAgo.toISOString().split('T')[0];

    await pool.query(`
      UPDATE shipment 
      SET shipment_status = 'Утилизирована'
      WHERE shipment_status = 'Не востребована' 
        AND registration_date < ?
    `, [thirtyDaysAgoStr]);

    const [rows] = await pool.query(`
      SELECT * FROM shipment 
      WHERE shipment_status IN ('Не востребована', 'Утилизирована')
      ORDER BY registration_date DESC
    `);
    res.json(rows);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

// GET single shipment
router.get('/:ipo', async (req, res) => {
  try {
    const { ipo } = req.params;
    const [rows] = await pool.query('SELECT * FROM shipment WHERE ipo = ?', [ipo]);
    
    if (rows.length === 0) {
      return res.status(404).json({ message: 'Отправление не найдено' });
    }
    
    res.json(rows[0]);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

// POST create shipment with receipt
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
      // Receipt data
      cash_register_number,
      shift_number,
      shipping_method,
      operation_time,
      // Inventory data (optional)
      inventory_items
    } = req.body;

    // Create shipment
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

    // Create receipt
    await connection.query(
      `INSERT INTO receipt (
        ipo, cash_register_number, shift_number, staff_number, 
        shipping_method, operation_date, operation_time
      ) VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [
        ipo, cash_register_number, shift_number, staff_number,
        shipping_method, registration_date, operation_time
      ]
    );

    // Create inventory items if provided
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

// PUT mark shipment as issued
router.put('/:ipo/issue', async (req, res) => {
  try {
    const { ipo } = req.params;

    const [result] = await pool.query(
      `UPDATE shipment SET shipment_status = 'Выдана' WHERE ipo = ?`,
      [ipo]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ message: 'Отправление не найдено' });
    }

    res.json({ message: 'Отправление выдано' });
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

// PUT update shipment status
router.put('/:ipo/status', async (req, res) => {
  try {
    const { ipo } = req.params;
    const { shipment_status } = req.body;

    const [result] = await pool.query(
      `UPDATE shipment SET shipment_status = ? WHERE ipo = ?`,
      [shipment_status, ipo]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ message: 'Отправление не найдено' });
    }

    res.json({ message: 'Статус отправления обновлен' });
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

export default router;