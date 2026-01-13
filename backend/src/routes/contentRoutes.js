// src/routes/contentRoutes.js
const express = require('express');
const router = express.Router();
const contentController = require('../controllers/contentController'); 
const auth = require('../middleware/authMiddleware'); 

// Ruta Principal: Obtener el mapa con candados (Requiere Token)
router.get('/ruta', auth, contentController.obtenerRuta);

// Ruta Secundaria: Obtener el contenido interno (Fórmulas)
router.get('/leccion/:id_modulo', auth, contentController.obtenerLeccion);

module.exports = router;