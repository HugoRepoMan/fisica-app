const db = require('../config/db');

exports.obtenerPerfil = async (req, res) => {
    try {
        // 1. Obtener usuario con su timestamp
        const [users] = await db.query('SELECT id, nombre, email, nivel, xp_actual, vidas, ultima_regeneracion FROM usuarios WHERE id = ?', [req.usuario.id]);
        let user = users[0];

        // --- ⏳ LÓGICA DE REGENERACIÓN ---
        if (user.vidas < 5) {
            const TIEMPO_RECARGA_MINUTOS = 30; // Cada 30 minutos recupera una
            
            const ahora = new Date();
            const ultimaVez = new Date(user.ultima_regeneracion);
            
            // Calculamos la diferencia en minutos
            const diferenciaMilisegundos = ahora - ultimaVez;
            const minutosPasados = Math.floor(diferenciaMilisegundos / (1000 * 60));

            if (minutosPasados >= TIEMPO_RECARGA_MINUTOS) {
                // Calculamos cuántas vidas recuperó (ej: pasaron 60 mins -> recupera 2)
                const vidasRecuperadas = Math.floor(minutosPasados / TIEMPO_RECARGA_MINUTOS);
                
                // Sumamos, pero sin pasar de 5
                const nuevasVidas = Math.min(5, user.vidas + vidasRecuperadas);

                // Si hubo cambios, actualizamos la BD
                if (nuevasVidas > user.vidas) {
                    await db.query(`
                        UPDATE usuarios 
                        SET vidas = ?, ultima_regeneracion = NOW() 
                        WHERE id = ?
                    `, [nuevasVidas, user.id]);

                    // Actualizamos el objeto 'user' local para que la respuesta JSON salga actualizada
                    user.vidas = nuevasVidas;
                }
            }
        }
        // --- FIN LÓGICA REGENERACIÓN ---

        res.json(user);

    } catch (error) {
        console.error(error);
        res.status(500).json({ error: "Error al obtener perfil" });
    }
};