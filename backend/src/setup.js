const db = require('./config/db');

async function setup() {
    try {
        // Tabla Usuarios 
        await db.query(`
            CREATE TABLE IF NOT EXISTS usuarios (
                id INT AUTO_INCREMENT PRIMARY KEY,
                nombre VARCHAR(100) NOT NULL,
                email VARCHAR(100) NOT NULL UNIQUE,
                password VARCHAR(255) NOT NULL,
                nivel INT DEFAULT 1,
                fecha_registro TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        `);
        // 2. Tabla Ejercicios 
        await db.query(`
            CREATE TABLE IF NOT EXISTS ejercicios (
                id INT AUTO_INCREMENT PRIMARY KEY,
                titulo VARCHAR(100),
                pregunta TEXT NOT NULL,
                opcion_a VARCHAR(100),
                opcion_b VARCHAR(100),
                opcion_c VARCHAR(100),
                respuesta_correcta CHAR(1), -- 'a', 'b' o 'c'
                nivel INT DEFAULT 1
            )
        `);
        // Insertar un ejercicio de prueba 
        const [rows] = await db.query('SELECT * FROM ejercicios');
        if (rows.length === 0) {
            await db.query(`
                INSERT INTO ejercicios (titulo, pregunta, opcion_a, opcion_b, opcion_c, respuesta_correcta)
                VALUES 
                ('Velocidad Simple', 'Un auto recorre 100km en 2 horas. ¿Cuál es su velocidad?', '20 km/h', '50 km/h', '100 km/h', 'b'),
                ('Caída Libre', '¿Cuál es el valor aproximado de la gravedad en la Tierra?', '9.8 m/s²', '5.5 m/s²', '12 m/s²', 'a')
            `);
            console.log("📚 Ejercicios de prueba agregados.");
        }

        console.log("✅ Estructura de base de datos actualizada.");
        process.exit();
    } catch (error) {
        console.error("❌ Error:", error);
        process.exit(1);
    }
}

setup();