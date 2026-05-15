function errorHandler(err, req, res, next) {
  console.error('[ERROR]', err.message);
  if (err.code === '23505') {
    const field = err.detail && err.detail.includes('username') ? 'Username' : 'Email';
    return res.status(409).json({ error: field + ' sudah terdaftar.' });
  }
  const statusCode = err.statusCode || 500;
  const message = process.env.NODE_ENV === 'production' ? 'Terjadi kesalahan server.' : err.message;
  res.status(statusCode).json({ error: message });
}

function asyncHandler(fn) {
  return (req, res, next) => Promise.resolve(fn(req, res, next)).catch(next);
}

module.exports = { errorHandler, asyncHandler };
