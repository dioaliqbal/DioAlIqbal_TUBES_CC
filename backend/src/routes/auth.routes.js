const express = require('express');
const { body } = require('express-validator');
const router = express.Router();
const { register, login, logout, getMe } = require('../controllers/auth.controller');
const { protect } = require('../middleware/auth.middleware');
const { validate } = require('../middleware/validate.middleware');

// Aturan validasi registrasi
const registerRules = [
  body('username')
    .trim()
    .isLength({ min: 3, max: 30 }).withMessage('Username harus 3-30 karakter.')
    .matches(/^[a-zA-Z0-9_]+$/).withMessage('Username hanya huruf, angka, underscore.'),
  body('email')
    .isEmail().withMessage('Format email tidak valid.')
    .normalizeEmail(),
  body('password')
    .isLength({ min: 8 }).withMessage('Password minimal 8 karakter.')
    .matches(/[A-Z]/).withMessage('Password harus ada huruf kapital.')
    .matches(/[0-9]/).withMessage('Password harus ada angka.'),
];

// Aturan validasi login
const loginRules = [
  body('email').isEmail().withMessage('Format email tidak valid.').normalizeEmail(),
  body('password').notEmpty().withMessage('Password tidak boleh kosong.'),
];

router.post('/register', registerRules, validate, register);
router.post('/login',    loginRules,    validate, login);
router.post('/logout',   protect,               logout);
router.get('/me',        protect,               getMe);

module.exports = router;
