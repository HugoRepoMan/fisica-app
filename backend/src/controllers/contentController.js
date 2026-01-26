const db = require('../config/db');

exports.obtenerRuta = async (req, res) => {
    try {
        // Consultamos con los nombres que existen en tu BD (según el DESCRIBE que me mostraste)
        const [modulos] = await db.query(`
            SELECT 
                id, 
                titulo, 
                subtitulo AS descripcion, 
                xp_recompensa AS xp, 
                estado 
            FROM modulos 
            ORDER BY orden ASC
        `);

        res.json(modulos);
    } catch (error) {
        // Este console.log aparecerá en los logs de RENDER
        console.error("DETALLE DEL ERROR:", error.message);
        
        // Enviamos el error real al frontend para saber qué falta
        res.status(500).json({ 
            error: "Error en la base de datos", 
            mensaje: error.message 
        });
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