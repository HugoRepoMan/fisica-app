const db = require('../config/db');

exports.obtenerEjercicios = async (req, res) => {
    try {
        const [ejercicios] = await db.query('SELECT * FROM ejercicios');
        
        res.json({
            mensaje: "Aquí tienes tus ejercicios de física",
            data: ejercicios,
            usuario_solicitante: req.usuario.email 
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: "Error al obtener ejercicios" });
    }
};

exports.validarRespuesta = async (req, res) => {
    try {
        const { id_ejercicio, respuesta_usuario } = req.body;
        const id_usuario = req.usuario.id; 
        const [rows] = await db.query('SELECT * FROM ejercicios WHERE id = ?', [id_ejercicio]);
        
        if (rows.length === 0) {
            return res.status(404).json({ error: "Ejercicio no encontrado" });
        }

        const ejercicio = rows[0];

        if (ejercicio.respuesta_correcta === respuesta_usuario) {
            await db.query('UPDATE usuarios SET nivel = nivel + 1 WHERE id = ?', [id_usuario]);

            return res.json({
                resultado: "correcta",
                mensaje: "¡Excelente! Has ganado experiencia.",
                xp_ganada: 10
            });
        } else {

            return res.json({
                resultado: "incorrecta",
                mensaje: "Ops, esa no era. Inténtalo de nuevo.",
                solucion_correcta: ejercicio.respuesta_correcta
            });
        }

    } catch (error) {
        console.error(error);
        res.status(500).json({ error: "Error al validar respuesta" });
    }
};