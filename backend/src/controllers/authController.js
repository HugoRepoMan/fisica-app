const jwt = require('jsonwebtoken');
const User = require('../models/userModel');
const bcrypt = require('bcryptjs');

exports.registrarUsuario = async (req, res) => {
    try {
        const { nombre, email, password } = req.body;

        if (!nombre || !email || !password) {
            return res.status(400).json({ error: "Faltan datos obligatorios" });
        }
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
            return res.status(401).json({ error: "Credenciales inválidas" }); // No decimos "email no existe" por seguridad
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
        res.json({
            mensaje: "Login exitoso",
            token: token,
            usuario: { nombre: usuario.nombre, nivel: usuario.nivel }
        });

    } catch (error) {
        console.error(error);
        res.status(500).json({ error: "Error en el servidor" });
    }
};