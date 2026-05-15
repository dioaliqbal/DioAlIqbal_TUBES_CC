const express = require('express');
const router = express.Router();
const { query } = require('../config/database');

router.get('/', async (req, res) => {
  try {
    const dbResult = await query('SELECT NOW() as time');
    res.json({
      status: 'OK',
      timestamp: new Date().toISOString(),
      database: 'connected',
      db_time: dbResult.rows[0].time,
      uptime: Math.floor(process.uptime()) + 's',
    });
  } catch (err) {
    res.status(503).json({ status: 'ERROR', database: 'disconnected', error: err.message });
  }
});

module.exports = router;
