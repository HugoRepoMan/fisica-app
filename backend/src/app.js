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
// 👇 ESTO ES NUEVO: Importamos el mapa de contenidos
const contentRoutes = require('./routes/contentRoutes'); 

// --- 2. USAR LAS RUTAS ---
app.use('/api/auth', authRoutes);
app.use('/api/ejercicios', ejerciciosRoutes);
// 👇 ESTO ES NUEVO: Habilitamos la URL para pedir la ruta de aprendizaje
app.use('/api/contenido', contentRoutes);

app.get('/', (req, res) => {
    res.json({ mensaje: 'API de Física funcionando 🚀' });
});

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
    console.log(`Servidor corriendo en el puerto ${PORT}`);
});