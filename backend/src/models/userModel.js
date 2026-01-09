// src/models/userModel.js
const db = require('../config/db');

const User = {
    // Funcion 1: Crear
    create: async (userData) => {
        const [result] = await db.query('INSERT INTO usuarios SET ?', userData);
        return result;
    }, 
    // Funcion 2: Buscar por Email 
    findByEmail: async (email) => {
        const [rows] = await db.query('SELECT * FROM usuarios WHERE email = ?', [email]);
        return rows[0];
    }
};

module.exports = User;