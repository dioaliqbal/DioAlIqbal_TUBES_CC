const express = require('express');
const router  = express.Router();
const os      = require('os');
const { query }   = require('../config/database');
const { protect } = require('../middleware/auth.middleware');
const logger      = require('../utils/logger');

/**
 * @openapi
 * /system/status:
 *   get:
 *     summary: Status infrastruktur real-time
 *     tags: [System]
 *     security: [{bearerAuth: []}]
 *     responses:
 *       200:
 *         description: Status semua komponen
 */
router.get('/status', protect, async (req, res) => {
  try {
    const dbCheck    = await query('SELECT NOW() as time, version() as version');
    const userCount  = await query('SELECT COUNT(*) as total FROM users');
    const logStats   = await query(`
      SELECT
        COUNT(*) FILTER (WHERE action = 'LOGIN_SUCCESS') as login_success,
        COUNT(*) FILTER (WHERE action = 'LOGIN_FAILED')  as login_failed,
        COUNT(*) FILTER (WHERE action = 'REGISTER')      as registers,
        COUNT(*) FILTER (WHERE action = 'LOGOUT')        as logouts
      FROM auth_logs
      WHERE created_at > NOW() - INTERVAL '7 days'
    `);
    const stats = logStats.rows[0];
    const uptimeSec = Math.floor(process.uptime());
    const memTotal = Math.round(os.totalmem() / 1024 / 1024);
    const memFree  = Math.round(os.freemem()  / 1024 / 1024);
    const memUsed  = memTotal - memFree;

    res.json({
      status: 'OK',
      timestamp: new Date().toISOString(),
      server: {
        uptime: uptimeSec > 3600
          ? `${Math.floor(uptimeSec/3600)}h ${Math.floor((uptimeSec%3600)/60)}m`
          : `${Math.floor(uptimeSec/60)}m ${uptimeSec%60}s`,
        uptime_sec: uptimeSec,
        node_env: process.env.NODE_ENV || 'development',
        port: process.env.PORT || 3000,
        node_ver: process.version,
      },
      memory: {
        total_mb: memTotal,
        used_mb:  memUsed,
        free_mb:  memFree,
        used_pct: Math.round((memUsed / memTotal) * 100),
      },
      database: {
        status:  'connected',
        version: dbCheck.rows[0].version.split(' ').slice(0,2).join(' '),
        db_time: dbCheck.rows[0].time,
        db_name: process.env.DB_NAME || 'authsentinel',
      },
      containers: {
        frontend: { name: 'authsentinel-frontend', image: 'nginx:alpine',       port: 80,   status: 'running' },
        backend:  { name: 'authsentinel-backend',  image: 'node:20-alpine',     port: 3000, status: 'running' },
        database: { name: 'authsentinel-db',       image: 'postgres:15-alpine', port: 5432, status: 'running' },
      },
      users: { total: parseInt(userCount.rows[0].total) },
      auth_stats_7d: {
        login_success: parseInt(stats.login_success) || 0,
        login_failed:  parseInt(stats.login_failed)  || 0,
        registers:     parseInt(stats.registers)     || 0,
        logouts:       parseInt(stats.logouts)       || 0,
      },
    });
  } catch (err) {
    logger.error('[SYSTEM] Status error:', err.message);
    res.status(503).json({ status: 'ERROR', error: err.message });
  }
});

/**
 * @openapi
 * /system/logs:
 *   get:
 *     summary: 20 auth log terbaru
 *     tags: [System]
 *     security: [{bearerAuth: []}]
 */
router.get('/logs', protect, async (req, res) => {
  try {
    const result = await query(`
      SELECT al.id, al.action, al.ip_address, al.created_at,
             u.username, u.email
      FROM auth_logs al
      JOIN users u ON al.user_id = u.id
      ORDER BY al.created_at DESC LIMIT 20
    `);
    res.json({ logs: result.rows });
  } catch (err) {
    logger.error('[SYSTEM] Logs error:', err.message);
    res.status(500).json({ error: err.message });
  }
});

/**
 * @openapi
 * /system/chart:
 *   get:
 *     summary: Data chart auth activity 7 hari
 *     tags: [System]
 *     security: [{bearerAuth: []}]
 */
router.get('/chart', protect, async (req, res) => {
  try {
    const result = await query(`
      SELECT DATE(created_at) as date,
        COUNT(*) FILTER (WHERE action = 'LOGIN_SUCCESS') as login_success,
        COUNT(*) FILTER (WHERE action = 'LOGIN_FAILED')  as login_failed,
        COUNT(*) FILTER (WHERE action = 'REGISTER')      as registers
      FROM auth_logs
      WHERE created_at > NOW() - INTERVAL '7 days'
      GROUP BY DATE(created_at) ORDER BY date ASC
    `);

    const days = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      days.push(d.toISOString().split('T')[0]);
    }

    const dataMap = {};
    result.rows.forEach(r => {
      dataMap[r.date.toISOString ? r.date.toISOString().split('T')[0] : String(r.date).split('T')[0]] = r;
    });

    const chartData = days.map(day => ({
      date:          day,
      login_success: parseInt(dataMap[day]?.login_success) || 0,
      login_failed:  parseInt(dataMap[day]?.login_failed)  || 0,
      registers:     parseInt(dataMap[day]?.registers)     || 0,
    }));

    res.json({
      labels: chartData.map(d => {
        const dt = new Date(d.date + 'T00:00:00');
        return dt.toLocaleDateString('id-ID', { weekday: 'short', day: 'numeric' });
      }),
      datasets: {
        login_success: chartData.map(d => d.login_success),
        login_failed:  chartData.map(d => d.login_failed),
        registers:     chartData.map(d => d.registers),
      },
    });
  } catch (err) {
    logger.error('[SYSTEM] Chart error:', err.message);
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
