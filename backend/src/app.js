const express = require('express');
const cors = require('cors');
require('dotenv').config();

const app = express();

// Middlewares
app.use(cors());
app.use(express.json()); 

// --- 1. IMPORTAR LAS RUTAS ---
const authRoutes = require('./routes/authRoutes');
const ejerciciosRoutes = require('./routes/ejerciciosRoutes');
const contentRoutes = require('./routes/contentRoutes'); 
const userRoutes = require('./routes/userRoutes');
const progressRoutes = require('./routes/progressRoutes')
const rankingRoutes = require('./routes/rankingRoutes');
// --- 2. USAR LAS RUTAS ---
app.use('/api/auth', authRoutes);
app.use('/api/ejercicios', ejerciciosRoutes);
app.use('/api/usuario', userRoutes);
app.use('/api/contenido', contentRoutes);
app.use('/api/progreso', progressRoutes);
app.use('/api/ranking', rankingRoutes);
app.get('/', (req, res) => {
    res.json({ mensaje: 'API de Física funcionando 🚀' });
});

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
    console.log(`Servidor corriendo en el puerto ${PORT}`);
});