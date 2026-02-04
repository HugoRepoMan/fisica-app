const db = require('../config/database');

exports.completarLeccion = async (req, res) => {
    try {
        const { puntaje, total_preguntas } = req.body;
        const userId = req.userId; // Del middleware auth
        
        console.log(`📚 Usuario ${userId} completando lección`);
        console.log(`Puntaje: ${puntaje}/${total_preguntas}`);
        
        // 1. Obtener datos actuales del usuario
        const [usuarios] = await db.query(
            'SELECT xp, nivel, energia FROM usuarios WHERE id = ?',
            [userId]
        );
        
        if (usuarios.length === 0) {
            return res.status(404).json({ error: "Usuario no encontrado" });
        }
        
        const usuario = usuarios[0];
        
        // 2. Calcular XP ganada (10-50 XP según puntaje)
        const porcentajeAciertos = (puntaje / total_preguntas) * 100;
        let xpGanada = 0;
        
        if (porcentajeAciertos >= 90) xpGanada = 50;
        else if (porcentajeAciertos >= 70) xpGanada = 40;
        else if (porcentajeAciertos >= 50) xpGanada = 30;
        else xpGanada = 20;
        
        const nuevoXP = usuario.xp + xpGanada;
        
        // 3. Calcular nuevo nivel
        const xpPorNivel = 200;
        const nuevoNivel = Math.floor(nuevoXP / xpPorNivel) + 1;
        const subioNivel = nuevoNivel > usuario.nivel;
        
        // 4. Restar energía
        const nuevaEnergia = Math.max(usuario.energia - 2, 0);
        
        // 5. ACTUALIZAR TODO EN LA BASE DE DATOS
        await db.query(`
            UPDATE usuarios 
            SET xp = ?,
                nivel = ?,
                energia = ?,
                lecciones_completadas = lecciones_completadas + 1,
                ultima_leccion_completada = NOW()
            WHERE id = ?
        `, [nuevoXP, nuevoNivel, nuevaEnergia, userId]);
        
        console.log(`✅ Usuario ${userId} actualizó lecciones_completadas`);
        
        // 6. Responder
        res.json({
            msg: "¡Lección completada!",
            resumen: {
                xp_ganada: xpGanada,
                nuevo_total_xp: nuevoXP,
                nueva_energia: nuevaEnergia,
                subio_nivel: subioNivel,
                nuevo_nivel: nuevoNivel
            }
        });
        
    } catch (error) {
        console.error("❌ Error al completar lección:", error);
        res.status(500).json({ error: "Error al completar lección" });
    }
};

exports.fallarPregunta = async (req, res) => {
    try {
        const userId = req.userId;
        
        // Restar una vida
        await db.query(`
            UPDATE usuarios 
            SET vidas = GREATEST(vidas - 1, 0)
            WHERE id = ?
        `, [userId]);
        
        console.log(`💔 Usuario ${userId} perdió una vida`);
        
        res.json({ msg: "Vida restada" });
        
    } catch (error) {
        console.error("❌ Error al restar vida:", error);
        res.status(500).json({ error: "Error al restar vida" });
    }
};
// --- AUXILIAR: Función para dar logro sin repetir ---
async function otorgarLogro(userId, logroId, listaLogros) {
    // 1. Verificar si ya lo tiene
    const [existe] = await db.query('SELECT * FROM usuario_logros WHERE user_id = ? AND logro_id = ?', [userId, logroId]);
    
    if (existe.length === 0) {
        // 2. Si no lo tiene, se lo damos
        await db.query('INSERT INTO usuario_logros (user_id, logro_id) VALUES (?, ?)', [userId, logroId]);
        
        // 3. Obtenemos el nombre para avisarle al usuario
        const [info] = await db.query('SELECT titulo FROM logros WHERE id = ?', [logroId]);
        listaLogros.push(info[0].titulo);
    }
}