// src/controllers/calculatorController.js
const db = require('../config/db');

// --- AUXILIAR: Guardar en Historial ---
async function guardarHistorial(userId, tipo, operacion, inputs, resultado) {
    if (!userId) return;
    try {
        await db.query(`
            INSERT INTO historial_calculos (user_id, tipo, operacion, datos_entrada, resultado)
            VALUES (?, ?, ?, ?, ?)
        `, [userId, tipo, operacion, JSON.stringify(inputs), resultado]);
    } catch (error) {
        console.error("Error historial:", error);
    }
}

// ==========================================
// 1. CALCULADORA NEWTON (F = m * a)
// ==========================================
exports.calcularNewton = async (req, res) => {
    const { fuerza, masa, aceleracion, calcular } = req.body;
    const userId = req.usuario ? req.usuario.id : null;

    try {
        let resVal = 0;
        let unidad = '';
        let inputs = {};

        switch (calcular) {
            case 'fuerza':
                resVal = parseFloat(masa) * parseFloat(aceleracion);
                unidad = 'N';
                inputs = { masa, aceleracion };
                break;
            case 'masa':
                if (parseFloat(aceleracion) === 0) return res.status(400).json({ error: "Aceleración 0 inválida" });
                resVal = parseFloat(fuerza) / parseFloat(aceleracion);
                unidad = 'kg';
                inputs = { fuerza, aceleracion };
                break;
            case 'aceleracion':
                if (parseFloat(masa) === 0) return res.status(400).json({ error: "Masa 0 inválida" });
                resVal = parseFloat(fuerza) / parseFloat(masa);
                unidad = 'm/s²';
                inputs = { fuerza, masa };
                break;
        }

        resVal = parseFloat(resVal.toFixed(2));
        await guardarHistorial(userId, 'Newton', `Calc ${calcular}`, inputs, `${resVal} ${unidad}`);
        res.json({ resultado: resVal, unidad });
    } catch (e) { res.status(500).json({ error: "Error cálculo" }); }
};

// ==========================================
// 2. CALCULADORA FRICCIÓN (Fr = μ * N)
// ==========================================
exports.calcularFriccion = async (req, res) => {
    const { fuerza_rozamiento, coeficiente, normal, calcular } = req.body;
    const userId = req.usuario ? req.usuario.id : null;

    try {
        let resVal = 0;
        let unidad = '';
        let inputs = {};

        switch (calcular) {
            case 'fuerza_rozamiento': // Fr
                resVal = parseFloat(coeficiente) * parseFloat(normal);
                unidad = 'N';
                inputs = { coeficiente, normal };
                break;
            case 'coeficiente': // μ
                if (parseFloat(normal) === 0) return res.status(400).json({ error: "Normal 0 inválida" });
                resVal = parseFloat(fuerza_rozamiento) / parseFloat(normal);
                unidad = ''; 
                inputs = { fuerza_rozamiento, normal };
                break;
            case 'normal': // N
                if (parseFloat(coeficiente) === 0) return res.status(400).json({ error: "Coeficiente 0 inválido" });
                resVal = parseFloat(fuerza_rozamiento) / parseFloat(coeficiente);
                unidad = 'N';
                inputs = { fuerza_rozamiento, coeficiente };
                break;
        }

        resVal = parseFloat(resVal.toFixed(2));
        await guardarHistorial(userId, 'Fricción', `Calc ${calcular}`, inputs, `${resVal} ${unidad}`);
        res.json({ resultado: resVal, unidad });
    } catch (e) { res.status(500).json({ error: "Error cálculo" }); }
};

// ==========================================
// 3. CALCULADORA PESO (P = m * g) - VERSIÓN FINAL
// ==========================================
exports.calcularPeso = async (req, res) => {
    const { peso, masa, gravedad, calcular } = req.body; // 'calcular' puede ser 'peso', 'masa' o 'gravedad'
    const userId = req.usuario ? req.usuario.id : null;
    
    // Si no están calculando gravedad, usamos 9.81 por defecto para los otros cálculos
    const g = parseFloat(gravedad) || 9.81; 

    try {
        let resVal = 0;
        let unidad = '';
        let inputs = {};

        switch (calcular) {
            case 'peso': // P = m * g
                resVal = parseFloat(masa) * g;
                unidad = 'N';
                inputs = { masa, g };
                break;

            case 'masa': // m = P / g
                if (g === 0) return res.status(400).json({ error: "Gravedad 0 inválida" });
                resVal = parseFloat(peso) / g;
                unidad = 'kg';
                inputs = { peso, g };
                break;

            case 'gravedad': // g = P / m  <--- ESTE FALTABA
                if (parseFloat(masa) === 0) return res.status(400).json({ error: "Masa 0 inválida" });
                resVal = parseFloat(peso) / parseFloat(masa);
                unidad = 'm/s²';
                inputs = { peso, masa };
                break;
                
            default:
                return res.status(400).json({ error: "Especifica 'calcular': peso, masa o gravedad" });
        }

        resVal = parseFloat(resVal.toFixed(2));
        await guardarHistorial(userId, 'Peso', `Calc ${calcular}`, inputs, `${resVal} ${unidad}`);
        res.json({ resultado: resVal, unidad });
        
    } catch (e) { 
        console.error(e);
        res.status(500).json({ error: "Error cálculo" }); 
    }
};

