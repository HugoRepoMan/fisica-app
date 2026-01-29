// src/controllers/calculatorController.js - VERSIÓN CORREGIDA CON VALIDACIONES
const db = require('../config/db');

// ==========================================
// FUNCIÓN AUXILIAR: Validar número
// ==========================================
function validarNumero(valor, nombreCampo) {
    if (valor === undefined || valor === null || valor === '') {
        return { valido: false, error: `${nombreCampo} es requerido` };
    }
    
    const num = parseFloat(valor);
    
    if (isNaN(num)) {
        return { valido: false, error: `${nombreCampo} debe ser un número válido` };
    }
    
    return { valido: true, valor: num };
}

// ==========================================
// FUNCIÓN AUXILIAR: Guardar historial
// ==========================================
async function guardarHistorial(userId, tipo, operacion, inputs, resultado) {
    if (!userId) return;
    try {
        await db.query(`
            INSERT INTO historial_calculos (user_id, tipo, operacion, datos_entrada, resultado)
            VALUES (?, ?, ?, ?, ?)
        `, [userId, tipo, operacion, JSON.stringify(inputs), resultado]);
    } catch (error) {
        console.error("Error al guardar historial:", error);
    }
}

// ==========================================
// 1. CALCULADORA NEWTON (F = m * a)
// ==========================================
exports.calcularNewton = async (req, res) => {
    const { fuerza, masa, aceleracion, calcular } = req.body;
    const userId = req.usuario ? req.usuario.id : null;

    try {
        // Validar que especificó qué calcular
        if (!calcular || !['fuerza', 'masa', 'aceleracion'].includes(calcular)) {
            return res.status(400).json({ 
                error: "Debes especificar qué calcular: 'fuerza', 'masa' o 'aceleracion'" 
            });
        }

        let resVal = 0;
        let unidad = '';
        let inputs = {};

        switch (calcular) {
            case 'fuerza': {
                // Validar masa
                const validMasa = validarNumero(masa, 'masa');
                if (!validMasa.valido) {
                    return res.status(400).json({ error: validMasa.error });
                }

                // Validar aceleración
                const validAcel = validarNumero(aceleracion, 'aceleracion');
                if (!validAcel.valido) {
                    return res.status(400).json({ error: validAcel.error });
                }

                resVal = validMasa.valor * validAcel.valor;
                unidad = 'N';
                inputs = { masa: validMasa.valor, aceleracion: validAcel.valor };
                break;
            }

            case 'masa': {
                // Validar fuerza
                const validFuerza = validarNumero(fuerza, 'fuerza');
                if (!validFuerza.valido) {
                    return res.status(400).json({ error: validFuerza.error });
                }

                // Validar aceleración
                const validAcel = validarNumero(aceleracion, 'aceleracion');
                if (!validAcel.valido) {
                    return res.status(400).json({ error: validAcel.error });
                }

                if (validAcel.valor === 0) {
                    return res.status(400).json({ error: "La aceleración no puede ser 0" });
                }

                resVal = validFuerza.valor / validAcel.valor;
                unidad = 'kg';
                inputs = { fuerza: validFuerza.valor, aceleracion: validAcel.valor };
                break;
            }

            case 'aceleracion': {
                // Validar fuerza
                const validFuerza = validarNumero(fuerza, 'fuerza');
                if (!validFuerza.valido) {
                    return res.status(400).json({ error: validFuerza.error });
                }

                // Validar masa
                const validMasa = validarNumero(masa, 'masa');
                if (!validMasa.valido) {
                    return res.status(400).json({ error: validMasa.error });
                }

                if (validMasa.valor === 0) {
                    return res.status(400).json({ error: "La masa no puede ser 0" });
                }

                resVal = validFuerza.valor / validMasa.valor;
                unidad = 'm/s²';
                inputs = { fuerza: validFuerza.valor, masa: validMasa.valor };
                break;
            }
        }

        resVal = parseFloat(resVal.toFixed(2));
        await guardarHistorial(userId, 'Newton', `Calcular ${calcular}`, inputs, `${resVal} ${unidad}`);
        
        res.json({ resultado: resVal, unidad });

    } catch (e) {
        console.error("Error en cálculo Newton:", e);
        res.status(500).json({ error: "Error en el cálculo" });
    }
};

