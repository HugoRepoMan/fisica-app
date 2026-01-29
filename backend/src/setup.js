const db = require('./config/db');

async function setup() {
    try {
        console.log("🔄 Creando arquitectura completa de la Base de Datos...");

        // =====================================================
        // 1. TABLA USUARIOS (VERSIÓN COMPLETA Y CORREGIDA)
        // =====================================================
        await db.query(`
            CREATE TABLE IF NOT EXISTS usuarios (
                id INT AUTO_INCREMENT PRIMARY KEY,
                nombre VARCHAR(100) NOT NULL,
                email VARCHAR(100) NOT NULL UNIQUE,
                password VARCHAR(255) NOT NULL,
                
                -- Sistema de Progresión
                nivel INT DEFAULT 1,
                xp_actual INT DEFAULT 0,
                xp_meta INT DEFAULT 200,
                
                -- Sistema de Vidas y Energía (Duolingo-style)
                vidas INT DEFAULT 5,
                energia INT DEFAULT 5,
                ultima_regeneracion TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                
                -- Estadísticas
                racha INT DEFAULT 0,
                ultima_conexion DATE,
                lecciones_completadas INT DEFAULT 0,
                total_aciertos INT DEFAULT 0,
                total_intentos INT DEFAULT 0,
                
                -- Personalización
                titulo_usuario VARCHAR(50),
                avatar_url VARCHAR(255),
                
                -- Timestamps
                fecha_registro TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                deleted_at TIMESTAMP NULL,
                
                INDEX idx_email (email),
                INDEX idx_xp (xp_actual DESC),
                INDEX idx_nivel (nivel DESC)
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
        `);
        console.log("✅ Tabla 'usuarios' creada/verificada");

        // =====================================================
        // 2. TABLA MÓDULOS (Las tarjetas de aprendizaje)
        // =====================================================
        await db.query(`
            CREATE TABLE IF NOT EXISTS modulos (
                id INT AUTO_INCREMENT PRIMARY KEY,
                titulo VARCHAR(100) NOT NULL,
                descripcion TEXT,
                icono VARCHAR(50) DEFAULT 'book',
                orden INT NOT NULL,
                xp INT DEFAULT 50,
                estado VARCHAR(20) DEFAULT 'bloqueado',
                
                INDEX idx_orden (orden)
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
        `);
        console.log("✅ Tabla 'modulos' creada/verificada");

        // =====================================================
        // 3. TABLA LECCIONES (Contenido dentro de cada módulo)
        // =====================================================
        await db.query(`
            CREATE TABLE IF NOT EXISTS lecciones (
                id INT AUTO_INCREMENT PRIMARY KEY,
                modulo_id INT NOT NULL,
                titulo VARCHAR(150) NOT NULL,
                contenido_texto TEXT,
                formula_latex VARCHAR(255),
                orden INT DEFAULT 0,
                
                FOREIGN KEY (modulo_id) REFERENCES modulos(id) ON DELETE CASCADE,
                INDEX idx_modulo (modulo_id)
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
        `);
        console.log("✅ Tabla 'lecciones' creada/verificada");

        // =====================================================
        // 4. TABLA EJERCICIOS (Preguntas de práctica)
        // =====================================================
        await db.query(`
            CREATE TABLE IF NOT EXISTS ejercicios (
                id INT AUTO_INCREMENT PRIMARY KEY,
                leccion_id INT,
                pregunta TEXT NOT NULL,
                respuesta_correcta VARCHAR(255) NOT NULL,
                opciones JSON,
                explicacion TEXT,
                
                FOREIGN KEY (leccion_id) REFERENCES lecciones(id) ON DELETE SET NULL,
                INDEX idx_leccion (leccion_id)
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
        `);
        console.log("✅ Tabla 'ejercicios' creada/verificada");

        // =====================================================
        // 5. TABLA PROGRESO_USUARIO
        // =====================================================
        await db.query(`
            CREATE TABLE IF NOT EXISTS progreso_usuario (
                id INT AUTO_INCREMENT PRIMARY KEY,
                user_id INT NOT NULL,
                modulo_id INT NOT NULL,
                completado BOOLEAN DEFAULT FALSE,
                estrellas INT DEFAULT 0,
                fecha_completado TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                
                FOREIGN KEY (user_id) REFERENCES usuarios(id) ON DELETE CASCADE,
                FOREIGN KEY (modulo_id) REFERENCES modulos(id) ON DELETE CASCADE,
                UNIQUE KEY unique_user_modulo (user_id, modulo_id),
                INDEX idx_user (user_id)
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
        `);
        console.log("✅ Tabla 'progreso_usuario' creada/verificada");

        // =====================================================
        // 6. TABLA LOGROS (Achievements)
        // =====================================================
        await db.query(`
            CREATE TABLE IF NOT EXISTS logros (
                id INT AUTO_INCREMENT PRIMARY KEY,
                titulo VARCHAR(100) NOT NULL,
                descripcion TEXT,
                icono VARCHAR(50) DEFAULT '🏆',
                xp_requerido INT DEFAULT 0,
                tipo VARCHAR(50) COMMENT 'principiante, completista, maestro, etc.'
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
        `);
        console.log("✅ Tabla 'logros' creada/verificada");

        // =====================================================
        // 7. TABLA USUARIO_LOGROS (Logros desbloqueados)
        // =====================================================
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

        // =====================================================
        // 8. TABLA HISTORIAL_CALCULOS (Calculadora)
        // =====================================================
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

        // =====================================================
        // SEED DATA (Solo si las tablas están vacías)
        // =====================================================
        
        // Seed Módulos
        const [modulos] = await db.query('SELECT COUNT(*) as count FROM modulos');
        if (modulos[0].count === 0) {
            console.log("🌱 Sembrando módulos iniciales...");
            await db.query(`
                INSERT INTO modulos (titulo, descripcion, orden, xp, estado) VALUES 
                ('Leyes de Newton', 'Fundamentos de la dinámica', 1, 50, 'desbloqueado'),
                ('Movimiento Rectilíneo Uniforme', 'Velocidad constante', 2, 60, 'bloqueado'),
                ('MRUV - Caída Libre', 'Aceleración gravitacional', 3, 75, 'bloqueado'),
                ('Fricción y Rozamiento', 'Fuerzas de contacto', 4, 80, 'bloqueado'),
                ('Trabajo y Energía', 'Conservación de energía', 5, 100, 'bloqueado')
            `);
        }

        // Seed Lecciones
        const [lecciones] = await db.query('SELECT COUNT(*) as count FROM lecciones');
        if (lecciones[0].count === 0) {
            console.log("🌱 Sembrando lecciones iniciales...");
            await db.query(`
                INSERT INTO lecciones (modulo_id, titulo, contenido_texto, formula_latex, orden) VALUES 
                (1, 'Primera Ley de Newton', 'Un objeto en reposo permanece en reposo y un objeto en movimiento permanece en movimiento a menos que actúe sobre él una fuerza externa.', 'F = 0 \\Rightarrow a = 0', 1),
                (1, 'Segunda Ley de Newton', 'La fuerza neta sobre un objeto es igual a su masa por su aceleración.', 'F = ma', 2),
                (1, 'Tercera Ley de Newton', 'Para cada acción hay una reacción igual y opuesta.', 'F_{AB} = -F_{BA}', 3),
                (2, '¿Qué es el MRU?', 'Movimiento con velocidad constante en línea recta.', 'v = \\frac{d}{t}', 1),
                (3, 'Caída Libre', 'Movimiento vertical con aceleración constante de 9.8 m/s².', 'h = \\frac{1}{2}gt^2', 1)
            `);
        }

        // Seed Logros
        const [logros] = await db.query('SELECT COUNT(*) as count FROM logros');
        if (logros[0].count === 0) {
            console.log("🌱 Sembrando logros iniciales...");
            await db.query(`
                INSERT INTO logros (titulo, descripcion, icono, xp_requerido, tipo) VALUES 
                ('Primer Paso', 'Completa tu primera lección', '🎯', 0, 'principiante'),
                ('Estudiante Dedicado', 'Alcanza nivel 5', '📚', 1000, 'progreso'),
                ('Maestro de Newton', 'Completa todas las lecciones de Newton', '🔬', 200, 'completista'),
                ('Racha de Fuego', 'Mantén una racha de 7 días', '🔥', 0, 'constancia'),
                ('Calculador Pro', 'Realiza 50 cálculos', '🧮', 0, 'calculadora')
            `);
        }

        // =====================================================
        // MIGRACIÓN: Actualizar usuarios existentes
        // =====================================================
        console.log("🔄 Actualizando usuarios existentes...");
        await db.query(`
            UPDATE usuarios 
            SET 
                vidas = COALESCE(vidas, 5),
                energia = COALESCE(energia, 5),
                ultima_regeneracion = COALESCE(ultima_regeneracion, NOW()),
                lecciones_completadas = COALESCE(lecciones_completadas, 0),
                total_aciertos = COALESCE(total_aciertos, 0),
                total_intentos = COALESCE(total_intentos, 0)
            WHERE 
                vidas IS NULL OR energia IS NULL
        `);

        console.log("\n✅✅✅ BASE DE DATOS COMPLETAMENTE CONFIGURADA ✅✅✅");
        console.log("\n📊 Resumen:");
        console.log("  - Usuarios: ✓");
        console.log("  - Módulos: ✓");
        console.log("  - Lecciones: ✓");
        console.log("  - Ejercicios: ✓");
        console.log("  - Progreso: ✓");
        console.log("  - Logros: ✓");
        console.log("  - Historial Cálculos: ✓");
        console.log("\n🚀 Backend listo para funcionar!\n");
        
        process.exit(0);
    } catch (error) {
        console.error("\n❌ ERROR AL CONFIGURAR BASE DE DATOS:");
        console.error(error);
        process.exit(1);
    }
}

setup();