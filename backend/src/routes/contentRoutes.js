const express = require('express');
const router = express.Router();
const contentController = require('../controllers/contentController');

// Cambiamos '/' por '/ruta' para que coincida con el frontend
router.get('/ruta', contentController.obtenerRuta); 

// El resto se queda igual
router.get('/leccion/:id_modulo', contentController.obtenerLeccion);

module.exports = router;