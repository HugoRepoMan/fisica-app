const jwt = require('jsonwebtoken');
const User = require('../models/userModel');
const bcrypt = require('bcryptjs');
const db = require('../config/db');

// =======================================================
// REGISTRO DE USUARIO
// =======================================================
exports.registrarUsuario = async (req, res) => {
    try {
        const { nombre, email, password } = req.body;

        if (!nombre || !email || !password) {
            return res.status(400).json({ error: "Faltan datos obligatorios" });
        }

        // Verificar si existe
        const usuarioExistente = await User.findByEmail(email);
        if (usuarioExistente) {
            return res.status(400).json({ error: "El email ya está registrado" });
        }

        // Encriptar contraseña
        const salt = await bcrypt.genSalt(10);
        const passwordEncriptada = await bcrypt.hash(password, salt);
        
        // Insertar usuario con valores iniciales
        const [result] = await db.query(
            `INSERT INTO usuarios 
            (nombre, email, password, vidas, energia, xp_actual, nivel, ultima_regeneracion) 
            VALUES (?, ?, ?, 5, 5, 0, 1, NOW())`,
            [nombre, email, passwordEncriptada]
        );

        // Generar token
        const token = jwt.sign(
            { id: result.insertId, email }, 
            process.env.JWT_SECRET, 
            { expiresIn: '7d' }
        );

        res.status(201).json({
            mensaje: "Usuario registrado con éxito",
            token,
            usuario: { 
                id: result.insertId,
                nombre, 
                email,
                vidas: 5,
                energia: 5,
                xp: 0,
                nivel: 1
            } 
        });

    } catch (error) {
        console.error("Error en registro:", error);
        res.status(500).json({ error: "Error en el servidor al registrar usuario" });
    }
};

// =======================================================
// LOGIN DE USUARIO
// =======================================================
exports.login = async (req, res) => {
    try {
        const { email, password } = req.body;

        if (!email || !password) {
            return res.status(400).json({ error: "Faltan datos" });
        }

        // Buscar usuario
        const usuario = await User.findByEmail(email);
        
        if (!usuario) {
            return res.status(401).json({ error: "Credenciales inválidas" }); 
        }

        // Comparar contraseña
        const esCorrecta = await bcrypt.compare(password, usuario.password);
        if (!esCorrecta) {
            return res.status(401).json({ error: "Credenciales inválidas" });
        }

        // Generar token
        const token = jwt.sign(
            { id: usuario.id, email: usuario.email }, 
            process.env.JWT_SECRET,                   
            { expiresIn: '7d' }                      
        );

        // Obtener logros
        const [logrosData] = await db.query(
            'SELECT logro_id FROM usuario_logros WHERE user_id = ?', 
            [usuario.id]
        );
        const arrayLogros = logrosData.map(item => item.logro_id);

        // Respuesta final
        res.json({
            mensaje: "Login exitoso",
            token: token,
            usuario: { 
                id: usuario.id,
                nombre: usuario.nombre, 
                nivel: usuario.nivel || 1,
                xp: usuario.xp_actual || 0,  
                racha: usuario.racha || 0,   
                vidas: usuario.vidas !== undefined ? usuario.vidas : 5,   
                energia: usuario.energia !== undefined ? usuario.energia : 5, 
                logros: arrayLogros     
            }
        });

    } catch (error) {
        console.error(error);
        res.status(500).json({ error: "Error en el servidor" });
    }
};