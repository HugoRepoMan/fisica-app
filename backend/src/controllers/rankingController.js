// src/controllers/rankingController.js
const db = require('../config/db');

exports.obtenerRanking = async (req, res) => {
    try {
        // Consultamos los usuarios ordenados por XP (De mayor a menor)
        // LIMIT 10 para no traer miles de usuarios, solo el Top 10
        const [ranking] = await db.query(`
            SELECT id, nombre, nivel, xp_actual, racha 
            FROM usuarios 
            ORDER BY xp_actual DESC 
            LIMIT 10
        `);

        // Agregamos una propiedad "posicion" (1, 2, 3...) para que el Frontend sepa el número
        const rankingConPosicion = ranking.map((usuario, index) => ({
            posicion: index + 1,
            ...usuario
        }));

        res.json(rankingConPosicion);

    } catch (error) {
        console.error(error);
        res.status(500).json({ error: "Error al obtener el ranking" });
    }
};