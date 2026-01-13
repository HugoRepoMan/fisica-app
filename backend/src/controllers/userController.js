const db = require('../config/db');

exports.obtenerPerfil = async (req, res) => {
    try {
        const userId = req.usuario.id; 

        // Consultamos XP, Nivel y Racha
        const [usuarios] = await db.query(
            'SELECT nombre, email, nivel, xp_actual, xp_meta, racha FROM usuarios WHERE id = ?', 
            [userId]
        );

        if (usuarios.length === 0) {
            return res.status(404).json({ msg: 'Usuario no encontrado' });
        }

        res.json(usuarios[0]); // Devolvemos el objeto para el Header morado

    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Error al obtener perfil' });
    }
};