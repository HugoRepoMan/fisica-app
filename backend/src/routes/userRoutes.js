const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController');
const auth = require('../middleware/authMiddleware');

router.get('/perfil', auth, userController.obtenerPerfil);

module.exports = router;