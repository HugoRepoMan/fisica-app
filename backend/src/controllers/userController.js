const db = require('../config/db');

exports.obtenerPerfil = async (req, res) => {
    // LOG DE DEPURACIÓN (Para ver en Render si entra)
    console.log("--> 👤 Obteniendo perfil para ID:", req.usuario.id);

    try {
        const userId = req.usuario.id;

        // 1. OBTENER DATOS DE LA BD
        // Traemos todo lo necesario para pintar la pantalla principal
        const [rows] = await db.query(
            `SELECT id, nombre, email, nivel, xp_actual, vidas, energia, racha, ultima_regeneracion 
             FROM usuarios WHERE id = ?`,
            [userId]
        );

        if (rows.length === 0) {
            return res.status(404).json({ msg: "Usuario no encontrado" });
        }

        let usuario = rows[0];

        // --- 2. LÓGICA DE REGENERACIÓN DE VIDAS (El Reloj ⏰) ---
        // Esto ocurre "pasivamente" solo con consultar el perfil
        const MAX_VIDAS = 5;
        const TIEMPO_REGENERACION_MS = 30 * 60 * 1000; // 30 minutos
        
        // Protección contra nulos (si es usuario viejo)
        let vidasActuales = usuario.vidas !== null ? usuario.vidas : 5;
        let huboCambios = false;

        if (vidasActuales < MAX_VIDAS) {
            const ahora = new Date();
            // Si no tiene fecha registrada, asumimos que fue "ahora" para no romper el cálculo
            const ultimaVez = usuario.ultima_regeneracion ? new Date(usuario.ultima_regeneracion) : new Date();
            
            const tiempoPasado = ahora - ultimaVez; // Milisegundos pasados

            if (tiempoPasado >= TIEMPO_REGENERACION_MS) {
                // Cuántas vidas caben en el tiempo que pasó
                const vidasRecuperadas = Math.floor(tiempoPasado / TIEMPO_REGENERACION_MS);
                
                // Sumamos sin pasarnos del máximo
                const nuevasVidas = Math.min(vidasActuales + vidasRecuperadas, MAX_VIDAS);
                
                if (nuevasVidas > vidasActuales) {
                    // CÁLCULO DE PRECISIÓN:
                    // No ponemos "ahora" como nueva fecha, sino que restamos el tiempo que "sobró"
                    // para que el contador de la siguiente vida no empiece de cero.
                    const tiempoSobrante = tiempoPasado % TIEMPO_REGENERACION_MS;
                    const nuevaFechaRegeneracion = new Date(ahora - tiempoSobrante); 

                    // Actualizamos la base de datos
                    await db.query(
                        "UPDATE usuarios SET vidas = ?, ultima_regeneracion = ? WHERE id = ?",
                        [nuevasVidas, nuevaFechaRegeneracion, userId]
                    );
                    
                    // Actualizamos el objeto en memoria para enviarlo al frontend
                    usuario.vidas = nuevasVidas;
                    usuario.ultima_regeneracion = nuevaFechaRegeneracion;
                    huboCambios = true;
                    console.log(`--> 💚 Vidas regeneradas: De ${vidasActuales} a ${nuevasVidas}`);
                }
            }
        }

        // --- 3. RESPUESTA AL FRONTEND ---
        // Enviamos un objeto limpio y seguro
        const respuesta = {
            id: usuario.id,
            nombre: usuario.nombre,
            email: usuario.email,
            nivel: usuario.nivel || 1,
            xp: usuario.xp_actual || 0,     // Compatible con tu front
            vidas: usuario.vidas,           // Ya actualizado
            energia: usuario.energia || 0,
            racha: usuario.racha || 0
        };

        res.json(respuesta);

    } catch (error) {
        console.error("ERROR CRÍTICO EN PERFIL:", error);
        res.status(500).json({ error: "Error interno del servidor" });
    }
};

// --- OBTENER LOGROS ---
exports.obtenerLogros = async (req, res) => {
    try {
        const userId = req.usuario.id;

        // Consulta inteligente: Trae todos los logros y marca cuáles tiene el usuario
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