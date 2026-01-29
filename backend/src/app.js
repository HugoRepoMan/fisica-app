const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
require('dotenv').config();

const app = express();

// =======================================================
// MIDDLEWARES - ORDEN IMPORTANTE
// =======================================================

// 1. Helmet primero (seguridad)
app.use(helmet());

// 2. CORS
const allowedOrigins = process.env.ALLOWED_ORIGINS 
    ? process.env.ALLOWED_ORIGINS.split(',')
    : ['http://localhost:8000', 'file://'];

const corsOptions = {
    origin: function (origin, callback) {
        if (!origin) return callback(null, true);
        if (allowedOrigins.indexOf(origin) !== -1 || allowedOrigins.includes('*')) {
            callback(null, true);
        } else {
            callback(null, true); // Permitir todo en desarrollo
        }
    },
    credentials: true
};
app.use(cors(corsOptions));

// 3. BODY PARSERS - CRÍTICO: DEBEN IR ANTES DE LAS RUTAS
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// 4. Logger (opcional)
if (process.env.NODE_ENV !== 'production') {
    app.use((req, res, next) => {
        console.log(`${req.method} ${req.url}`);
        if (req.body && Object.keys(req.body).length > 0) {
            const safeBody = { ...req.body };
            if (safeBody.password) safeBody.password = '***';
            console.log('Body:', safeBody);
        }
        next();
    });
}

// 5. Rate limiting
const generalLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 100,
    message: { error: "Demasiadas peticiones" }
});
app.use('/api/', generalLimiter);

// =======================================================
// RUTAS
// =======================================================
const authRoutes = require('./routes/authRoutes');
const ejerciciosRoutes = require('./routes/ejerciciosRoutes');
const contentRoutes = require('./routes/contentRoutes');
const userRoutes = require('./routes/userRoutes');
const progressRoutes = require('./routes/progressRoutes');
const rankingRoutes = require('./routes/rankingRoutes');
const calculatorRoutes = require('./routes/calculatorRoutes');

app.use('/api/auth', authRoutes);
app.use('/api/ejercicios', ejerciciosRoutes);
app.use('/api/usuario', userRoutes);
app.use('/api/content', contentRoutes);
app.use('/api/progreso', progressRoutes);
app.use('/api/ranking', rankingRoutes);
app.use('/api/calculadora', calculatorRoutes);

// =======================================================
// RUTAS DE SISTEMA
// =======================================================
app.get('/', (req, res) => {
    res.json({ 
        mensaje: 'API de Física funcionando 🚀',
        version: '2.0.0'
    });
});

app.get('/health', async (req, res) => {
    try {
        const db = require('./config/db');
        await db.query('SELECT 1');
        res.json({ 
            status: 'healthy',
            database: 'connected',
            timestamp: new Date().toISOString()
        });
    } catch (error) {
        res.status(503).json({ 
            status: 'unhealthy',
            database: 'disconnected'
        });
    }
});

// 404
app.use((req, res) => {
    res.status(404).json({ 
        error: 'Ruta no encontrada',
        path: req.path
    });
});

// Error handler
app.use((err, req, res, next) => {
    console.error('❌ Error:', err);
    res.status(err.status || 500).json({
        error: process.env.NODE_ENV === 'production' 
            ? 'Error interno del servidor' 
            : err.message
    });
});

// =======================================================
// INICIAR SERVIDOR
// =======================================================
const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
    console.log(`\n🚀 Servidor en puerto ${PORT}`);
    console.log(`   Entorno: ${process.env.NODE_ENV || 'development'}\n`);
});

module.exports = app;