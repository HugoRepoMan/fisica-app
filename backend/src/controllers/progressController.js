// src/controllers/progressController.js
const db = require('../config/db');  // ← CORREGIDO (era '../config/database')

exports.restarVida = async (req, res) => {
    const userId = req.usuario.id;
    try {
        const [users] = await db.query('SELECT vidas FROM usuarios WHERE id = ?', [userId]);
        let vidas = users[0].vidas;

        if (vidas <= 0) return res.status(403).json({ msg: "Sin vidas", vidas: 0 });

        if (vidas === 5) {
            await db.query('UPDATE usuarios SET ultima_regeneracion = NOW() WHERE id = ?', [userId]);
        }

        await db.query('UPDATE usuarios SET vidas = vidas - 1 WHERE id = ?', [userId]);
        res.json({ msg: "Perdiste un corazón 💔", vidas: vidas - 1 });
    } catch (error) { 
        res.status(500).json({ error: "Error al restar vida" }); 
    }
};

exports.completarLeccion = async (req, res) => {
    const userId = req.usuario.id;
    const { puntaje, total_preguntas, xp } = req.body; 

    try {
        // A. CÁLCULOS (si el frontend envía `xp` lo usamos; si no, lo calculamos aquí)
        let xpGanada;
        if (xp !== undefined && xp !== null) {
            const xpNum = Number(xp);
            if (!isNaN(xpNum) && xpNum >= 0) {
                xpGanada = Math.round(xpNum);
            }
        }

        if (xpGanada === undefined) {
            const XP_BASE = 20;
            const bono = Math.round((puntaje / total_preguntas) * 10);
            xpGanada = XP_BASE + bono;
        }

        // B. ACTUALIZAR ESTADÍSTICAS + COBRAR ENERGÍA
        await db.query(`
            UPDATE usuarios 
            SET xp_actual = xp_actual + ?,
                lecciones_completadas = lecciones_completadas + 1,
                total_aciertos = total_aciertos + ?,
                total_intentos = total_intentos + ?,
                energia = GREATEST(0, energia - 2) 
            WHERE id = ?
        `, [xpGanada, puntaje, total_preguntas, userId]);

        // C. REVISAR NIVEL (LEVEL UP)
        const [users] = await db.query('SELECT xp_actual, nivel, lecciones_completadas, energia FROM usuarios WHERE id = ?', [userId]);
        const user = users[0];
        
        let nuevoNivel = user.nivel;
        const nivelCalculado = Math.floor(user.xp_actual / 200) + 1;
        let subioNivel = false;

        if (nivelCalculado > user.nivel) {
            nuevoNivel = nivelCalculado;
            subioNivel = true;
            await db.query('UPDATE usuarios SET nivel = ? WHERE id = ?', [nuevoNivel, userId]);
        }

        // D. LOGROS (tu código aquí si lo tienes)

        // E. RESPUESTA
        res.json({
            msg: "¡Lección completada!",
            resumen: {
                xp_ganada: xpGanada,
                nuevo_total_xp: user.xp_actual,
                nueva_energia: user.energia,
                subio_nivel: subioNivel,
                nuevo_nivel: nuevoNivel,
                lecciones_completadas: user.lecciones_completadas  // ← AGREGADO
            }
        });

    } catch (error) {
        console.error(error);
        res.status(500).json({ error: "Error al completar lección" });
    }
};

// Función auxiliar para logros
async function otorgarLogro(userId, logroId, listaLogros) {
    const [existe] = await db.query('SELECT * FROM usuario_logros WHERE user_id = ? AND logro_id = ?', [userId, logroId]);
    
    if (existe.length === 0) {
        await db.query('INSERT INTO usuario_logros (user_id, logro_id) VALUES (?, ?)', [userId, logroId]);
        const [info] = await db.query('SELECT titulo FROM logros WHERE id = ?', [logroId]);
        listaLogros.push(info[0].titulo);
    }
}