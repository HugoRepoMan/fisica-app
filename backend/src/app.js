const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
require('dotenv').config();

const app = express();

// 1. Helmet - Headers de seguridad
app.use(helmet());

// 2. CORS - Configuración restrictiva
const allowedOrigins = process.env.ALLOWED_ORIGINS 
    ? process.env.ALLOWED_ORIGINS.split(',')
    : ['http://localhost:8000', 'file://'];

const corsOptions = {
    origin: function (origin, callback) {
        // Permitir peticiones sin origin (mobile apps, Cordova)
        if (!origin) return callback(null, true);
        
        if (allowedOrigins.indexOf(origin) !== -1) {
            callback(null, true);
        } else {
            console.warn(`❌ Origen bloqueado por CORS: ${origin}`);
            callback(new Error('Not allowed by CORS'));
        }
    },
    credentials: true,
    optionsSuccessStatus: 200
};

app.use(cors(corsOptions));

// 3. Parseo de JSON
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// =======================================================
// RATE LIMITING
// =======================================================

// Limiter general para toda la API
const generalLimiter = rateLimit({
    windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS || 15) * 60 * 1000,
    max: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS || 100),
    message: { error: "Demasiadas peticiones. Intenta de nuevo más tarde." },
    standardHeaders: true,
    legacyHeaders: false,
});

// Limiter específico para login (más restrictivo)
const loginLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutos
    max: parseInt(process.env.LOGIN_RATE_LIMIT_MAX || 5),
    message: { error: "Demasiados intentos de login. Intenta en 15 minutos." },
    skipSuccessfulRequests: true, // No cuenta intentos exitosos
});

app.use('/api/', generalLimiter);

// =======================================================
// LOGGER MIDDLEWARE (Solo en desarrollo)
// =======================================================
if (process.env.NODE_ENV !== 'production') {
    app.use((req, res, next) => {
        console.log(`\n🔴 ------------------------------------------------`);
        console.log(`📡 ${req.method} ${req.url}`);
        
        const token = req.header('x-auth-token');
        console.log(`🔑 Token: ${token ? '✅ Presente' : '❌ Ausente'}`);
        
        if (req.body && Object.keys(req.body).length > 0) {
            // No loguear passwords
            const safeBody = { ...req.body };
            if (safeBody.password) safeBody.password = '***';
            console.log(`📦 Body:`, JSON.stringify(safeBody, null, 2));
        }
        console.log(`------------------------------------------------ 🔴\n`);
        
        next();
    });
}

// =======================================================
// IMPORTAR RUTAS
// =======================================================
const authRoutes = require('./routes/authRoutes');
const ejerciciosRoutes = require('./routes/ejerciciosRoutes');
const contentRoutes = require('./routes/contentRoutes');
const userRoutes = require('./routes/userRoutes');
const progressRoutes = require('./routes/progressRoutes');
const rankingRoutes = require('./routes/rankingRoutes');
const calculatorRoutes = require('./routes/calculatorRoutes');

// =======================================================
// USAR RUTAS
// =======================================================
app.use('/api/auth', authRoutes);
app.use('/api/ejercicios', ejerciciosRoutes);
app.use('/api/usuario', userRoutes);
app.use('/api/content', contentRoutes);
app.use('/api/progreso', progressRoutes);
app.use('/api/ranking', rankingRoutes);
app.use('/api/calculadora', calculatorRoutes);

// =======================================================
// RUTA RAÍZ Y HEALTH CHECK
// =======================================================
app.get('/', (req, res) => {
    res.json({ 
        mensaje: 'API de Física funcionando 🚀',
        version: '1.0.0',
        status: 'active'
    });
});

// Health Check para monitoreo
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
        console.error('Health check failed:', error);
        res.status(503).json({ 
            status: 'unhealthy',
            database: 'disconnected',
            error: process.env.NODE_ENV === 'production' 
                ? 'Database error' 
                : error.message
        });
    }
});

// =======================================================
// MANEJO DE RUTAS NO ENCONTRADAS
// =======================================================
app.use((req, res) => {
    res.status(404).json({ 
        error: 'Ruta no encontrada',
        path: req.path
    });
});

// =======================================================
// MIDDLEWARE DE MANEJO DE ERRORES GLOBAL
// =======================================================
app.use((err, req, res, next) => {
    // Log del error
    console.error('❌ Error capturado:', err);
    
    // Si es error de CORS
    if (err.message === 'Not allowed by CORS') {
        return res.status(403).json({ 
            error: 'Acceso denegado por política CORS' 
        });
    }

    // Respuesta genérica de error
    res.status(err.status || 500).json({
        error: process.env.NODE_ENV === 'production' 
            ? 'Error interno del servidor' 
            : err.message,
        ...(process.env.NODE_ENV !== 'production' && { 
            stack: err.stack,
            path: req.path
        })
    });
});

// =======================================================
// INICIAR SERVIDOR
// =======================================================
const PORT = process.env.PORT || 3000;

const server = app.listen(PORT, () => {
    console.log(`\n🚀 ========================================`);
    console.log(`   Servidor corriendo en puerto ${PORT}`);
    console.log(`   Entorno: ${process.env.NODE_ENV || 'development'}`);
    console.log(`   CORS permitido: ${allowedOrigins.join(', ')}`);
    console.log(`========================================\n`);
});

// Manejo de señales de terminación
process.on('SIGTERM', () => {
    console.log('🛑 SIGTERM recibido. Cerrando servidor...');
    server.close(() => {
        console.log('✅ Servidor cerrado correctamente');
        process.exit(0);
    });
});

module.exports = app; 