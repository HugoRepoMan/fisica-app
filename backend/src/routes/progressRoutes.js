const express = require('express');
const router = express.Router();
const progressController = require('../controllers/progressController');
const auth = require('../middleware/authMiddleware');

// POST: /api/progreso/completar
// El usuario envía: { "modulo_id": 1, "estrellas_obtenidas": 3 }
router.post('/completar', auth, progressController.completarLeccion);

module.exports = router;