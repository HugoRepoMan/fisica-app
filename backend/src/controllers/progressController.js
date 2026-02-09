// src/controllers/progressController.js
const db = require('../config/db');  // ← CORREGIDO (era '../config/database')
const { validateLessonCompletion } = require('../validators/inputValidators');

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
    // Validar y normalizar payload
    const validation = validateLessonCompletion(req.body || {});
    if (!validation.valid) {
        return res.status(400).json({ error: 'Payload inválido', details: validation.errors });
    }

    const parsed = validation.parsed;
    const puntaje = parsed.puntaje;
    const total_preguntas = parsed.total_preguntas;
    const moduloId = parsed.moduloId;
    const xp = parsed.xp;
    const ultimaLeccionCliente = parsed.ultima_leccion_fecha;
    const energiaCliente = parsed.energia;
    const energia_costo = parsed.energia_costo;
    // racha del cliente se puede leer pero no se confía ciegamente
    const rachaCliente = req.body && req.body.racha;

    try {
        // ---------- A. OBTENER DATOS ACTUALES DEL USUARIO ----------
        const [rows] = await db.query('SELECT xp_actual, nivel, lecciones_completadas, energia, racha, fecha_ultima_leccion FROM usuarios WHERE id = ?', [userId]);
        if (rows.length === 0) return res.status(404).json({ error: 'Usuario no encontrado' });
        const user = rows[0];

        // ---------- B. ENERGÍA: sincronizar o descontar ----------
        let nuevaEnergia;
        if (energiaCliente !== undefined && energiaCliente !== null) {
            const eNum = Number(energiaCliente);
            nuevaEnergia = isNaN(eNum) ? user.energia : Math.max(0, Math.floor(eNum));
        } else {
            const costo = energia_costo !== undefined ? Number(energia_costo) : 1;
            const costoVal = isNaN(costo) ? 1 : Math.max(0, Math.floor(costo));
            nuevaEnergia = Math.max(0, (user.energia || 0) - costoVal);
        }

        // ---------- C. XP: usar valor del frontend o calcular en servidor ----------
        let xpGanada;
        if (xp !== undefined && xp !== null) {
            const xpNum = Number(xp);
            if (!isNaN(xpNum) && xpNum >= 0) xpGanada = Math.round(xpNum);
        }

        if (xpGanada === undefined) {
            const XP_BASE = 20;
            const bono = (total_preguntas ? Math.round((puntaje / total_preguntas) * 10) : 0);
            xpGanada = XP_BASE + bono;
        }

        // ---------- D. VALIDAR XP según modulo (para evitar fraude) ----------
        if (moduloId) {
            try {
                const [mods] = await db.query('SELECT xp FROM modulos WHERE id = ?', [moduloId]);
                if (mods && mods.length > 0) {
                    const baseXp = Number(mods[0].xp) || 0;
                    const maxAllowed = Math.max(baseXp * 3, baseXp + 50); // tolerancia razonable
                    if (xpGanada > maxAllowed) {
                        console.warn(`XP enviado excesivo por user ${userId}: ${xpGanada} > ${maxAllowed} (modulo ${moduloId}). Se ajusta.`);
                        xpGanada = maxAllowed;
                    }
                }
            } catch (err) {
                console.error('Error validando módulo XP', err);
            }
        }

        // ---------- E. ACTUALIZAR ESTADÍSTICAS (XP, lecciones, aciertos/intentos, energia) ----------
        await db.query(`
            UPDATE usuarios
            SET xp_actual = xp_actual + ?,
                lecciones_completadas = lecciones_completadas + 1,
                total_aciertos = total_aciertos + ?,
                total_intentos = total_intentos + ?,
                energia = ?
            WHERE id = ?
        `, [xpGanada, puntaje || 0, total_preguntas || 0, nuevaEnergia, userId]);

        // Reobtener usuario actualizado para valores consistentes
        const [updatedRows] = await db.query('SELECT xp_actual, nivel, lecciones_completadas, energia, racha, fecha_ultima_leccion FROM usuarios WHERE id = ?', [userId]);
        const updatedUser = updatedRows[0];

        // ---------- F. NIVEL: recalcular con nuevo XP ----------
        const nuevoTotalXp = Number(updatedUser.xp_actual) || 0;
        const nivelCalculado = Math.floor(nuevoTotalXp / 200) + 1;
        let nuevoNivel = updatedUser.nivel;
        if (nivelCalculado > updatedUser.nivel) {
            nuevoNivel = nivelCalculado;
            await db.query('UPDATE usuarios SET nivel = ? WHERE id = ?', [nuevoNivel, userId]);
        }

        // ---------- G. RACHA: recalcular de forma segura (no confiar ciegamente en cliente) ----------
        const hoy = new Date();
        const fechaHoyStr = hoy.toISOString().split('T')[0]; // YYYY-MM-DD

        // Determinar la última fecha registrada (DB) y la fecha enviada por cliente (opcional)
        const fechaUltimaDbStr = updatedUser.fecha_ultima_leccion ? new Date(updatedUser.fecha_ultima_leccion).toISOString().split('T')[0] : null;
        let fechaReferenciaStr = fechaUltimaDbStr;

        if (ultimaLeccionCliente) {
            const cDate = new Date(ultimaLeccionCliente);
            if (!isNaN(cDate)) {
                const cStr = cDate.toISOString().split('T')[0];
                // No aceptar fechas futuras
                if (cStr <= fechaHoyStr) {
                    // Si cliente reporta una fecha más reciente que DB, la consideramos como referencia
                    if (!fechaReferenciaStr || cStr > fechaReferenciaStr) fechaReferenciaStr = cStr;
                }
            }
        }

        let nuevaRacha = updatedUser.racha || 0;

        if (!fechaReferenciaStr) {
            // No hay registro previo -> inicio de racha
            nuevaRacha = 1;
        } else if (fechaReferenciaStr === fechaHoyStr) {
            // Ya completó hoy antes de esta petición
            nuevaRacha = updatedUser.racha || 1;
        } else {
            const fechaReferencia = new Date(fechaReferenciaStr);
            const diferenciaMs = (new Date(fechaHoyStr) - fechaReferencia);
            const diferenciaDias = Math.floor(diferenciaMs / (1000 * 60 * 60 * 24));

            if (diferenciaDias === 1) {
                nuevaRacha = (updatedUser.racha || 0) + 1;
            } else if (diferenciaDias > 1) {
                nuevaRacha = 1;
            } else {
                // diferenciaDias <= 0 fuera de los casos anteriores
                nuevaRacha = updatedUser.racha || 1;
            }
        }

        // Fecha a guardar: preferir la fecha cliente si es válida y <= hoy, sino usar hoy
        let fechaParaGuardar = fechaHoyStr;
        if (ultimaLeccionCliente) {
            const cDate2 = new Date(ultimaLeccionCliente);
            if (!isNaN(cDate2)) {
                const cStr2 = cDate2.toISOString().split('T')[0];
                if (cStr2 <= fechaHoyStr) fechaParaGuardar = cStr2;
            }
        }

        await db.query('UPDATE usuarios SET racha = ?, fecha_ultima_leccion = ? WHERE id = ?', [nuevaRacha, fechaParaGuardar, userId]);

        // ---------- H. RESPUESTA - devolver resumen con claves solicitadas ----------
        res.json({
            resumen: {
                nuevo_total_xp: nuevoTotalXp,
                nueva_energia: Number(nuevaEnergia),
                nuevo_nivel: nuevoNivel,
                lecciones_completadas: Number(updatedUser.lecciones_completadas || 0),
                nueva_racha: nuevaRacha
            }
        });

        // (Lógica antigua removida — usamos la nueva respuesta arriba)

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