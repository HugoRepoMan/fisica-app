const express = require('express');
const cors = require('cors');
require('dotenv').config();

const app = express();

// Middlewares
app.use(cors());
app.use(express.json()); 

// =======================================================
// 🕵️ ZONA DEL ESPÍA (LOGGER) - VERSIÓN CORREGIDA
// =======================================================
app.use((req, res, next) => {
    console.log(`\n🔴 ------------------------------------------------`);
    console.log(`📡 PETICIÓN RECIBIDA: ${req.method} ${req.url}`);
    
    // Verificamos si trae el token en el header
    const token = req.header('x-auth-token');
    console.log(`🔑 Token recibido: ${token ? '✅ SÍ (' + token.substring(0, 10) + '...)' : '❌ NO TIENE'}`);
    
    // CORRECCIÓN: Verificamos si req.body existe antes de leerlo
    if (req.body && Object.keys(req.body).length > 0) {
        console.log(`📦 Body (Datos):`, JSON.stringify(req.body, null, 2));
    } else {
        console.log(`📦 Body: (Vacío o GET)`);
    }
    console.log(`------------------------------------------------ 🔴\n`);
    
    next(); 
});
// =======================================================

// --- 1. IMPORTAR LAS RUTAS ---
const authRoutes = require('./routes/authRoutes');
const ejerciciosRoutes = require('./routes/ejerciciosRoutes');
const contentRoutes = require('./routes/contentRoutes'); 
const userRoutes = require('./routes/userRoutes');
const progressRoutes = require('./routes/progressRoutes')
const rankingRoutes = require('./routes/rankingRoutes');
const calculatorRoutes = require('./routes/calculatorRoutes');

// --- 2. USAR LAS RUTAS ---
app.use('/api/auth', authRoutes);
app.use('/api/ejercicios', ejerciciosRoutes);
app.use('/api/usuario', userRoutes);
app.use('/api/content', contentRoutes);
app.use('/api/progreso', progressRoutes);
app.use('/api/ranking', rankingRoutes);
app.use('/api/calculadora', calculatorRoutes);

app.get('/', (req, res) => {
    res.json({ mensaje: 'API de Física funcionando 🚀' });
});

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
    console.log(`Servidor corriendo en el puerto ${PORT}`);
});