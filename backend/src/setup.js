const db = require('./config/db');

async function setup() {
    try {
        console.log("🔄 Actualizando arquitectura del Backend...");

        // 1. Usuarios: Agregamos XP_TOTAL y XP_SIGUIENTE_NIVEL
        await db.query(`
            CREATE TABLE IF NOT EXISTS usuarios (
                id INT AUTO_INCREMENT PRIMARY KEY,
                nombre VARCHAR(100) NOT NULL,
                email VARCHAR(100) NOT NULL UNIQUE,
                password VARCHAR(255) NOT NULL,
                nivel INT DEFAULT 1,
                xp_actual INT DEFAULT 0,     -- Ej: 450
                xp_meta INT DEFAULT 750,     -- Ej: 750 para pasar al nivel 2
                fecha_registro TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        `);

        // 2. Modulos (Las tarjetas grandes: MRU, Caída Libre, etc.)
        await db.query(`
            CREATE TABLE IF NOT EXISTS modulos (
                id INT AUTO_INCREMENT PRIMARY KEY,
                titulo VARCHAR(100) NOT NULL,    -- Ej: "Movimiento Rectilíneo Uniforme"
                subtitulo VARCHAR(150),          -- Ej: "Velocidad constante y ecuaciones"
                icono VARCHAR(50),               -- Ej: "check", "lock", "book"
                orden INT NOT NULL,              -- 1, 2, 3 (Para saber cuál va primero)
                xp_recompensa INT DEFAULT 50     -- Cuánto XP gana al terminarlo
            )
        `);

        // 3. Progreso (La memoria de qué ha completado el usuario)
        await db.query(`
            CREATE TABLE IF NOT EXISTS progreso_usuario (
                id INT AUTO_INCREMENT PRIMARY KEY,
                user_id INT,
                modulo_id INT,
                completado BOOLEAN DEFAULT FALSE,
                fecha_completado TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (user_id) REFERENCES usuarios(id),
                FOREIGN KEY (modulo_id) REFERENCES modulos(id)
            )
        `);

        // 4. Contenido Lecciones (El texto y fórmulas dentro de cada módulo)
        await db.query(`
            CREATE TABLE IF NOT EXISTS lecciones (
                id INT AUTO_INCREMENT PRIMARY KEY,
                modulo_id INT,
                titulo VARCHAR(100),            -- Ej: "¿Qué es el MRUV?"
                contenido_texto TEXT,           -- Explicación teórica
                formula_latex VARCHAR(255),     -- Ej: "v = v_0 + a \cdot t"
                FOREIGN KEY (modulo_id) REFERENCES modulos(id)
            )
        `);

        // --- DATOS DE PRUEBA (SEED) ---
        // Insertamos los módulos de tu imagen para que no esté vacío
        const [modulos] = await db.query('SELECT * FROM modulos');
        if (modulos.length === 0) {
            console.log("🌱 Sembrando ruta de aprendizaje...");
            
            await db.query(`
                INSERT INTO modulos (titulo, subtitulo, orden, xp_recompensa) VALUES 
                ('Movimiento Rectilíneo Uniforme (MRU)', 'Velocidad constante y ecuaciones de posición', 1, 50),
                ('MRU - Problemas Avanzados', 'Aplicaciones y ejercicios prácticos', 2, 60),
                ('MRUV - Caída Libre', 'Aceleración constante y gravedad', 3, 75),
                ('Leyes de Newton - Primera Ley', 'Inercia y equilibrio de fuerzas', 4, 80)
            `);
            
            // Insertamos contenido para la primera lección (Tu imagen 2)
            await db.query(`
                INSERT INTO lecciones (modulo_id, titulo, contenido_texto, formula_latex) VALUES 
                (1, 'Introducción al MRU', 'El movimiento rectilíneo uniforme describe un objeto que se mueve en línea recta a velocidad constante.', 'v = d / t'),
                (3, '¿Qué es el MRUV?', 'El Movimiento Rectilíneo Uniformemente Variado es aquel con aceleración constante.', 'v = v_0 + a \\cdot t')
            `);
        }

        console.log("✅ Base de datos lista para el diseño nuevo.");
        process.exit();
    } catch (error) {
        console.error("❌ Error:", error);
        process.exit(1);
    }
}

setup();