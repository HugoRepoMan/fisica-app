const express = require('express');
const router = express.Router();
const contentController = require('../controllers/contentController');

// Esto define el endpoint GET /api/content
router.get('/', contentController.obtenerRuta);

// Esto define el endpoint GET /api/content/leccion/:id_modulo
router.get('/leccion/:id_modulo', contentController.obtenerLeccion);

module.exports = router;