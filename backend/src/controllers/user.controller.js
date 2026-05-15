const bcrypt = require('bcryptjs');
const { query } = require('../config/database');
const { asyncHandler } = require('../middleware/error.middleware');

const getProfile = asyncHandler(async (req, res) => {
  const result = await query(
    'SELECT id, username, email, role, created_at, last_login FROM users WHERE id = $1',
    [req.user.id]
  );
  res.json({ user: result.rows[0] });
});

const updateProfile = asyncHandler(async (req, res) => {
  const { username } = req.body;
  const check = await query(
    'SELECT id FROM users WHERE username = $1 AND id != $2',
    [username.toLowerCase(), req.user.id]
  );
  if (check.rows.length > 0) {
    return res.status(409).json({ error: 'Username sudah digunakan.' });
  }
  const result = await query(
    'UPDATE users SET username = $1, updated_at = NOW() WHERE id = $2 RETURNING id, username, email, role',
    [username.toLowerCase(), req.user.id]
  );
  res.json({ message: 'Profil diperbarui.', user: result.rows[0] });
});

const changePassword = asyncHandler(async (req, res) => {
  const { currentPassword, newPassword } = req.body;
  const result = await query('SELECT password_hash FROM users WHERE id = $1', [req.user.id]);
  const isMatch = await bcrypt.compare(currentPassword, result.rows[0].password_hash);
  if (!isMatch) {
    return res.status(400).json({ error: 'Password saat ini salah.' });
  }
  const rounds = parseInt(process.env.BCRYPT_ROUNDS) || 12;
  const newHash = await bcrypt.hash(newPassword, rounds);
  await query('UPDATE users SET password_hash = $1, updated_at = NOW() WHERE id = $2', [newHash, req.user.id]);
  res.json({ message: 'Password berhasil diubah.' });
});

const getSessions = asyncHandler(async (req, res) => {
  const result = await query(
    'SELECT action, ip_address, created_at FROM auth_logs WHERE user_id = $1 ORDER BY created_at DESC LIMIT 20',
    [req.user.id]
  );
  res.json({ sessions: result.rows });
});

module.exports = { getProfile, updateProfile, changePassword, getSessions };
