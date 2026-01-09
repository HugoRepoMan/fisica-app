const db = require('../config/db');

exports.obtenerEjercicios = async (req, res) => {
    try {
        // Obtenemos todos los ejercicios de la base de datos
        const [ejercicios] = await db.query('SELECT * FROM ejercicios');
        
        res.json({
            mensaje: "Aquí tienes tus ejercicios de física",
            data: ejercicios,
            usuario_solicitante: req.usuario.email // Confirmamos quién los pidió
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: "Error al obtener ejercicios" });
    }
};