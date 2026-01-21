const express = require('express');
const router = express.Router();
const calculatorController = require('../controllers/calculatorController');
const auth = require('../middleware/authMiddleware');

// 1. Calculadoras (POST)
router.post('/newton', auth, calculatorController.calcularNewton);
router.post('/friccion', auth, calculatorController.calcularFriccion);
router.post('/peso', auth, calculatorController.calcularPeso);

// 2. Diagrama de Cuerpo Libre (DCL) - Sirve para las 3 calculadoras
router.post('/dcl', auth, calculatorController.obtenerDCL);

// 3. Historial
router.get('/historial', auth, calculatorController.obtenerHistorial);

module.exports = router;