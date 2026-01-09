const express = require('express');
const cors = require('cors');
require('dotenv').config();

const app = express();

// Middlewares
app.use(cors());
app.use(express.json()); 


const authRoutes = require('./routes/authRoutes');
const ejerciciosRoutes = require('./routes/ejerciciosRoutes');

// Rutas
app.use('/api/auth', authRoutes);
app.use('/api/ejercicios', ejerciciosRoutes);

app.get('/', (req, res) => {
    res.json({ mensaje: 'API de Física funcionando 🚀' });
});

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
    console.log(`Servidor corriendo en el puerto ${PORT}`);
});