// ==========================================
// 4. GENERADOR DE DIAGRAMA (DCL) INTELIGENTE 📐
// ==========================================
exports.obtenerDCL = (req, res) => {
    // Recibimos TODO lo que haya en el formulario
    const body = req.body;
    
    let vectores = [];
    let descripcion = "";

    // --- CASO A: Vienen datos de FRICCIÓN (Normal y Coeficiente) ---
    if (body.normal !== undefined || body.coeficiente !== undefined || body.fuerza_rozamiento !== undefined) {
        descripcion = "Diagrama de Fricción";
        
        const N = parseFloat(body.normal) || 100; // Valor default visual si falta
        const fr = parseFloat(body.fuerza_rozamiento) || (N * (parseFloat(body.coeficiente) || 0.3));

        vectores = [
            { nombre: "Normal (N)", magnitud: N.toFixed(1), direccion: 90, color: "#3b82f6" },   // Azul Arriba
            { nombre: "Peso (P)", magnitud: N.toFixed(1), direccion: 270, color: "#ef4444" },    // Rojo Abajo (Asumimos plano horizontal N=P)
            { nombre: "Fricción (fr)", magnitud: fr.toFixed(1), direccion: 180, color: "#f59e0b" }, // Naranja Izquierda
            { nombre: "Fuerza (F)", magnitud: fr.toFixed(1), direccion: 0, color: "#10b981" }       // Verde Derecha (Para equilibrar dibujo)
        ];
    }
    
    // --- CASO B: Vienen datos de PESO (Gravedad y Masa) ---
    else if (body.gravedad !== undefined || (body.peso !== undefined && body.masa !== undefined)) {
        descripcion = "Diagrama de Peso";
        
        let P = parseFloat(body.peso);
        if (!P && body.masa) P = parseFloat(body.masa) * (parseFloat(body.gravedad) || 9.81);
        if (!P) P = 50; // Default

        vectores = [
            { nombre: "Peso (P)", magnitud: P.toFixed(1), direccion: 270, color: "#ef4444" }, // Rojo Abajo
            { nombre: "Normal (N)", magnitud: P.toFixed(1), direccion: 90, color: "#3b82f6" }  // Azul Arriba (Reacción del suelo)
        ];
    }

    // --- CASO C: Vienen datos de NEWTON (Masa, Aceleración o Fuerza) ---
    // Este es el default si no es ninguno de los anteriores
    else {
        descripcion = "Diagrama de Newton";
        
        const m = parseFloat(body.masa) || 10;
        const a = parseFloat(body.aceleracion) || 0;
        let F = parseFloat(body.fuerza);
        
        if (!F && a !== 0) F = m * a; // Calculamos F si falta
        if (!F) F = 50; // Default visual

        const P = m * 9.81;

        vectores = [
            { nombre: "Normal (N)", magnitud: P.toFixed(1), direccion: 90, color: "#3b82f6" },   // Azul
            { nombre: "Peso (P)", magnitud: P.toFixed(1), direccion: 270, color: "#ef4444" },    // Rojo
            { nombre: "Fuerza (F)", magnitud: F.toFixed(1), direccion: 0, color: "#10b981" }     // Verde Derecha
        ];
    }

    res.json({
        tipo: "DCL",
        descripcion: descripcion,
        vectores: vectores
    });
};

// --- 5. HISTORIAL ---
exports.obtenerHistorial = async (req, res) => {
    const userId = req.usuario.id;
    try {
        const [historial] = await db.query(`
            SELECT tipo, operacion, resultado, fecha 
            FROM historial_calculos WHERE user_id = ? 
            ORDER BY fecha DESC LIMIT 10
        `, [userId]);
        res.json(historial);
    } catch (e) { res.status(500).json({ error: "Error historial" }); }
};