const express = require('express');
const { body } = require('express-validator');
const router = express.Router();
const { getProfile, updateProfile, changePassword, getSessions } = require('../controllers/user.controller');
const { protect } = require('../middleware/auth.middleware');
const { validate } = require('../middleware/validate.middleware');

// Semua route di sini butuh autentikasi
router.use(protect);

// GET /api/users/profile
router.get('/profile', getProfile);

// PUT /api/users/profile
router.put('/profile', [
  body('username')
    .trim()
    .isLength({ min: 3, max: 30 }).withMessage('Username harus 3-30 karakter.')
    .matches(/^[a-zA-Z0-9_]+$/).withMessage('Username tidak valid.'),
], validate, updateProfile);

// PUT /api/users/change-password
router.put('/change-password', [
  body('currentPassword').notEmpty().withMessage('Password saat ini wajib diisi.'),
  body('newPassword')
    .isLength({ min: 8 }).withMessage('Password baru minimal 8 karakter.')
    .matches(/[A-Z]/).withMessage('Password harus mengandung huruf kapital.')
    .matches(/[0-9]/).withMessage('Password harus mengandung angka.'),
], validate, changePassword);

// GET /api/users/sessions
router.get('/sessions', getSessions);

module.exports = router;
