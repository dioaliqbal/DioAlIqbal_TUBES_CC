require('dotenv').config();
const { Pool } = require('pg');
const fs = require('fs');
const path = require('path');

const pool = new Pool({
  host: process.env.DB_HOST,
  port: parseInt(process.env.DB_PORT) || 5432,
  database: process.env.DB_NAME,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  ssl: process.env.DB_SSL === 'true' ? { rejectUnauthorized: false } : false,
});

async function runMigrations() {
  const client = await pool.connect();
  try {
    const sqlFile = path.join(__dirname, '001_create_tables.sql');
    const sql = fs.readFileSync(sqlFile, 'utf-8');
    console.log('[MIGRATE] Menjalankan migrasi...');
    await client.query(sql);
    console.log('[MIGRATE] Selesai! Tabel berhasil dibuat.');
  } catch (err) {
    console.error('[MIGRATE] Error:', err.message);
    process.exit(1);
  } finally {
    client.release();
    await pool.end();
  }
}

runMigrations();
