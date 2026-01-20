const express = require('express');
const router = express.Router();
const calculatorController = require('../controllers/calculatorController');
const auth = require('../middleware/authMiddleware');

// POST: /api/calculadora/newton
router.post('/newton', auth, calculatorController.calcularNewton);

// POST: /api/calculadora/friccion
router.post('/friccion', auth, calculatorController.calcularFriccion);

// POST: /api/calculadora/peso
router.post('/peso', auth, calculatorController.calcularPeso);

module.exports = router;