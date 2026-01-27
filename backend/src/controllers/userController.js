// src/controllers/userController.js
const db = require('../config/db'); // <--- Importamos como 'db'

exports.obtenerPerfil = async (req, res) => {
    try {
        const userId = req.usuario.id;
        
        // 1. CORREGIDO: Usamos 'db' en lugar de 'pool'
        const [rows] = await db.query(
            `SELECT id, nombre, email, nivel, xp_actual, vidas, energia, racha, ultima_regeneracion 
             FROM usuarios WHERE id = ?`,
            [userId]
        );

        if (rows.length === 0) return res.status(404).json({ msg: "Usuario no encontrado" });

        let usuario = rows[0];

        // --- LÓGICA DE REGENERACIÓN TIPO DUOLINGO ---
        const MAX_VIDAS = 5;
        const TIEMPO_REGENERACION_MS = 30 * 60 * 1000; // 30 minutos
        
        // Validamos que 'vidas' no sea null (por si es un usuario antiguo)
        const vidasActuales = usuario.vidas !== null ? usuario.vidas : 5;

        if (vidasActuales < MAX_VIDAS) {
            const ahora = new Date();
            // Si ultima_regeneracion es null, usamos 'ahora'
            const ultimaVez = new Date(usuario.ultima_regeneracion || ahora);
            const tiempoPasado = ahora - ultimaVez; 

            if (tiempoPasado >= TIEMPO_REGENERACION_MS) {
                const vidasRecuperadas = Math.floor(tiempoPasado / TIEMPO_REGENERACION_MS);
                const nuevasVidas = Math.min(vidasActuales + vidasRecuperadas, MAX_VIDAS);
                
                if (nuevasVidas > vidasActuales) {
                    const tiempoSobrante = tiempoPasado % TIEMPO_REGENERACION_MS;
                    const nuevaFechaRegeneracion = new Date(ahora - tiempoSobrante); 

                    // 2. CORREGIDO: Usamos 'db' aquí también
                    await db.query(
                        "UPDATE usuarios SET vidas = ?, ultima_regeneracion = ? WHERE id = ?",
                        [nuevasVidas, nuevaFechaRegeneracion, userId]
                    );
                    
                    usuario.vidas = nuevasVidas;
                    usuario.ultima_regeneracion = nuevaFechaRegeneracion;
                }
            }
        }
        // --------------------------------------------

        // Enviamos la respuesta limpia y segura
        res.json({
            nombre: usuario.nombre,
            nivel: usuario.nivel || 1,
            xp: usuario.xp_actual || 0,
            vidas: usuario.vidas !== null ? usuario.vidas : 5,
            energia: usuario.energia !== null ? usuario.energia : 5,
            racha: usuario.racha || 0
        });

    } catch (error) {
        console.error("Error en perfil:", error);
        res.status(500).send("Error en el servidor");
    }
};

// --- OBTENER LOGROS ---
exports.obtenerLogros = async (req, res) => {
    try {
        const userId = req.usuario.id;

        // Aquí ya estabas usando 'db' correctamente, así que esto funcionará bien
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