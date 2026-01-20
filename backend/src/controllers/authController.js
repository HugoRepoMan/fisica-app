const jwt = require('jsonwebtoken');
const User = require('../models/userModel');
const bcrypt = require('bcryptjs');
const db = require('../config/db'); // <--- 1. IMPORTANTE: Necesario para consultar los logros

exports.registrarUsuario = async (req, res) => {
    try {
        const { nombre, email, password } = req.body;

        if (!nombre || !email || !password) {
            return res.status(400).json({ error: "Faltan datos obligatorios" });
        }

        // Usamos el Modelo para buscar si existe
        const usuarioExistente = await User.findByEmail(email);
        if (usuarioExistente) {
            return res.status(400).json({ error: "El email ya está registrado" });
        }

        const salt = await bcrypt.genSalt(10);
        const passwordEncriptada = await bcrypt.hash(password, salt);
        
        const nuevoUsuario = {
            nombre,
            email,
            password: passwordEncriptada
        };

        await User.create(nuevoUsuario);

        res.status(201).json({
            mensaje: "Usuario registrado con éxito",
            usuario: { nombre, email } 
        });

    } catch (error) {
        console.error(error);
        res.status(500).json({ error: "Error en el servidor al registrar usuario" });
    }
};

exports.login = async (req, res) => {
    try {
        const { email, password } = req.body;

        // Validar que lleguen datos
        if (!email || !password) {
            return res.status(400).json({ error: "Faltan datos" });
        }

        // Buscar al usuario por email
        const usuario = await User.findByEmail(email);
        if (!usuario) {
            return res.status(401).json({ error: "Credenciales inválidas" }); 
        }

        // Comparar la contraseña 
        const esCorrecta = await bcrypt.compare(password, usuario.password);
        if (!esCorrecta) {
            return res.status(401).json({ error: "Credenciales inválidas" });
        }

        // Generar el Token 
        const token = jwt.sign(
            { id: usuario.id, email: usuario.email }, 
            process.env.JWT_SECRET,                   
            { expiresIn: '7d' }                      
        );

        // --- 🔽 NUEVO: Obtener los logros del usuario 🔽 ---
        const [logrosData] = await db.query(
            'SELECT logro_id FROM usuario_logros WHERE user_id = ?', 
            [usuario.id]
        );

        // Convertimos [{logro_id: "A"}, {logro_id: "B"}] -> ["A", "B"]
        const arrayLogros = logrosData.map(item => item.logro_id);
        // --- 🔼 FIN NUEVO 🔼 ---

        res.json({
            mensaje: "Login exitoso",
            token: token,
            usuario: { 
                id: usuario.id,
                nombre: usuario.nombre, 
                nivel: usuario.nivel,
                xp: usuario.xp_actual,  // El frontend lo pidió como "xp"
                racha: usuario.racha,   // Le mandamos la racha también
                vidas: usuario.vidas,   // Y las vidas para el header
                logros: arrayLogros     // <--- AQUÍ VA EL ARRAY QUE QUERÍA
            }
        });

    } catch (error) {
        console.error(error);
        res.status(500).json({ error: "Error en el servidor" });
    }
};