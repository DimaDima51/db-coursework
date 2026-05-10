import express from 'express';
import pool from '../db.js';
import { requireRole } from '../middleware/auth.js';

const router = express.Router();
router.use(requireRole(['Системный администратор', 'Администратор', 'Сотрудник пункта', 'Курьер']));

router.get('/', async (req, res) => {
  try {
    const { position_name, pickup_point_index } = req.user;
    const baseQuery = `
      SELECT ta.*, 
        sender_emp.first_name as sender_first_name,
        sender_emp.surname as sender_surname,
        receiver_emp.first_name as receiver_first_name,
        receiver_emp.surname as receiver_surname
      FROM transfer_act ta
      LEFT JOIN employee sender_emp ON ta.sender_staff_number = sender_emp.staff_number
      LEFT JOIN employee receiver_emp ON ta.receiver_staff_number = receiver_emp.staff_number
    `;
    const whereClause = position_name === 'Системный администратор'
      ? ''
      : `WHERE sender_emp.pickup_point_index = ? OR receiver_emp.pickup_point_index = ?`;
    const [rows] = await pool.query(
      `${baseQuery} ${whereClause} ORDER BY ta.creation_date DESC`,
      position_name === 'Системный администратор' ? [] : [pickup_point_index, pickup_point_index]
    );
    res.json(rows);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

router.get('/:act_number', async (req, res) => {
  try {
    const { act_number } = req.params;
    const { position_name, pickup_point_index } = req.user;
    const query = position_name === 'Системный администратор'
      ? `
        SELECT ta.*, 
          sender_emp.first_name as sender_first_name,
          sender_emp.surname as sender_surname,
          receiver_emp.first_name as receiver_first_name,
          receiver_emp.surname as receiver_surname
        FROM transfer_act ta
        LEFT JOIN employee sender_emp ON ta.sender_staff_number = sender_emp.staff_number
        LEFT JOIN employee receiver_emp ON ta.receiver_staff_number = receiver_emp.staff_number
        WHERE ta.act_number = ?
      `
      : `
        SELECT ta.*, 
          sender_emp.first_name as sender_first_name,
          sender_emp.surname as sender_surname,
          receiver_emp.first_name as receiver_first_name,
          receiver_emp.surname as receiver_surname
        FROM transfer_act ta
        LEFT JOIN employee sender_emp ON ta.sender_staff_number = sender_emp.staff_number
        LEFT JOIN employee receiver_emp ON ta.receiver_staff_number = receiver_emp.staff_number
        WHERE ta.act_number = ?
          AND (sender_emp.pickup_point_index = ? OR receiver_emp.pickup_point_index = ?)
      `;
    const params = position_name === 'Системный администратор'
      ? [act_number]
      : [act_number, pickup_point_index, pickup_point_index];
    const [actRows] = await pool.query(query, params);

    if (actRows.length === 0) {
      return res.status(404).json({ message: 'Акт не найден' });
    }

    const [contentRows] = await pool.query(`
      SELECT tac.*, s.ipo, s.shipment_status, s.receiver_passport_number
      FROM transfer_act_content tac
      JOIN shipment s ON tac.ipo = s.ipo
      WHERE tac.act_number = ?
      ORDER BY tac.item_no
    `, [act_number]);

    res.json({
      ...actRows[0],
      contents: contentRows
    });
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
      act_number,
      creation_date,
      sender_staff_number,
      receiver_staff_number,
      shipment_ipos
    } = req.body;

    await connection.query(
      `INSERT INTO transfer_act (
        act_number, creation_date, sender_staff_number, 
        receiver_staff_number, total_shipments
      ) VALUES (?, ?, ?, ?, ?)`,
      [act_number, creation_date, sender_staff_number, receiver_staff_number, shipment_ipos.length]
    );

    for (let i = 0; i < shipment_ipos.length; i++) {
      const ipo = shipment_ipos[i];
      
      await connection.query(
        `INSERT INTO transfer_act_content (act_number, item_no, ipo)
         VALUES (?, ?, ?)`,
        [act_number, i + 1, ipo]
      );

      await connection.query(
        `UPDATE shipment SET shipment_status = 'В пути' WHERE ipo = ?`,
        [ipo]
      );
    }

    await connection.commit();
    res.status(201).json({
      message: 'Акт доставки успешно создан',
      act_number: act_number
    });
  } catch (err) {
    await connection.rollback();
    console.error(err.message);
    res.status(500).json({ message: 'Ошибка при создании акта доставки' });
  } finally {
    connection.release();
  }
});

router.put('/:act_number/receive', async (req, res) => {
  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();

    const { act_number } = req.params;
    const { position_name, pickup_point_index } = req.user;

    const [existingActs] = await connection.query(
      position_name === 'Системный администратор'
        ? 'SELECT act_number FROM transfer_act WHERE act_number = ?'
        : `SELECT ta.act_number FROM transfer_act ta
           LEFT JOIN employee sender_emp ON ta.sender_staff_number = sender_emp.staff_number
           LEFT JOIN employee receiver_emp ON ta.receiver_staff_number = receiver_emp.staff_number
           WHERE ta.act_number = ? AND (sender_emp.pickup_point_index = ? OR receiver_emp.pickup_point_index = ?)`,
      position_name === 'Системный администратор' ? [act_number] : [act_number, pickup_point_index, pickup_point_index]
    );

    if (existingActs.length === 0) {
      await connection.rollback();
      return res.status(404).json({ message: 'Акт не найден или доступ запрещен' });
    }

    const [contentRows] = await connection.query(
      `SELECT ipo FROM transfer_act_content WHERE act_number = ?`,
      [act_number]
    );

    for (const row of contentRows) {
      await connection.query(
        `UPDATE shipment SET shipment_status = 'Готова к выдаче' WHERE ipo = ?`,
        [row.ipo]
      );
    }

    await connection.commit();
    res.json({ message: 'Акт получен, статусы обновлены' });
  } catch (err) {
    await connection.rollback();
    console.error(err.message);
    res.status(500).send('Server Error');
  } finally {
    connection.release();
  }
});

export default router;
