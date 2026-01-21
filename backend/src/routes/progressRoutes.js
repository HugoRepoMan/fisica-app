const express = require('express');
const router = express.Router();
const progressController = require('../controllers/progressController');
const auth = require('../middleware/authMiddleware');

// Cuando fallas una pregunta (Resta Vida)
router.post('/fallar', auth, progressController.restarVida);

// Cuando terminas la lección (Suma XP, Nivel y Logros) <--- ESTA ES LA NUEVA
router.post('/completar', auth, progressController.completarLeccion);

module.exports = router;
