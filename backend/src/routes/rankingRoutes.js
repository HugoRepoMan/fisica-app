// src/routes/rankingRoutes.js
const express = require('express');
const router = express.Router();
const rankingController = require('../controllers/rankingController');
const auth = require('../middleware/authMiddleware');

// GET: /api/ranking
router.get('/', auth, rankingController.obtenerRanking);

module.exports = router;