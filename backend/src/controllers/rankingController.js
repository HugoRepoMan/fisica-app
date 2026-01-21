// src/controllers/rankingController.js
const db = require('../config/db');

exports.obtenerRanking = async (req, res) => {
    try {
        // 1. Obtener el Top 10 usuarios con más XP
        // Solo enviamos nombre, nivel y xp (no enviamos email ni password por seguridad)
        const [top10] = await db.query(`
            SELECT nombre, nivel, xp_actual, titulo_usuario 
            FROM usuarios 
            ORDER BY xp_actual DESC 
            LIMIT 10
        `);

        // 2. (Opcional) Calcular la posición del usuario actual
        // Contamos cuánta gente tiene MÁS xp que yo. Si hay 5 personas con más XP, yo soy el 6.
        const userId = req.usuario.id;
        let miPosicion = 0;

        const [userStats] = await db.query('SELECT xp_actual FROM usuarios WHERE id = ?', [userId]);
        
        if (userStats.length > 0) {
            const miXP = userStats[0].xp_actual;
            const [genteMejor] = await db.query('SELECT COUNT(*) as count FROM usuarios WHERE xp_actual > ?', [miXP]);
            miPosicion = genteMejor[0].count + 1;
        }

        res.json({
            top10: top10,
            miPosicion: miPosicion
        });

    } catch (error) {
        console.error(error);
        res.status(500).json({ error: "Error al obtener ranking" });
    }
};