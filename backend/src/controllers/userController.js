const db = require('../config/db');

exports.obtenerPerfil = async (req, res) => {
    console.log("--> 👤 Obteniendo perfil para ID:", req.usuario.id);

    try {
        const userId = req.usuario.id;

        // 1. OBTENER DATOS DE LA BD
        const [rows] = await db.query(
            `SELECT id, nombre, email, nivel, xp_actual, vidas, energia, racha, ultima_regeneracion 
             FROM usuarios WHERE id = ?`,
            [userId]
        );

        if (rows.length === 0) {
            return res.status(404).json({ msg: "Usuario no encontrado" });
        }

        let usuario = rows[0];

        // 2. LÓGICA DE REGENERACIÓN DE VIDAS
        const MAX_VIDAS = 5;
        const TIEMPO_REGENERACION_MS = 30 * 60 * 1000; // 30 minutos
        
        let vidasActuales = usuario.vidas !== null ? usuario.vidas : 5;
        let huboCambios = false;

        if (vidasActuales < MAX_VIDAS) {
            const ahora = new Date();
            const ultimaVez = usuario.ultima_regeneracion ? new Date(usuario.ultima_regeneracion) : new Date();
            
            const tiempoPasado = ahora - ultimaVez;

            if (tiempoPasado >= TIEMPO_REGENERACION_MS) {
                const vidasRecuperadas = Math.floor(tiempoPasado / TIEMPO_REGENERACION_MS);
                const nuevasVidas = Math.min(vidasActuales + vidasRecuperadas, MAX_VIDAS);
                
                if (nuevasVidas > vidasActuales) {
                    const tiempoSobrante = tiempoPasado % TIEMPO_REGENERACION_MS;
                    const nuevaFechaRegeneracion = new Date(ahora - tiempoSobrante); 

                    await db.query(
                        "UPDATE usuarios SET vidas = ?, ultima_regeneracion = ? WHERE id = ?",
                        [nuevasVidas, nuevaFechaRegeneracion, userId]
                    );
                    
                    usuario.vidas = nuevasVidas;
                    usuario.ultima_regeneracion = nuevaFechaRegeneracion;
                    huboCambios = true;
                    console.log(`--> 💚 Vidas regeneradas: De ${vidasActuales} a ${nuevasVidas}`);
                }
            }
        }

        // 3. OBTENER LOGROS DEL USUARIO (CRÍTICO - ESTABA FALTANDO)
        const [logrosData] = await db.query(
            'SELECT logro_id FROM usuario_logros WHERE user_id = ?',
            [userId]
        );
        const arrayLogros = logrosData.map(item => item.logro_id);

        // 4. RESPUESTA AL FRONTEND
        const respuesta = {
            id: usuario.id,
            nombre: usuario.nombre,
            email: usuario.email,
            nivel: usuario.nivel || 1,
            xp: usuario.xp_actual || 0,
            vidas: usuario.vidas,
            energia: usuario.energia || 0,
            racha: usuario.racha || 0,
            logros: arrayLogros  // ✅ AHORA SÍ ESTÁ INCLUIDO
        };

        res.json(respuesta);

    } catch (error) {
        console.error("ERROR CRÍTICO EN PERFIL:", error);
        res.status(500).json({ error: "Error interno del servidor" });
    }
};

exports.obtenerLogros = async (req, res) => {
    try {
        const userId = req.usuario.id;

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