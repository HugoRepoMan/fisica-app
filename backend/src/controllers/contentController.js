const db = require('../config/db');

exports.obtenerRuta = async (req, res) => {
    try {
        // Consultamos con los nombres REALES que vimos en tu terminal
        const [modulos] = await db.query(`
            SELECT 
                id, 
                titulo, 
                descripcion, 
                xp, 
                estado 
            FROM modulos 
            ORDER BY orden ASC
        `);

        // Si la base de datos no tiene filas, enviamos un módulo de bienvenida
        if (modulos.length === 0) {
            return res.json([{
                id: 1,
                titulo: "Leyes de Newton",
                descripcion: "¡Bienvenido! El contenido se está cargando.",
                xp: 100,
                estado: "desbloqueado"
            }]);
        }

        res.json(modulos);
    } catch (error) {
        console.error("Error en la base de datos:", error.message);
        res.status(500).json({ 
            error: "Error en la base de datos", 
            mensaje: error.message 
        });
    }
};

exports.obtenerLeccion = async (req, res) => {
    try {
        const { id_modulo } = req.params;
        // Asegúrate de que la tabla 'lecciones' exista también
        const [lecciones] = await db.query('SELECT * FROM lecciones WHERE modulo_id = ?', [id_modulo]);
        res.json(lecciones);
    } catch (error) {
        res.status(500).json({ error: "Error al obtener lección" });
    }
};