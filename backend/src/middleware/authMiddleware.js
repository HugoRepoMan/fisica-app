const jwt = require('jsonwebtoken');

module.exports = (req, res, next) => {
    // Buscamos el token en la cabecera 
    const token = req.header('x-auth-token');
    // Si no hay token prohibe el paso
    if (!token) {
        return res.status(401).json({ error: "Acceso denegado. Falta el token." });
    }
    // Verificacion de token 
    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        req.usuario = decoded; 
        next(); 
    } catch (error) {
        res.status(401).json({ error: "Token no válido." });
    }
};