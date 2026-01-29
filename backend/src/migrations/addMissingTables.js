// backend/src/migrations/addMissingTables.js
// Script para agregar las 2 tablas que faltan

const db = require('../config/db');

async function addMissingTables() {
    try {
        console.log("🔄 Agregando tablas faltantes...");

        // 1. TABLA HISTORIAL_CALCULOS
        await db.query(`
            CREATE TABLE IF NOT EXISTS historial_calculos (
                id INT AUTO_INCREMENT PRIMARY KEY,
                user_id INT NOT NULL,
                tipo VARCHAR(50) NOT NULL COMMENT 'Newton, Fricción, Peso',
                operacion VARCHAR(100) NOT NULL,
                datos_entrada JSON,
                resultado VARCHAR(255),
                fecha TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                
                FOREIGN KEY (user_id) REFERENCES usuarios(id) ON DELETE CASCADE,
                INDEX idx_user_fecha (user_id, fecha DESC)
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
        `);
        console.log("✅ Tabla 'historial_calculos' creada/verificada");

        // 2. TABLA LOGROS
        await db.query(`
            CREATE TABLE IF NOT EXISTS logros (
                id INT AUTO_INCREMENT PRIMARY KEY,
                titulo VARCHAR(100) NOT NULL,
                descripcion TEXT,
                icono VARCHAR(50) DEFAULT '🏆',
                xp_requerido INT DEFAULT 0,
                tipo VARCHAR(50) COMMENT 'principiante, completista, maestro, constancia, calculadora'
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
        `);
        console.log("✅ Tabla 'logros' creada/verificada");

        // 3. TABLA USUARIO_LOGROS
        await db.query(`
            CREATE TABLE IF NOT EXISTS usuario_logros (
                id INT AUTO_INCREMENT PRIMARY KEY,
                user_id INT NOT NULL,
                logro_id INT NOT NULL,
                fecha_obtencion TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                
                FOREIGN KEY (user_id) REFERENCES usuarios(id) ON DELETE CASCADE,
                FOREIGN KEY (logro_id) REFERENCES logros(id) ON DELETE CASCADE,
                UNIQUE KEY unique_user_logro (user_id, logro_id),
                INDEX idx_user_logros (user_id)
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
        `);
        console.log("✅ Tabla 'usuario_logros' creada/verificada");

        // 4. SEED DE LOGROS (si no existen)
        const [logros] = await db.query('SELECT COUNT(*) as count FROM logros');
        if (logros[0].count === 0) {
            console.log("🌱 Sembrando logros iniciales...");
            await db.query(`
                INSERT INTO logros (titulo, descripcion, icono, xp_requerido, tipo) VALUES 
                ('Primer Paso', 'Completa tu primera lección', '🎯', 0, 'principiante'),
                ('Estudiante Dedicado', 'Alcanza nivel 5', '📚', 1000, 'progreso'),
                ('Maestro de Newton', 'Completa todas las lecciones de Newton', '🔬', 200, 'completista'),
                ('Racha de Fuego', 'Mantén una racha de 7 días consecutivos', '🔥', 0, 'constancia'),
                ('Calculador Pro', 'Realiza 50 cálculos', '🧮', 0, 'calculadora'),
                ('Genio de la Física', 'Alcanza nivel 10', '🧠', 2000, 'progreso'),
                ('Estrella Brillante', 'Obtén 3 estrellas en 10 lecciones', '⭐', 500, 'completista')
            `);
            console.log("✅ Logros iniciales creados");
        }

        // 5. MIGRAR USUARIOS ANTIGUOS (agregar columnas faltantes)
        console.log("🔄 Actualizando usuarios existentes...");
        
        // Verificar si las columnas existen antes de agregarlas
        const [columns] = await db.query(`
            SELECT COLUMN_NAME 
            FROM INFORMATION_SCHEMA.COLUMNS 
            WHERE TABLE_SCHEMA = DATABASE() 
            AND TABLE_NAME = 'usuarios'
        `);
        
        const existingColumns = columns.map(col => col.COLUMN_NAME);
        
        // Agregar columnas si no existen
        if (!existingColumns.includes('vidas')) {
            await db.query('ALTER TABLE usuarios ADD COLUMN vidas INT DEFAULT 5');
            console.log("✅ Columna 'vidas' agregada");
        }
        
        if (!existingColumns.includes('energia')) {
            await db.query('ALTER TABLE usuarios ADD COLUMN energia INT DEFAULT 5');
            console.log("✅ Columna 'energia' agregada");
        }
        
        if (!existingColumns.includes('ultima_regeneracion')) {
            await db.query('ALTER TABLE usuarios ADD COLUMN ultima_regeneracion TIMESTAMP DEFAULT CURRENT_TIMESTAMP');
            console.log("✅ Columna 'ultima_regeneracion' agregada");
        }
        
        if (!existingColumns.includes('racha')) {
            await db.query('ALTER TABLE usuarios ADD COLUMN racha INT DEFAULT 0');
            console.log("✅ Columna 'racha' agregada");
        }
        
        if (!existingColumns.includes('ultima_conexion')) {
            await db.query('ALTER TABLE usuarios ADD COLUMN ultima_conexion DATE');
            console.log("✅ Columna 'ultima_conexion' agregada");
        }
        
        if (!existingColumns.includes('lecciones_completadas')) {
            await db.query('ALTER TABLE usuarios ADD COLUMN lecciones_completadas INT DEFAULT 0');
            console.log("✅ Columna 'lecciones_completadas' agregada");
        }
        
        if (!existingColumns.includes('total_aciertos')) {
            await db.query('ALTER TABLE usuarios ADD COLUMN total_aciertos INT DEFAULT 0');
            console.log("✅ Columna 'total_aciertos' agregada");
        }
        
        if (!existingColumns.includes('total_intentos')) {
            await db.query('ALTER TABLE usuarios ADD COLUMN total_intentos INT DEFAULT 0');
            console.log("✅ Columna 'total_intentos' agregada");
        }
        
        if (!existingColumns.includes('titulo_usuario')) {
            await db.query('ALTER TABLE usuarios ADD COLUMN titulo_usuario VARCHAR(50)');
            console.log("✅ Columna 'titulo_usuario' agregada");
        }

        // Actualizar valores NULL
        await db.query(`
            UPDATE usuarios 
            SET 
                vidas = COALESCE(vidas, 5),
                energia = COALESCE(energia, 5),
                ultima_regeneracion = COALESCE(ultima_regeneracion, NOW()),
                racha = COALESCE(racha, 0),
                lecciones_completadas = COALESCE(lecciones_completadas, 0),
                total_aciertos = COALESCE(total_aciertos, 0),
                total_intentos = COALESCE(total_intentos, 0)
            WHERE 
                vidas IS NULL OR energia IS NULL OR racha IS NULL
        `);
        console.log("✅ Usuarios existentes actualizados");

        console.log("\n🎉 ¡Migración completada con éxito!\n");
        process.exit(0);

    } catch (error) {
        console.error("\n❌ ERROR EN MIGRACIÓN:");
        console.error(error);
        process.exit(1);
    }
}

addMissingTables();
