import express from 'express';
import pool from '../db.js';

const router = express.Router();

router.get('/', async (req, res) => {
  try {
    const [rows] = await pool.query('SELECT * FROM position');
    res.json(rows);
  } catch (err) {
    console.error('Error fetching positions:', err.message);
    res.status(500).send('Server Error');
  }
});

export default router;