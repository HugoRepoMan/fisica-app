// src/controllers/userController.js
const db = require('../config/db');

exports.obtenerPerfil = async (req, res) => {
    try {
        const userId = req.usuario.id;
        
        // 1. Obtenemos datos actuales
        const [rows] = await pool.query(
            `SELECT id, nombre, email, nivel, xp_actual, vidas, energia, racha, ultima_regeneracion 
             FROM usuarios WHERE id = ?`,
            [userId]
        );

        if (rows.length === 0) return res.status(404).json({ msg: "Usuario no encontrado" });

        let usuario = rows[0];

        // --- LÓGICA DE REGENERACIÓN TIPO DUOLINGO ---
        const MAX_VIDAS = 5;
        const TIEMPO_REGENERACION_MS = 30 * 60 * 1000; // 30 minutos en milisegundos
        
        // Si tiene menos de 5 vidas, calculamos si debe recuperar alguna
        if (usuario.vidas < MAX_VIDAS) {
            const ahora = new Date();
            const ultimaVez = new Date(usuario.ultima_regeneracion);
            const tiempoPasado = ahora - ultimaVez; // Diferencia en milisegundos

            if (tiempoPasado >= TIEMPO_REGENERACION_MS) {
                // Cuántas vidas recuperó en este tiempo
                const vidasRecuperadas = Math.floor(tiempoPasado / TIEMPO_REGENERACION_MS);
                
                // Calculamos nuevas vidas (sin pasarnos de 5)
                const nuevasVidas = Math.min(usuario.vidas + vidasRecuperadas, MAX_VIDAS);
                
                // Si hubo cambios, actualizamos la Base de Datos
                if (nuevasVidas > usuario.vidas) {
                    // Calculamos la "nueva" última regeneración (restamos el tiempo sobrante para ser precisos)
                    // Esto evita que pierda minutos si entra a los 35 min (recupera 1 vida y le sobran 5 min para la siguiente)
                    const tiempoSobrante = tiempoPasado % TIEMPO_REGENERACION_MS;
                    const nuevaFechaRegeneracion = new Date(ahora - tiempoSobrante); 

                    await pool.query(
                        "UPDATE usuarios SET vidas = ?, ultima_regeneracion = ? WHERE id = ?",
                        [nuevasVidas, nuevaFechaRegeneracion, userId]
                    );
                    
                    // Actualizamos el objeto usuario en memoria para enviarlo al frontend ya actualizado
                    usuario.vidas = nuevasVidas;
                    usuario.ultima_regeneracion = nuevaFechaRegeneracion;
                }
            }
        }
        // --------------------------------------------

        res.json(usuario);

    } catch (error) {
        console.error("Error en perfil:", error);
        res.status(500).send("Error en el servidor");
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