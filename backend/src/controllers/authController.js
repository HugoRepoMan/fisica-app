const jwt = require('jsonwebtoken');
const User = require('../models/userModel');
const bcrypt = require('bcryptjs');
const db = require('../config/db'); // Importante para las consultas directas

exports.registrarUsuario = async (req, res) => {
    try {
        const { nombre, email, password } = req.body;

        if (!nombre || !email || !password) {
            return res.status(400).json({ error: "Faltan datos obligatorios" });
        }

        // 1. Verificar si existe (Usamos tu Modelo actual para leer)
        const usuarioExistente = await User.findByEmail(email);
        if (usuarioExistente) {
            return res.status(400).json({ error: "El email ya está registrado" });
        }

        // 2. Encriptar contraseña
        const salt = await bcrypt.genSalt(10);
        const passwordEncriptada = await bcrypt.hash(password, salt);
        
        // 3. INSERTAR CON DATOS INICIALES (Aquí está la magia de Duolingo ✨)
        // Usamos SQL directo para asegurar que vidas y energía sean 5
        const [result] = await db.query(
            `INSERT INTO usuarios 
            (nombre, email, password, vidas, energia, xp_actual, nivel, ultima_regeneracion) 
            VALUES (?, ?, ?, 5, 5, 0, 1, NOW())`,
            [nombre, email, passwordEncriptada]
        );

        // 4. Generar Token inmediato para que entre directo sin loguearse de nuevo
        const token = jwt.sign(
            { id: result.insertId, email }, 
            process.env.JWT_SECRET, 
            { expiresIn: '7d' }
        );

        res.status(201).json({
            mensaje: "Usuario registrado con éxito",
            token, // Devolvemos token para auto-login
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

exports.login = async (req, res) => {
    try {
        const { email, password } = req.body;

        if (!email || !password) {
            return res.status(400).json({ error: "Faltan datos" });
        }

        // 1. Buscar usuario
        // NOTA: Asegúrate de que tu User.findByEmail haga un "SELECT *" para traer vidas y energía
        const usuario = await User.findByEmail(email);
        
        if (!usuario) {
            return res.status(401).json({ error: "Credenciales inválidas" }); 
        }

        // 2. Comparar contraseña
        const esCorrecta = await bcrypt.compare(password, usuario.password);
        if (!esCorrecta) {
            return res.status(401).json({ error: "Credenciales inválidas" });
        }

        // 3. Token
        const token = jwt.sign(
            { id: usuario.id, email: usuario.email }, 
            process.env.JWT_SECRET,                   
            { expiresIn: '7d' }                      
        );

        // 4. Obtener logros
        const [logrosData] = await db.query(
            'SELECT logro_id FROM usuario_logros WHERE user_id = ?', 
            [usuario.id]
        );
        const arrayLogros = logrosData.map(item => item.logro_id);

        // 5. RESPUESTA FINAL
        res.json({
            mensaje: "Login exitoso",
            token: token,
            usuario: { 
                id: usuario.id,
                nombre: usuario.nombre, 
                nivel: usuario.nivel || 1,
                xp: usuario.xp_actual || 0,  
                racha: usuario.racha || 0,   
                
                // Aseguramos que si son null (por error de BD antigua), enviamos valores por defecto
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