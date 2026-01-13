// src/controllers/contentController.js
const db = require('../config/db');

// OBTENER LA RUTA DE APRENDIZAJE (CON ESTADOS CALCULADOS)
exports.obtenerRuta = async (req, res) => {
    try {
        const userId = req.usuario.id; // Del token

        // 1. Pedimos todos los módulos ordenados
        const [modulos] = await db.query('SELECT * FROM modulos ORDER BY orden ASC');
        
        // 2. Pedimos qué ha completado este usuario
        const [progreso] = await db.query('SELECT modulo_id FROM progreso_usuario WHERE user_id = ? AND completado = true', [userId]);
        
        // Convertimos el progreso en una lista simple de IDs (ej: [1, 2])
        const idsCompletados = progreso.map(p => p.modulo_id);

        // 3. LOGICA DE CANDADOS 🔒
        const rutaConEstado = modulos.map((modulo, index) => {
            let estado = "bloqueado"; // Por defecto todo cerrado

            // Si el usuario ya lo completó -> "completado"
            if (idsCompletados.includes(modulo.id)) {
                estado = "completado";
            } 
            // Si el ANTERIOR está completado (o es el primero) -> "desbloqueado"
            else {
                const moduloAnterior = modulos[index - 1];
                // Si es el primero (índice 0) siempre está abierto
                if (index === 0) {
                    estado = "desbloqueado";
                }
                // Si el anterior ya se hizo, este es el siguiente paso
                else if (idsCompletados.includes(moduloAnterior.id)) {
                    estado = "desbloqueado";
                }
            }

            return {
                ...modulo,
                estado: estado 
            };
        });

        res.json(rutaConEstado);

    } catch (error) {
        console.error(error);
        res.status(500).json({ error: "Error al cargar la ruta" });
    }
};

// OBTENER DETALLE DE UNA LECCIÓN
exports.obtenerLeccion = async (req, res) => {
    try {
        const { id_modulo } = req.params;
        const [lecciones] = await db.query('SELECT * FROM lecciones WHERE modulo_id = ?', [id_modulo]);
        res.json(lecciones);
    } catch (error) {
        res.status(500).json({ error: "Error al obtener lección" });
    }
};