// src/controllers/progressController.js
const db = require('../config/db');

// --- 1. RESTAR VIDA (Ya lo tenías, lo dejamos igual) ---
exports.restarVida = async (req, res) => {
    const userId = req.usuario.id;
    try {
        const [users] = await db.query('SELECT vidas FROM usuarios WHERE id = ?', [userId]);
        let vidas = users[0].vidas;

        if (vidas <= 0) return res.status(403).json({ msg: "Sin vidas", vidas: 0 });

        if (vidas === 5) { // Si estaba lleno, activamos el reloj de regeneración
            await db.query('UPDATE usuarios SET ultima_regeneracion = NOW() WHERE id = ?', [userId]);
        }

        await db.query('UPDATE usuarios SET vidas = vidas - 1 WHERE id = ?', [userId]);
        res.json({ msg: "Perdiste un corazón 💔", vidas: vidas - 1 });
    } catch (error) { res.status(500).json({ error: "Error al restar vida" }); }
};

exports.completarLeccion = async (req, res) => {
    const userId = req.usuario.id;
    const { puntaje, total_preguntas } = req.body; 

    try {
        // A. CÁLCULOS
        const XP_BASE = 20;
        const bono = Math.round((puntaje / total_preguntas) * 10);
        const xpGanada = XP_BASE + bono;
        
        // B. ACTUALIZAR ESTADÍSTICAS + COBRAR ENERGÍA ⚡
        // Agregamos: energia = GREATEST(0, energia - 2)
        // GREATEST(0, ...) evita que la energía sea negativa
        await db.query(`
            UPDATE usuarios 
            SET xp_actual = xp_actual + ?,
                lecciones_completadas = lecciones_completadas + 1,
                total_aciertos = total_aciertos + ?,
                total_intentos = total_intentos + ?,
                energia = GREATEST(0, energia - 2) 
            WHERE id = ?
        `, [xpGanada, puntaje, total_preguntas, userId]);

        // ... (El resto del código C, D y E sigue igual, no lo toques) ...
        
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

        // D. LOGROS (Igual que antes) ...

        // E. RESPUESTA
        res.json({
            msg: "¡Lección completada!",
            resumen: {
                xp_ganada: xpGanada,
                nuevo_total_xp: user.xp_actual,
                nueva_energia: user.energia, // Devolvemos la energía actual para que el front sepa
                subio_nivel: subioNivel,
                nuevo_nivel: nuevoNivel
            }
        });

    } catch (error) {
        console.error(error);
        res.status(500).json({ error: "Error al completar lección" });
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