// ==========================================
// 2. CALCULADORA FRICCIÓN (Fr = μ * N)
// ==========================================
exports.calcularFriccion = async (req, res) => {
    const { fuerza_rozamiento, coeficiente, normal, calcular } = req.body;
    const userId = req.usuario ? req.usuario.id : null;

    try {
        if (!calcular || !['fuerza_rozamiento', 'coeficiente', 'normal'].includes(calcular)) {
            return res.status(400).json({ 
                error: "Debes especificar qué calcular: 'fuerza_rozamiento', 'coeficiente' o 'normal'" 
            });
        }

        let resVal = 0;
        let unidad = '';
        let inputs = {};

        switch (calcular) {
            case 'fuerza_rozamiento': {
                const validCoef = validarNumero(coeficiente, 'coeficiente');
                if (!validCoef.valido) return res.status(400).json({ error: validCoef.error });

                const validNormal = validarNumero(normal, 'normal');
                if (!validNormal.valido) return res.status(400).json({ error: validNormal.error });

                resVal = validCoef.valor * validNormal.valor;
                unidad = 'N';
                inputs = { coeficiente: validCoef.valor, normal: validNormal.valor };
                break;
            }

            case 'coeficiente': {
                const validFr = validarNumero(fuerza_rozamiento, 'fuerza_rozamiento');
                if (!validFr.valido) return res.status(400).json({ error: validFr.error });

                const validNormal = validarNumero(normal, 'normal');
                if (!validNormal.valido) return res.status(400).json({ error: validNormal.error });

                if (validNormal.valor === 0) {
                    return res.status(400).json({ error: "La normal no puede ser 0" });
                }

                resVal = validFr.valor / validNormal.valor;
                unidad = '';
                inputs = { fuerza_rozamiento: validFr.valor, normal: validNormal.valor };
                break;
            }

            case 'normal': {
                const validFr = validarNumero(fuerza_rozamiento, 'fuerza_rozamiento');
                if (!validFr.valido) return res.status(400).json({ error: validFr.error });

                const validCoef = validarNumero(coeficiente, 'coeficiente');
                if (!validCoef.valido) return res.status(400).json({ error: validCoef.error });

                if (validCoef.valor === 0) {
                    return res.status(400).json({ error: "El coeficiente no puede ser 0" });
                }

                resVal = validFr.valor / validCoef.valor;
                unidad = 'N';
                inputs = { fuerza_rozamiento: validFr.valor, coeficiente: validCoef.valor };
                break;
            }
        }

        resVal = parseFloat(resVal.toFixed(2));
        await guardarHistorial(userId, 'Fricción', `Calcular ${calcular}`, inputs, `${resVal} ${unidad}`);
        
        res.json({ resultado: resVal, unidad });

    } catch (e) {
        console.error("Error en cálculo Fricción:", e);
        res.status(500).json({ error: "Error en el cálculo" });
    }
};

// ==========================================
// 3. CALCULADORA PESO (P = m * g)
// ==========================================
exports.calcularPeso = async (req, res) => {
    const { peso, masa, gravedad, calcular } = req.body;
    const userId = req.usuario ? req.usuario.id : null;
    
    const g = gravedad ? parseFloat(gravedad) : 9.81;

    try {
        if (!calcular || !['peso', 'masa', 'gravedad'].includes(calcular)) {
            return res.status(400).json({ 
                error: "Debes especificar qué calcular: 'peso', 'masa' o 'gravedad'" 
            });
        }

        let resVal = 0;
        let unidad = '';
        let inputs = {};

        switch (calcular) {
            case 'peso': {
                const validMasa = validarNumero(masa, 'masa');
                if (!validMasa.valido) return res.status(400).json({ error: validMasa.error });

                resVal = validMasa.valor * g;
                unidad = 'N';
                inputs = { masa: validMasa.valor, g };
                break;
            }

            case 'masa': {
                const validPeso = validarNumero(peso, 'peso');
                if (!validPeso.valido) return res.status(400).json({ error: validPeso.error });

                if (g === 0) {
                    return res.status(400).json({ error: "La gravedad no puede ser 0" });
                }

                resVal = validPeso.valor / g;
                unidad = 'kg';
                inputs = { peso: validPeso.valor, g };
                break;
            }

            case 'gravedad': {
                const validPeso = validarNumero(peso, 'peso');
                if (!validPeso.valido) return res.status(400).json({ error: validPeso.error });

                const validMasa = validarNumero(masa, 'masa');
                if (!validMasa.valido) return res.status(400).json({ error: validMasa.error });

                if (validMasa.valor === 0) {
                    return res.status(400).json({ error: "La masa no puede ser 0" });
                }

                resVal = validPeso.valor / validMasa.valor;
                unidad = 'm/s²';
                inputs = { peso: validPeso.valor, masa: validMasa.valor };
                break;
            }
        }

        resVal = parseFloat(resVal.toFixed(2));
        await guardarHistorial(userId, 'Peso', `Calcular ${calcular}`, inputs, `${resVal} ${unidad}`);
        
        res.json({ resultado: resVal, unidad });
        
    } catch (e) { 
        console.error("Error en cálculo Peso:", e);
        res.status(500).json({ error: "Error en el cálculo" }); 
    }
};

