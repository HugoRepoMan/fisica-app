const db = require('../config/db');

exports.completarLeccion = async (req, res) => {
    const { modulo_id, estrellas_obtenidas } = req.body; 
    const userId = req.usuario.id;

    try {
        const [modulos] = await db.query('SELECT xp_recompensa FROM modulos WHERE id = ?', [modulo_id]);
        
        if (modulos.length === 0) {
            return res.status(404).json({ msg: "Módulo no encontrado" });
        }
        
        const xpGanados = modulos[0].xp_recompensa || 50; 

        // 2. GUARDAR PROGRESO (Marcar como hecho y guardar estrellas)
        await db.query(`
            INSERT INTO progreso_usuario (user_id, modulo_id, completado, estrellas)
            VALUES (?, ?, true, ?)
            ON DUPLICATE KEY UPDATE estrellas = GREATEST(estrellas, VALUES(estrellas))
        `, [userId, modulo_id, estrellas_obtenidas]);

        // 3. ACTUALIZAR AL USUARIO (Darle su XP y sumar racha si es hoy)
        await db.query(`
            UPDATE usuarios 
            SET xp_actual = xp_actual + ?,
                ultima_conexion = CURRENT_DATE
            WHERE id = ?
        `, [xpGanados, userId]);

        // 4. VERIFICAR LEVEL UP (Subir de nivel si pasa la meta)
        // Nota: Esto es simplificado. En una app real recalcularías la meta.
        const [userStats] = await db.query('SELECT xp_actual, xp_meta, nivel FROM usuarios WHERE id = ?', [userId]);
        let subioNivel = false;
        let nuevoNivel = userStats[0].nivel;

        if (userStats[0].xp_actual >= userStats[0].xp_meta) {
            subioNivel = true;
            nuevoNivel += 1;
            // Actualizamos el nivel y ponemos una meta nueva (ej: meta anterior * 1.5)
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