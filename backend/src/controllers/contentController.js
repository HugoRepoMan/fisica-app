const db = require('../config/db');

exports.obtenerRuta = async (req, res) => {
    try {
        // Usamos ALIAS (AS) para que el JSON coincida con el Frontend
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

        // Si la BD tiene datos, los enviamos con los nombres corregidos
        if (modulos.length > 0) {
            return res.json(modulos);
        }

        // Si está vacía, enviamos el respaldo (con nombres correctos)
        return res.json([
            {
                id: 1,
                titulo: "Leyes de Newton",
                descripcion: "Base de datos vacía. Cargando datos de respaldo.",
                xp: 100,
                estado: "desbloqueado"
            }
        ]);

    } catch (error) {
        console.error("Error en obtenerRuta:", error);
        res.status(500).json({ error: "Error al obtener la ruta de aprendizaje" });
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