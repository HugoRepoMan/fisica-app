// src/routes/userRoutes.js
const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController');
const auth = require('../middleware/authMiddleware');
const db = require('../config/db');

// Endpoints existentes
router.get('/logros', auth, userController.obtenerLogros);
router.get('/perfil', auth, userController.obtenerPerfil);

// ⭐ NUEVO ENDPOINT: Guardar logros desbloqueado
router.post('/logros', auth, async (req, res) => {
    try {
        const userId = req.usuario.id;
        const { logros } = req.body; // Array de IDs [1, 2, 3]
        
        console.log(`📥 Recibiendo logros para usuario ${userId}:`, logros);
        
        if (!Array.isArray(logros) || logros.length === 0) {
            return res.status(400).json({ error: "Logros inválidos" });
        }
        
        // Obtener logros actuales
        const [users] = await db.query('SELECT logros FROM usuarios WHERE id = ?', [userId]);
        let logrosActuales = users[0].logros || [];
        
        console.log(`📊 Logros actuales en BD:`, logrosActuales);
        
        // Si viene como string JSON, parsearlo
        if (typeof logrosActuales === 'string') {
            logrosActuales = JSON.parse(logrosActuales);
        }
        
        // Si es NULL, inicializar como array vacío
        if (!Array.isArray(logrosActuales)) {
            logrosActuales = [];
        }
        
        // Agregar nuevos logros sin duplicar
        logros.forEach(logroId => {
            if (!logrosActuales.includes(logroId)) {
                logrosActuales.push(logroId);
                console.log(`🏆 Nuevo logro agregado: ${logroId}`);
            }
        });
        
        // Guardar en la BD
        await db.query(
            'UPDATE usuarios SET logros = ? WHERE id = ?',
            [JSON.stringify(logrosActuales), userId]
        );
        
        console.log(`✅ Logros actualizados para usuario ${userId}:`, logrosActuales);
        
        res.json({ 
            msg: "Logros guardados",
            logros: logrosActuales
        });
        
    } catch (error) {
        console.error("❌ Error guardando logros:", error);
        res.status(500).json({ error: "Error al guardar logros" });
    }
});

module.exports = router;