require('dotenv').config();

const express    = require('express');
const cors       = require('cors');
const helmet     = require('helmet');
const morgan     = require('morgan');
const rateLimit  = require('express-rate-limit');
const swaggerUi  = require('swagger-ui-express');

const logger       = require('./utils/logger');
const swaggerSpec  = require('./utils/swagger.config');
const authRoutes   = require('./routes/auth.routes');
const userRoutes   = require('./routes/user.routes');
const healthRoutes = require('./routes/health.routes');
const systemRoutes = require('./routes/system.routes');
const { errorHandler } = require('./middleware/error.middleware');
const { connectDB }    = require('./config/database');

const app  = express();
const PORT = process.env.PORT || 3000;

app.use(helmet({ contentSecurityPolicy: false }));
app.use(cors({
  origin: process.env.FRONTEND_URL || '*',
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));

const globalLimiter = rateLimit({ windowMs: 15*60*1000, max: 100, standardHeaders: true, legacyHeaders: false, message: { error: 'Terlalu banyak permintaan.' } });
const authLimiter   = rateLimit({ windowMs: 15*60*1000, max: 20,  message: { error: 'Terlalu banyak percobaan.' } });

app.use(globalLimiter);
app.use(express.json({ limit: '10kb' }));
app.use(express.urlencoded({ extended: true }));
app.use(morgan('combined', { stream: logger.morganStream }));

// Swagger docs
app.use('/api/docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec, {
  customCss: '.swagger-ui .topbar { display: none }',
  customSiteTitle: 'AuthSentinel API Docs',
}));

app.get('/', (req, res) => res.json({ name: 'AuthSentinel API', version: '1.0.0', status: 'running', docs: '/api/docs' }));
app.use('/api/health',  healthRoutes);
app.use('/api/auth',    authLimiter, authRoutes);
app.use('/api/users',   userRoutes);
app.use('/api/system',  systemRoutes);

app.use((req, res) => res.status(404).json({ error: 'Endpoint tidak ditemukan.' }));
app.use(errorHandler);

async function startServer() {
  try {
    await connectDB();
    logger.info('[DB] Terhubung ke PostgreSQL.');
    app.listen(PORT, () => {
      logger.info(`[SERVER] AuthSentinel API berjalan di port ${PORT}`);
      logger.info(`[ENV]    ${process.env.NODE_ENV || 'development'}`);
      logger.info(`[DOCS]   http://localhost:${PORT}/api/docs`);
    });
  } catch (err) {
    logger.error('[FATAL] Gagal koneksi database:', err.message);
    process.exit(1);
  }
}

startServer();
module.exports = app;
