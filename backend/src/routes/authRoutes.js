const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');

//Rutas
router.post('/registro', authController.registrarUsuario);
router.post('/login', authController.login);

module.exports = router;