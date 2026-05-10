import express from 'express';
import pool from '../db.js';

const router = express.Router();

// GET /api/pickup-points - получить все индексы пунктов выдачи (для сотрудников)
router.get('/', async (req, res) => {
  try {
    const { full } = req.query;
    
    if (full === 'true') {
      const [rows] = await pool.query('SELECT * FROM pickup_point');
      return res.json(rows);
    }
    
    const [rows] = await pool.query(
      'SELECT pickup_point_index FROM pickup_point ORDER BY pickup_point_index'
    );
    res.json(rows);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

// GET /api/pickup-points/:index - получить один пункт выдачи
router.get('/:index', async (req, res) => {
  try {
    const [rows] = await pool.query(
      'SELECT * FROM pickup_point WHERE pickup_point_index = ?',
      [req.params.index]
    );
    
    if (rows.length === 0) {
      return res.status(404).json({ message: 'Пункт выдачи не найден' });
    }
    
    res.json(rows[0]);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

// GET /api/pickup-points/:index/services - получить услуги пункта выдачи
router.get('/:index/services', async (req, res) => {
  try {
    const [rows] = await pool.query(
      `SELECT ps.*, s.service_category 
       FROM pickup_point_service ps 
       JOIN service s ON ps.service_name = s.service_name 
       WHERE ps.pickup_point_index = ?`,
      [req.params.index]
    );
    res.json(rows);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

// GET /api/pickup-points/:index/schedules - получить специальные расписания
router.get('/:index/schedules', async (req, res) => {
  try {
    const [rows] = await pool.query(
      'SELECT * FROM special_schedule WHERE pickup_point_index = ? ORDER BY schedule_date',
      [req.params.index]
    );
    res.json(rows);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

// POST /api/pickup-points - создать новый пункт выдачи
router.post('/', async (req, res) => {
  const connection = await pool.getConnection();
  
  try {
    const {
      pickup_point_index,
      branch_name,
      region,
      city,
      street,
      house,
      municipality,
      oktmo,
      service_windows_count,
      accessibility_for_mgn,
      hotline_phone,
      work_mode,
      services,
      special_schedules // Добавлено
    } = req.body;

    await connection.beginTransaction();

    // Вставляем пункт выдачи
    await connection.query(
      `INSERT INTO pickup_point (
        pickup_point_index, branch_name, region, city, street, house,
        municipality, oktmo, service_windows_count, accessibility_for_mgn,
        hotline_phone, work_mode
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        pickup_point_index, branch_name, region, city, street, house,
        municipality, oktmo, service_windows_count, accessibility_for_mgn,
        hotline_phone, work_mode
      ]
    );

    // Вставляем связи с услугами
    if (services && services.length > 0) {
      for (const serviceName of services) {
        await connection.query(
          'INSERT INTO pickup_point_service (pickup_point_index, service_name) VALUES (?, ?)',
          [pickup_point_index, serviceName]
        );
      }
    }

    // Вставляем специальные расписания
    if (special_schedules && special_schedules.length > 0) {
      for (const schedule of special_schedules) {
        await connection.query(
          'INSERT INTO special_schedule (pickup_point_index, schedule_date, start_time, end_time, note) VALUES (?, ?, ?, ?, ?)',
          [pickup_point_index, schedule.schedule_date, schedule.start_time, schedule.end_time, schedule.note || null]
        );
      }
    }

    await connection.commit();

    res.status(201).json({
      message: 'Пункт выдачи успешно создан',
      pickup_point_index: pickup_point_index
    });
  } catch (err) {
    await connection.rollback();
    console.error(err.message);
    
    if (err.code === 'ER_DUP_ENTRY') {
      return res.status(409).json({ 
        message: 'Пункт выдачи с таким индексом уже существует' 
      });
    }
    
    res.status(500).send('Server Error');
  } finally {
    connection.release();
  }
});

// PUT /api/pickup-points/:index - обновить пункт выдачи
router.put('/:index', async (req, res) => {
  const connection = await pool.getConnection();
  
  try {
    const { index } = req.params;
    const {
      branch_name,
      region,
      city,
      street,
      house,
      municipality,
      oktmo,
      service_windows_count,
      accessibility_for_mgn,
      hotline_phone,
      work_mode,
      services,
      special_schedules // Добавлено
    } = req.body;

    await connection.beginTransaction();

    // Обновляем пункт выдачи
    const [result] = await connection.query(
      `UPDATE pickup_point SET
        branch_name = ?, region = ?, city = ?, street = ?, house = ?,
        municipality = ?, oktmo = ?, service_windows_count = ?,
        accessibility_for_mgn = ?, hotline_phone = ?, work_mode = ?
      WHERE pickup_point_index = ?`,
      [
        branch_name, region, city, street, house,
        municipality, oktmo, service_windows_count,
        accessibility_for_mgn, hotline_phone, work_mode, index
      ]
    );

    if (result.affectedRows === 0) {
      await connection.rollback();
      return res.status(404).json({ message: 'Пункт выдачи не найден' });
    }

    // Обновляем услуги: удаляем старые и добавляем новые
    await connection.query(
      'DELETE FROM pickup_point_service WHERE pickup_point_index = ?',
      [index]
    );

    if (services && services.length > 0) {
      for (const serviceName of services) {
        await connection.query(
          'INSERT INTO pickup_point_service (pickup_point_index, service_name) VALUES (?, ?)',
          [index, serviceName]
        );
      }
    }

    // Обновляем специальные расписания: удаляем старые и добавляем новые
    await connection.query(
      'DELETE FROM special_schedule WHERE pickup_point_index = ?',
      [index]
    );

    if (special_schedules && special_schedules.length > 0) {
      for (const schedule of special_schedules) {
        await connection.query(
          'INSERT INTO special_schedule (pickup_point_index, schedule_date, start_time, end_time, note) VALUES (?, ?, ?, ?, ?)',
          [index, schedule.schedule_date, schedule.start_time, schedule.end_time, schedule.note || null]
        );
      }
    }

    await connection.commit();

    res.json({ message: 'Пункт выдачи успешно обновлен' });
  } catch (err) {
    await connection.rollback();
    console.error(err.message);
    res.status(500).send('Server Error');
  } finally {
    connection.release();
  }
});

// DELETE /api/pickup-points/:index - удалить пункт выдачи
router.delete('/:index', async (req, res) => {
  try {
    const { index } = req.params;

    const [result] = await pool.query(
      'DELETE FROM pickup_point WHERE pickup_point_index = ?',
      [index]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ message: 'Пункт выдачи не найден' });
    }

    res.json({ message: 'Пункт выдачи успешно удален' });
  } catch (err) {
    console.error(err.message);
    
    if (err.code === 'ER_ROW_IS_REFERENCED_2') {
      return res.status(409).json({ 
        message: 'Невозможно удалить пункт выдачи, так как он используется' 
      });
    }
    
    res.status(500).send('Server Error');
  }
});

export default router;