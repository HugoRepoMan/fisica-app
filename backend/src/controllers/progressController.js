// src/controllers/progressController.js
const db = require('../config/db');
const { validateLessonCompletion } = require('../validators/inputValidators');

// Intentar agregar la columna fecha_ultima_leccion si no existe
(async () => {
    try {
        await db.query(`ALTER TABLE usuarios ADD COLUMN fecha_ultima_leccion DATE DEFAULT NULL`);
        console.log('✅ Columna fecha_ultima_leccion creada exitosamente');
    } catch (err) {
        if (err.code === 'ER_DUP_FIELDNAME' || err.errno === 1060) {
            console.log('ℹ️ Columna fecha_ultima_leccion ya existe');
        } else {
            console.warn('⚠️ No se pudo crear columna fecha_ultima_leccion:', err.message);
        }
    }
})();

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

    try {
        // ---------- A. OBTENER DATOS ACTUALES DEL USUARIO ----------
        // Usar query segura que no falla si la columna fecha_ultima_leccion no existe
        let user;
        try {
            const [rows] = await db.query('SELECT xp_actual, nivel, lecciones_completadas, energia, racha, fecha_ultima_leccion FROM usuarios WHERE id = ?', [userId]);
            if (rows.length === 0) return res.status(404).json({ error: 'Usuario no encontrado' });
            user = rows[0];
        } catch (colErr) {
            if (colErr.code === 'ER_BAD_FIELD_ERROR') {
                // La columna no existe, consultar sin ella
                console.warn('⚠️ Columna fecha_ultima_leccion no existe, consultando sin ella');
                const [rows] = await db.query('SELECT xp_actual, nivel, lecciones_completadas, energia, racha FROM usuarios WHERE id = ?', [userId]);
                if (rows.length === 0) return res.status(404).json({ error: 'Usuario no encontrado' });
                user = rows[0];
                user.fecha_ultima_leccion = null;
            } else {
                throw colErr;
            }
        }

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
                    const maxAllowed = Math.max(baseXp * 3, baseXp + 50);
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

        // Reobtener usuario actualizado
        let updatedUser;
        try {
            const [updatedRows] = await db.query('SELECT xp_actual, nivel, lecciones_completadas, energia, racha, fecha_ultima_leccion FROM usuarios WHERE id = ?', [userId]);
            updatedUser = updatedRows[0];
        } catch (colErr) {
            if (colErr.code === 'ER_BAD_FIELD_ERROR') {
                const [updatedRows] = await db.query('SELECT xp_actual, nivel, lecciones_completadas, energia, racha FROM usuarios WHERE id = ?', [userId]);
                updatedUser = updatedRows[0];
                updatedUser.fecha_ultima_leccion = null;
            } else {
                throw colErr;
            }
        }

        // ---------- F. NIVEL: recalcular con nuevo XP (100 XP por nivel) ----------
        const nuevoTotalXp = Number(updatedUser.xp_actual) || 0;
        const XP_POR_NIVEL = 100;
        const nivelCalculado = Math.floor(nuevoTotalXp / XP_POR_NIVEL) + 1;
        let nuevoNivel = updatedUser.nivel;
        let subioNivel = false;
        if (nivelCalculado > updatedUser.nivel) {
            nuevoNivel = nivelCalculado;
            subioNivel = true;
            await db.query('UPDATE usuarios SET nivel = ? WHERE id = ?', [nuevoNivel, userId]);
        }

        // ---------- G. RACHA: recalcular ----------
        const hoy = new Date();
        const fechaHoyStr = hoy.toISOString().split('T')[0];

        const fechaUltimaDbStr = updatedUser.fecha_ultima_leccion ? new Date(updatedUser.fecha_ultima_leccion).toISOString().split('T')[0] : null;
        let fechaReferenciaStr = fechaUltimaDbStr;

        if (ultimaLeccionCliente) {
            const cDate = new Date(ultimaLeccionCliente);
            if (!isNaN(cDate)) {
                const cStr = cDate.toISOString().split('T')[0];
                if (cStr <= fechaHoyStr) {
                    if (!fechaReferenciaStr || cStr > fechaReferenciaStr) fechaReferenciaStr = cStr;
                }
            }
        }

        let nuevaRacha = updatedUser.racha || 0;

        if (!fechaReferenciaStr) {
            nuevaRacha = 1;
        } else if (fechaReferenciaStr === fechaHoyStr) {
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
                nuevaRacha = updatedUser.racha || 1;
            }
        }

        let fechaParaGuardar = fechaHoyStr;
        if (ultimaLeccionCliente) {
            const cDate2 = new Date(ultimaLeccionCliente);
            if (!isNaN(cDate2)) {
                const cStr2 = cDate2.toISOString().split('T')[0];
                if (cStr2 <= fechaHoyStr) fechaParaGuardar = cStr2;
            }
        }

        // Actualizar racha y fecha - con fallback si la columna no existe
        try {
            await db.query('UPDATE usuarios SET racha = ?, fecha_ultima_leccion = ? WHERE id = ?', [nuevaRacha, fechaParaGuardar, userId]);
        } catch (colErr) {
            if (colErr.code === 'ER_BAD_FIELD_ERROR') {
                console.warn('⚠️ Columna fecha_ultima_leccion no existe, actualizando solo racha');
                await db.query('UPDATE usuarios SET racha = ? WHERE id = ?', [nuevaRacha, userId]);
            } else {
                throw colErr;
            }
        }

        // ---------- H. RESPUESTA ----------
        res.json({
            msg: "¡Lección completada!",
            resumen: {
                xp_ganada: xpGanada,
                nuevo_total_xp: nuevoTotalXp,
                nueva_energia: Number(nuevaEnergia),
                subio_nivel: subioNivel,
                nuevo_nivel: nuevoNivel,
                lecciones_completadas: Number(updatedUser.lecciones_completadas || 0),
                nueva_racha: nuevaRacha
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