const jwt = require('jsonwebtoken');
const User = require('../models/userModel');
const bcrypt = require('bcryptjs');
const db = require('../config/db');
const { 
    validateRegistrationData, 
    validateLoginData,
    sanitizeString 
} = require('../validators/inputValidators');

// =======================================================
// REGISTRO DE USUARIO
// =======================================================
exports.registrarUsuario = async (req, res) => {
    try {
        let { nombre, email, password } = req.body;

        // 1. VALIDACIÓN DE DATOS
        const validation = validateRegistrationData({ nombre, email, password });
        if (!validation.valid) {
            return res.status(400).json({ 
                error: validation.errors[0], // Primer error
                errores: validation.errors // Todos los errores
            });
        }

        // 2. SANITIZAR NOMBRE (Prevenir XSS)
        nombre = sanitizeString(nombre);
        email = email.trim().toLowerCase();

        // 3. VERIFICAR SI EL USUARIO YA EXISTE
        const usuarioExistente = await User.findByEmail(email);
        if (usuarioExistente) {
            return res.status(400).json({ 
                error: "Este email ya está registrado" 
            });
        }

        // 4. ENCRIPTAR CONTRASEÑA
        const salt = await bcrypt.genSalt(10);
        const passwordEncriptada = await bcrypt.hash(password, salt);
        
        // 5. INSERTAR USUARIO CON VALORES INICIALES
        const [result] = await db.query(
            `INSERT INTO usuarios 
            (nombre, email, password, vidas, energia, xp_actual, nivel, ultima_regeneracion) 
            VALUES (?, ?, ?, 5, 5, 0, 1, NOW())`,
            [nombre, email, passwordEncriptada]
        );

        // 6. GENERAR TOKEN JWT
        const token = jwt.sign(
            { 
                id: result.insertId, 
                email: email 
            }, 
            process.env.JWT_SECRET, 
            { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
        );

        // 7. LOG DE REGISTRO (Solo en desarrollo)
        if (process.env.NODE_ENV !== 'production') {
            console.log(`✅ Usuario registrado: ${email} (ID: ${result.insertId})`);
        }

        // 8. RESPUESTA EXITOSA
        res.status(201).json({
            mensaje: "Usuario registrado con éxito",
            token: token,
            usuario: { 
                id: result.insertId,
                nombre: nombre, 
                email: email,
                vidas: 5,
                energia: 5,
                xp: 0,
                nivel: 1
            } 
        });

    } catch (error) {
        console.error("❌ Error en registro:", error);
        
        // Error específico de email duplicado (MySQL)
        if (error.code === 'ER_DUP_ENTRY') {
            return res.status(400).json({ 
                error: "Este email ya está registrado" 
            });
        }

        res.status(500).json({ 
            error: "Error en el servidor al registrar usuario" 
        });
    }
};

// =======================================================
// LOGIN DE USUARIO
// =======================================================
exports.login = async (req, res) => {
    try {
        let { email, password } = req.body;

        // 1. VALIDACIÓN DE DATOS
        const validation = validateLoginData({ email, password });
        if (!validation.valid) {
            return res.status(400).json({ 
                error: validation.errors[0] 
            });
        }

        // 2. NORMALIZAR EMAIL
        email = email.trim().toLowerCase();

        // 3. BUSCAR USUARIO (Incluir todos los campos necesarios)
        const usuario = await User.findByEmail(email);
        
        if (!usuario) {
            // Mensaje genérico por seguridad
            return res.status(401).json({ 
                error: "Credenciales inválidas" 
            }); 
        }

        // 4. VERIFICAR SI EL USUARIO FUE ELIMINADO (Soft delete)
        if (usuario.deleted_at) {
            return res.status(401).json({ 
                error: "Esta cuenta ha sido desactivada" 
            });
        }

        // 5. COMPARAR CONTRASEÑA
        const esCorrecta = await bcrypt.compare(password, usuario.password);
        if (!esCorrecta) {
            return res.status(401).json({ 
                error: "Credenciales inválidas" 
            });
        }

        // 6. ACTUALIZAR ÚLTIMA CONEXIÓN Y RACHA
        await actualizarRacha(usuario.id, usuario.ultima_conexion);

        // 7. GENERAR TOKEN JWT
        const token = jwt.sign(
            { 
                id: usuario.id, 
                email: usuario.email 
            }, 
            process.env.JWT_SECRET,                   
            { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }                      
        );

        // 8. OBTENER LOGROS DEL USUARIO
        const [logrosData] = await db.query(
            'SELECT logro_id FROM usuario_logros WHERE user_id = ?', 
            [usuario.id]
        );
        const arrayLogros = logrosData.map(item => item.logro_id);

        // 9. LOG DE LOGIN (Solo en desarrollo)
        if (process.env.NODE_ENV !== 'production') {
            console.log(`✅ Login exitoso: ${email} (ID: ${usuario.id})`);
        }

        // 10. RESPUESTA FINAL
        res.json({
            mensaje: "Login exitoso",
            token: token,
            usuario: { 
                id: usuario.id,
                nombre: usuario.nombre, 
                nivel: usuario.nivel || 1,
                xp: usuario.xp_actual || 0,  
                racha: usuario.racha || 0,   
                vidas: usuario.vidas ?? 5,   // Usar nullish coalescing
                energia: usuario.energia ?? 5, 
                logros: arrayLogros     
            }
        });

    } catch (error) {
        console.error("❌ Error en login:", error);
        res.status(500).json({ 
            error: "Error en el servidor" 
        });
    }
};

// =======================================================
// FUNCIÓN AUXILIAR: ACTUALIZAR RACHA DE DÍAS
// =======================================================
async function actualizarRacha(userId, ultimaConexion) {
    try {
        const hoy = new Date();
        hoy.setHours(0, 0, 0, 0); // Resetear horas para comparar solo fechas

        if (!ultimaConexion) {
            // Primera conexión
            await db.query(
                'UPDATE usuarios SET ultima_conexion = CURDATE(), racha = 1 WHERE id = ?',
                [userId]
            );
            return;
        }

        const ultimaFecha = new Date(ultimaConexion);
        ultimaFecha.setHours(0, 0, 0, 0);

        const diferenciaDias = Math.floor((hoy - ultimaFecha) / (1000 * 60 * 60 * 24));

        if (diferenciaDias === 0) {
            // Ya se conectó hoy, no hacer nada
            return;
        } else if (diferenciaDias === 1) {
            // Conectó ayer, incrementar racha
            await db.query(
                'UPDATE usuarios SET ultima_conexion = CURDATE(), racha = racha + 1 WHERE id = ?',
                [userId]
            );
            
            // Verificar si desbloqueó logro de racha
            const [userData] = await db.query('SELECT racha FROM usuarios WHERE id = ?', [userId]);
            if (userData[0].racha === 7) {
                await otorgarLogroPorNombre(userId, 'Racha de Fuego');
            }
        } else {
            // Rompió la racha, resetear a 1
            await db.query(
                'UPDATE usuarios SET ultima_conexion = CURDATE(), racha = 1 WHERE id = ?',
                [userId]
            );
        }
    } catch (error) {
        console.error('Error al actualizar racha:', error);
    }
}

// =======================================================
// FUNCIÓN AUXILIAR: OTORGAR LOGRO POR NOMBRE
// =======================================================
async function otorgarLogroPorNombre(userId, nombreLogro) {
    try {
        const [logro] = await db.query('SELECT id FROM logros WHERE titulo = ?', [nombreLogro]);
        
        if (logro.length > 0) {
            const [existe] = await db.query(
                'SELECT * FROM usuario_logros WHERE user_id = ? AND logro_id = ?',
                [userId, logro[0].id]
            );
            
            if (existe.length === 0) {
                await db.query(
                    'INSERT INTO usuario_logros (user_id, logro_id) VALUES (?, ?)',
                    [userId, logro[0].id]
                );
                console.log(`🏆 Logro desbloqueado: ${nombreLogro}`);
            }
        }
    } catch (error) {
        console.error('Error al otorgar logro:', error);
    }
}

module.exports = {
    registrarUsuario,
    login
};