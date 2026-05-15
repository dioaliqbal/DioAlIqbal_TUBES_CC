const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { v4: uuidv4 } = require('uuid');
const { query } = require('../config/database');
const { asyncHandler } = require('../middleware/error.middleware');

function generateToken(payload) {
  return jwt.sign(payload, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN || '7d',
  });
}

// POST /api/auth/register
const register = asyncHandler(async (req, res) => {
  const { username, email, password } = req.body;

  // Cek duplikat
  const existing = await query(
    'SELECT id FROM users WHERE email = $1 OR username = $2',
    [email.toLowerCase(), username.toLowerCase()]
  );
  if (existing.rows.length > 0) {
    return res.status(409).json({ error: 'Email atau username sudah terdaftar.' });
  }

  // Hash password
  const rounds = parseInt(process.env.BCRYPT_ROUNDS) || 12;
  const passwordHash = await bcrypt.hash(password, rounds);

  // Insert ke database
  const result = await query(
    `INSERT INTO users (id, username, email, password_hash, role, created_at)
     VALUES ($1, $2, $3, $4, 'user', NOW())
     RETURNING id, username, email, role, created_at`,
    [uuidv4(), username.toLowerCase(), email.toLowerCase(), passwordHash]
  );

  const user = result.rows[0];
  const token = generateToken({ id: user.id, email: user.email, role: user.role });

  // Log aktivitas
  await query(
    'INSERT INTO auth_logs (user_id, action, ip_address, created_at) VALUES ($1, $2, $3, NOW())',
    [user.id, 'REGISTER', req.ip]
  ).catch(() => {}); // Jangan gagalkan register jika log error

  res.status(201).json({
    message: 'Registrasi berhasil.',
    token,
    user: { id: user.id, username: user.username, email: user.email, role: user.role },
  });
});

// POST /api/auth/login
const login = asyncHandler(async (req, res) => {
  const { email, password } = req.body;

  const result = await query(
    'SELECT id, username, email, password_hash, role, is_active FROM users WHERE email = $1',
    [email.toLowerCase()]
  );
  const user = result.rows[0];

  // Cek password (timing-safe)
  const dummy = '$2b$12$dummy.hash.to.prevent.timing.attacks.xxxxxxxxxxxxxxxxxxxxxxx';
  const passwordMatch = user
    ? await bcrypt.compare(password, user.password_hash)
    : await bcrypt.compare(password, dummy);

  if (!user || !passwordMatch) {
    if (user) {
      await query(
        'INSERT INTO auth_logs (user_id, action, ip_address, created_at) VALUES ($1, $2, $3, NOW())',
        [user.id, 'LOGIN_FAILED', req.ip]
      ).catch(() => {});
    }
    return res.status(401).json({ error: 'Email atau password salah.' });
  }

  if (!user.is_active) {
    return res.status(403).json({ error: 'Akun dinonaktifkan. Hubungi administrator.' });
  }

  await query('UPDATE users SET last_login = NOW() WHERE id = $1', [user.id]);
  await query(
    'INSERT INTO auth_logs (user_id, action, ip_address, created_at) VALUES ($1, $2, $3, NOW())',
    [user.id, 'LOGIN_SUCCESS', req.ip]
  ).catch(() => {});

  const token = generateToken({ id: user.id, email: user.email, role: user.role });

  res.json({
    message: 'Login berhasil.',
    token,
    user: { id: user.id, username: user.username, email: user.email, role: user.role },
  });
});

// POST /api/auth/logout
const logout = asyncHandler(async (req, res) => {
  await query(
    'INSERT INTO auth_logs (user_id, action, ip_address, created_at) VALUES ($1, $2, $3, NOW())',
    [req.user.id, 'LOGOUT', req.ip]
  ).catch(() => {});
  res.json({ message: 'Logout berhasil.' });
});

// GET /api/auth/me
const getMe = asyncHandler(async (req, res) => {
  const result = await query(
    'SELECT id, username, email, role, created_at, last_login FROM users WHERE id = $1',
    [req.user.id]
  );
  res.json({ user: result.rows[0] });
});

module.exports = { register, login, logout, getMe };