// ==========================================
// 4. GENERADOR DE DIAGRAMA (DCL) INTELIGENTE
// ==========================================
exports.obtenerDCL = (req, res) => {
    const body = req.body;
    
    let vectores = [];
    let descripcion = "";

    // CASO A: Fricción
    if (body.normal !== undefined || body.coeficiente !== undefined || body.fuerza_rozamiento !== undefined) {
        descripcion = "Diagrama de Fricción";
        
        const N = parseFloat(body.normal) || 100;
        const fr = parseFloat(body.fuerza_rozamiento) || (N * (parseFloat(body.coeficiente) || 0.3));

        vectores = [
            { nombre: "Normal (N)", magnitud: N.toFixed(1), direccion: 90, color: "#3b82f6" },
            { nombre: "Peso (P)", magnitud: N.toFixed(1), direccion: 270, color: "#ef4444" },
            { nombre: "Fricción (fr)", magnitud: fr.toFixed(1), direccion: 180, color: "#f59e0b" },
            { nombre: "Fuerza (F)", magnitud: fr.toFixed(1), direccion: 0, color: "#10b981" }
        ];
    }
    // CASO B: Peso
    else if (body.gravedad !== undefined || (body.peso !== undefined && body.masa !== undefined)) {
        descripcion = "Diagrama de Peso";
        
        let P = parseFloat(body.peso);
        if (!P && body.masa) P = parseFloat(body.masa) * (parseFloat(body.gravedad) || 9.81);
        if (!P) P = 50;

        vectores = [
            { nombre: "Peso (P)", magnitud: P.toFixed(1), direccion: 270, color: "#ef4444" },
            { nombre: "Normal (N)", magnitud: P.toFixed(1), direccion: 90, color: "#3b82f6" }
        ];
    }
    // CASO C: Newton (default)
    else {
        descripcion = "Diagrama de Newton";
        
        const m = parseFloat(body.masa) || 10;
        const a = parseFloat(body.aceleracion) || 0;
        let F = parseFloat(body.fuerza);
        
        if (!F && a !== 0) F = m * a;
        if (!F) F = 50;

        const P = m * 9.81;

        vectores = [
            { nombre: "Normal (N)", magnitud: P.toFixed(1), direccion: 90, color: "#3b82f6" },
            { nombre: "Peso (P)", magnitud: P.toFixed(1), direccion: 270, color: "#ef4444" },
            { nombre: "Fuerza (F)", magnitud: F.toFixed(1), direccion: 0, color: "#10b981" }
        ];
    }

    res.json({
        tipo: "DCL",
        descripcion: descripcion,
        vectores: vectores
    });
};

// ==========================================
// 5. HISTORIAL
// ==========================================
exports.obtenerHistorial = async (req, res) => {
    const userId = req.usuario.id;
    try {
        const [historial] = await db.query(`
            SELECT tipo, operacion, resultado, fecha 
            FROM historial_calculos 
            WHERE user_id = ? 
            ORDER BY fecha DESC 
            LIMIT 20
        `, [userId]);
        
        res.json(historial);
    } catch (e) {
        console.error("Error al obtener historial:", e);
        res.status(500).json({ error: "Error al obtener historial" });
    }
};
