// src/controllers/calculatorController.js

// --- 1. SEGUNDA LEY DE NEWTON (F = m * a) ---
exports.calcularNewton = (req, res) => {
    const { fuerza, masa, aceleracion, calcular } = req.body;

    // 'calcular' nos dice qué variable quiere el usuario: 'fuerza', 'masa' o 'aceleracion'
    try {
        let resultado = 0;

        switch (calcular) {
            case 'fuerza':
                resultado = masa * aceleracion;
                return res.json({ resultado, unidad: 'N' });
            
            case 'masa':
                if (aceleracion == 0) return res.status(400).json({ error: "La aceleración no puede ser 0" });
                resultado = fuerza / aceleracion;
                return res.json({ resultado, unidad: 'kg' });

            case 'aceleracion':
                if (masa == 0) return res.status(400).json({ error: "La masa no puede ser 0" });
                resultado = fuerza / masa;
                return res.json({ resultado, unidad: 'm/s²' });

            default:
                return res.status(400).json({ error: "Debes especificar qué 'calcular' (fuerza, masa, aceleracion)" });
        }
    } catch (error) {
        res.status(500).json({ error: "Error de cálculo" });
    }
};

// --- 2. FUERZA DE FRICCIÓN (Fr = μ * N) ---
exports.calcularFriccion = (req, res) => {
    const { fuerza_rozamiento, coeficiente, normal, calcular } = req.body;

    try {
        let resultado = 0;

        switch (calcular) {
            case 'fuerza_rozamiento': // Fr = μ * N
                resultado = coeficiente * normal;
                return res.json({ resultado, unidad: 'N' });

            case 'coeficiente': // μ = Fr / N
                if (normal == 0) return res.status(400).json({ error: "La normal no puede ser 0" });
                resultado = fuerza_rozamiento / normal;
                return res.json({ resultado, unidad: '' }); // Adimensional

            case 'normal': // N = Fr / μ
                if (coeficiente == 0) return res.status(400).json({ error: "El coeficiente no puede ser 0" });
                resultado = fuerza_rozamiento / coeficiente;
                return res.json({ resultado, unidad: 'N' });

            default:
                return res.status(400).json({ error: "Especifica qué calcular (fuerza_rozamiento, coeficiente, normal)" });
        }
    } catch (error) {
        res.status(500).json({ error: "Error de cálculo" });
    }
};

// --- 3. PESO (P = m * g) ---
exports.calcularPeso = (req, res) => {
    const { peso, masa, gravedad, calcular } = req.body;
    const g = gravedad || 9.81; // Si no envían gravedad, usamos la de la Tierra

    try {
        let resultado = 0;

        switch (calcular) {
            case 'peso':
                resultado = masa * g;
                return res.json({ resultado, unidad: 'N' });

            case 'masa':
                resultado = peso / g;
                return res.json({ resultado, unidad: 'kg' });
                
            default:
                return res.status(400).json({ error: "Especifica qué calcular (peso, masa)" });
        }
    } catch (error) {
        res.status(500).json({ error: "Error de cálculo" });
    }
};