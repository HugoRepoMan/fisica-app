const express = require('express');
const router = express.Router();
const ejerciciosController = require('../controllers/ejerciciosController');
const auth = require('../middleware/authMiddleware'); // Importamos al portero

// Ruta GET para ver ejercicios
// Fíjate que ponemos 'auth' en medio. Eso activa la seguridad.
router.get('/', auth, ejerciciosController.obtenerEjercicios);

module.exports = router;