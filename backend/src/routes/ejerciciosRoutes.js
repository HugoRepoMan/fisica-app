const express = require('express');
const router = express.Router();
const ejerciciosController = require('../controllers/ejerciciosController');
const auth = require('../middleware/authMiddleware'); 

router.get('/', auth, ejerciciosController.obtenerEjercicios);

router.post('/validar', auth, ejerciciosController.validarRespuesta);
module.exports = router;