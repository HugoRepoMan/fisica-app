// src/controllers/userController.js
const db = require('../config/db');

exports.obtenerPerfil = async (req, res) => {
    try {
        const userId = req.usuario.id;

        // 1. Obtener datos del usuario + Stats
        const [users] = await db.query(`
            SELECT id, nombre, email, nivel, xp_actual, vidas, 
                   racha, lecciones_completadas, total_aciertos, total_intentos 
            FROM usuarios WHERE id = ?
        `, [userId]);
        
        if (users.length === 0) return res.status(404).json({ msg: "Usuario no encontrado" });
        
        let user = users[0];

        // 2. Cálculos para el Frontend
        // Precisión: (Aciertos / Intentos) * 100
        let precision = 0;
        if (user.total_intentos > 0) {
            precision = Math.round((user.total_aciertos / user.total_intentos) * 100);
        }

        // Título basado en Nivel (Cosmético)
        let titulo = "Estudiante Novato";
        if (user.nivel >= 3) titulo = "Estudiante de Física";
        if (user.nivel >= 5) titulo = "Maestro de las Leyes";
        if (user.nivel >= 10) titulo = "El Nuevo Einstein";

        // Meta de XP para el siguiente nivel (Ej: Nivel * 150)
        const xpMeta = user.nivel * 250; 

        // 3. Respuesta JSON formateada para tu diseño
        res.json({
            nombre: user.nombre,
            titulo: titulo,
            nivel: user.nivel,
            xp_actual: user.xp_actual,
            xp_meta: xpMeta,
            xp_total: user.xp_actual + (user.nivel * 1000), // Simulación de XP histórica
            vidas: user.vidas,
            stats: {
                racha: user.racha,
                lecciones_completadas: user.lecciones_completadas,
                precision: precision
            }
        });

    } catch (error) {
        console.error(error);
        res.status(500).json({ error: "Error al obtener perfil" });
    }
};

// --- NUEVO: OBTENER LOGROS ---
exports.obtenerLogros = async (req, res) => {
    try {
        const userId = req.usuario.id;

        // Consulta Magica: Trae todos los logros y marca cuáles tiene el usuario
        // Usamos LEFT JOIN para ver si existe en 'usuario_logros'
        const [logros] = await db.query(`
            SELECT 
                l.id, 
                l.titulo, 
                l.descripcion, 
                l.icono,
                CASE WHEN ul.fecha_obtencion IS NOT NULL THEN true ELSE false END AS desbloqueado
            FROM logros l
            LEFT JOIN usuario_logros ul ON l.id = ul.logro_id AND ul.user_id = ?
        `, [userId]);

        res.json(logros);

    } catch (error) {
        console.error(error);
        res.status(500).json({ error: "Error al obtener logros" });
    }
};