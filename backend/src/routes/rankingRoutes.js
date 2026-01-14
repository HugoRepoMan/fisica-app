// src/routes/rankingRoutes.js
const express = require('express');
const router = express.Router();
const rankingController = require('../controllers/rankingController');
const auth = require('../middleware/authMiddleware'); // Solo usuarios logueados pueden ver el ranking

// GET: http://localhost:3000/api/ranking
router.get('/', auth, rankingController.obtenerRanking);

module.exports = router;