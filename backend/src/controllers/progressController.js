const db = require('../config/db');

// --- FUNCIÓN 1: COMPLETAR LECCIÓN ---
exports.completarLeccion = async (req, res) => {
    const { modulo_id, estrellas_obtenidas } = req.body; 
    const userId = req.usuario.id;

    try {
        const [modulos] = await db.query('SELECT xp_recompensa FROM modulos WHERE id = ?', [modulo_id]);
        
        if (modulos.length === 0) {
            return res.status(404).json({ msg: "Módulo no encontrado" });
        }
        
        const xpGanados = modulos[0].xp_recompensa || 50; 

        // GUARDAR PROGRESO
        await db.query(`
            INSERT INTO progreso_usuario (user_id, modulo_id, completado, estrellas)
            VALUES (?, ?, true, ?)
            ON DUPLICATE KEY UPDATE estrellas = GREATEST(estrellas, VALUES(estrellas))
        `, [userId, modulo_id, estrellas_obtenidas]);

        // ACTUALIZAR AL USUARIO
        await db.query(`
            UPDATE usuarios 
            SET xp_actual = xp_actual + ?,
                ultima_conexion = CURRENT_DATE
            WHERE id = ?
        `, [xpGanados, userId]);

        // VERIFICAR LEVEL UP
        const [userStats] = await db.query('SELECT xp_actual, xp_meta, nivel FROM usuarios WHERE id = ?', [userId]);
        let subioNivel = false;
        let nuevoNivel = userStats[0].nivel;

        if (userStats[0].xp_actual >= userStats[0].xp_meta) {
            subioNivel = true;
            nuevoNivel += 1;
            await db.query('UPDATE usuarios SET nivel = ?, xp_meta = xp_meta * 1.5 WHERE id = ?', [nuevoNivel, userId]);
        }

        res.json({
            mensaje: "¡Lección completada!",
            xp_ganados: xpGanados,
            estrellas: estrellas_obtenidas,
            nuevo_total_xp: userStats[0].xp_actual,
            subio_nivel: subioNivel,
            nivel_actual: nuevoNivel
        });

    } catch (error) {
        console.error(error);
        res.status(500).json({ error: "Error al guardar progreso" });
    }
}; 

// --- FUNCIÓN 2: RESTAR VIDA (AHORA ESTÁ AFUERA) ---
exports.restarVida = async (req, res) => {
    const userId = req.usuario.id;

    try {
        // 1. Consultar vidas actuales
        const [user] = await db.query('SELECT vidas FROM usuarios WHERE id = ?', [userId]);
        
        let vidasActuales = user[0].vidas;
        
        // Protección por si es null
        if (vidasActuales === null || vidasActuales === undefined) vidasActuales = 5;

        if (vidasActuales <= 0) {
            return res.status(403).json({ 
                msg: "¡No tienes vidas! 💀 Espera a que se recarguen o compra más.",
                vidas: 0
            });
        }

        // 2. Restar una vida
        await db.query('UPDATE usuarios SET vidas = vidas - 1 WHERE id = ?', [userId]);

        res.json({ 
            msg: "Respuesta incorrecta. Perdiste un corazón 💔", 
            vidas: vidasActuales - 1 
        });

    } catch (error) {
        console.error(error);
        res.status(500).json({ error: "Error al restar vida" });
    }
}; // <--- FIN DEL ARCHIVO