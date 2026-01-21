const db = require('../config/db');

exports.obtenerRuta = async (req, res) => {
    try {
        // 1. Pedimos los datos a la BD
        const [modulos] = await db.query('SELECT * FROM modulos');

        // 2. TRUCO DE SEGURIDAD:
        // Si la base de datos está vacía (por error), enviamos datos falsos
        // para que el frontend NO muestre "undefined".
        if (modulos.length === 0) {
            return res.json([
                {
                    id: 1,
                    titulo: "Módulo de Prueba 1",
                    descripcion: "Si ves esto, la BD está vacía pero el Back responde.",
                    xp: 50,
                    estado: "desbloqueado"
                },
                {
                    id: 2,
                    titulo: "Módulo de Prueba 2",
                    descripcion: "Este está bloqueado.",
                    xp: 100,
                    estado: "bloqueado"
                }
            ]);
        }

        // 3. Enviamos los datos reales
        res.json(modulos);

    } catch (error) {
        console.error(error);
        res.status(500).json({ error: "Error al obtener la ruta" });
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