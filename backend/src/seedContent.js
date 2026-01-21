// src/seedContent.js
const db = require('./config/db');

async function llenarContenido() {
    try {
        console.log("📚 Creando lecciones...");

        // 1. Crear tabla si no existe (asegurando columnas correctas)
        await db.query(`
            CREATE TABLE IF NOT EXISTS modulos (
                id INT AUTO_INCREMENT PRIMARY KEY,
                titulo VARCHAR(100),
                descripcion TEXT,
                xp INT DEFAULT 10,
                estado VARCHAR(20) DEFAULT 'bloqueado' -- 'desbloqueado', 'bloqueado', 'completado'
            );
        `);

        // 2. Insertar datos (Solo si está vacía)
        const [existentes] = await db.query('SELECT * FROM modulos');
        if (existentes.length === 0) {
            await db.query(`
                INSERT INTO modulos (titulo, descripcion, xp, estado) VALUES
                ('Introducción a la Física', 'Conceptos básicos de materia y energía.', 10, 'desbloqueado'),
                ('Leyes de Newton', 'Inercia, Fuerza y Acción-Reacción.', 20, 'bloqueado'),
                ('Cinemática', 'Movimiento rectilíneo y aceleración.', 20, 'bloqueado'),
                ('Energía y Trabajo', 'Conservación de la energía mecánica.', 30, 'bloqueado');
            `);
            console.log("✅ Datos insertados correctamente.");
        } else {
            console.log("ℹ️ La tabla ya tenía datos.");
        }

        process.exit();
    } catch (error) {
        console.error(error);
        process.exit(1);
    }
}

llenarContenido();