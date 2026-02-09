// src/validators/inputValidators.js

// =====================================================
// VALIDACIÓN DE EMAILS
// =====================================================
function isValidEmail(email) {
    if (!email || typeof email !== 'string') return false;
    
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email.trim());
}

// =====================================================
// VALIDACIÓN DE PASSWORDS
// =====================================================
function isValidPassword(password) {
    if (!password || typeof password !== 'string') {
        return { valid: false, error: 'La contraseña es requerida' };
    }

    if (password.length < 8) {
        return { 
            valid: false, 
            error: 'La contraseña debe tener al menos 8 caracteres' 
        };
    }

    // Verificar que contenga al menos una letra
    const hasLetter = /[a-zA-Z]/.test(password);
    if (!hasLetter) {
        return { 
            valid: false, 
            error: 'La contraseña debe contener al menos una letra' 
        };
    }

    // Verificar que contenga al menos un número
    const hasNumber = /\d/.test(password);
    if (!hasNumber) {
        return { 
            valid: false, 
            error: 'La contraseña debe contener al menos un número' 
        };
    }

    return { valid: true };
}

// =====================================================
// VALIDACIÓN DE NÚMEROS
// =====================================================
function isValidNumber(value, fieldName = 'valor') {
    if (value === undefined || value === null || value === '') {
        return { 
            valid: false, 
            error: `El campo ${fieldName} es requerido` 
        };
    }

    const num = parseFloat(value);
    
    if (isNaN(num)) {
        return { 
            valid: false, 
            error: `El campo ${fieldName} debe ser un número válido` 
        };
    }

    return { valid: true, value: num };
}

// =====================================================
// VALIDACIÓN DE NÚMEROS POSITIVOS
// =====================================================
function isPositiveNumber(value, fieldName = 'valor') {
    const validation = isValidNumber(value, fieldName);
    
    if (!validation.valid) return validation;

    if (validation.value < 0) {
        return { 
            valid: false, 
            error: `El campo ${fieldName} debe ser un número positivo` 
        };
    }

    return { valid: true, value: validation.value };
}

// =====================================================
// VALIDACIÓN DE NOMBRE
// =====================================================
function isValidName(name) {
    if (!name || typeof name !== 'string') {
        return { valid: false, error: 'El nombre es requerido' };
    }

    const trimmedName = name.trim();

    if (trimmedName.length < 2) {
        return { 
            valid: false, 
            error: 'El nombre debe tener al menos 2 caracteres' 
        };
    }

    if (trimmedName.length > 100) {
        return { 
            valid: false, 
            error: 'El nombre no puede tener más de 100 caracteres' 
        };
    }

    return { valid: true, value: trimmedName };
}

// =====================================================
// SANITIZACIÓN DE STRINGS (Prevención XSS)
// =====================================================
function sanitizeString(str) {
    if (!str || typeof str !== 'string') return '';
    
    return str
        .trim()
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#x27;')
        .replace(/\//g, '&#x2F;');
}

// =====================================================
// VALIDACIÓN DE DATOS DE REGISTRO
// =====================================================
function validateRegistrationData(data) {
    const errors = [];

    // Validar nombre
    const nameValidation = isValidName(data.nombre);
    if (!nameValidation.valid) {
        errors.push(nameValidation.error);
    }

    // Validar email
    if (!isValidEmail(data.email)) {
        errors.push('Email inválido');
    }

    // Validar password
    const passwordValidation = isValidPassword(data.password);
    if (!passwordValidation.valid) {
        errors.push(passwordValidation.error);
    }

    return {
        valid: errors.length === 0,
        errors: errors
    };
}

// =====================================================
// VALIDACIÓN DE DATOS DE LOGIN
// =====================================================
function validateLoginData(data) {
    const errors = [];

    if (!isValidEmail(data.email)) {
        errors.push('Email inválido');
    }

    if (!data.password || data.password.length === 0) {
        errors.push('La contraseña es requerida');
    }

    return {
        valid: errors.length === 0,
        errors: errors
    };
}

// =====================================================
// VALIDACIÓN DE DATOS DE CALCULADORA
// =====================================================
function validateCalculatorInput(data, requiredFields) {
    const errors = [];

    for (let field of requiredFields) {
        if (data[field] !== undefined && data[field] !== '') {
            const validation = isValidNumber(data[field], field);
            if (!validation.valid) {
                errors.push(validation.error);
            }
        }
    }

    // Verificar división por cero
    if (requiredFields.includes('masa') && parseFloat(data.masa) === 0) {
        errors.push('La masa no puede ser cero');
    }
    if (requiredFields.includes('aceleracion') && parseFloat(data.aceleracion) === 0) {
        errors.push('La aceleración no puede ser cero');
    }

    return {
        valid: errors.length === 0,
        errors: errors
    };
}

// =====================================================
// VALIDACIÓN DE PAYLOAD: COMPLETAR LECCIÓN
// =====================================================
function validateLessonCompletion(data) {
    const errors = [];
    const parsed = {};

    // puntaje y total_preguntas
    if (data.puntaje === undefined || data.total_preguntas === undefined) {
        errors.push('puntaje y total_preguntas son requeridos');
    } else {
        const punt = Number(data.puntaje);
        const total = Number(data.total_preguntas);
        if (isNaN(punt) || punt < 0) errors.push('puntaje debe ser un número >= 0');
        if (isNaN(total) || total <= 0) errors.push('total_preguntas debe ser un número > 0');
        if (!isNaN(punt) && !isNaN(total) && punt > total) errors.push('puntaje no puede ser mayor que total_preguntas');
        parsed.puntaje = isNaN(punt) ? null : Math.floor(punt);
        parsed.total_preguntas = isNaN(total) ? null : Math.floor(total);
    }

    // xp (opcional)
    if (data.xp !== undefined && data.xp !== null && data.xp !== '') {
        const x = Number(data.xp);
        if (isNaN(x) || x < 0) errors.push('xp debe ser un número >= 0');
        else parsed.xp = Math.round(x);
    }

    // energia (opcional)
    if (data.energia !== undefined && data.energia !== null && data.energia !== '') {
        const e = Number(data.energia);
        if (isNaN(e) || e < 0) errors.push('energia debe ser un número >= 0');
        else parsed.energia = Math.max(0, Math.floor(e));
    }

    // energia_costo (opcional)
    if (data.energia_costo !== undefined && data.energia_costo !== null && data.energia_costo !== '') {
        const ec = Number(data.energia_costo);
        if (isNaN(ec) || ec < 0) errors.push('energia_costo debe ser un número >= 0');
        else parsed.energia_costo = Math.max(0, Math.floor(ec));
    }

    // ultima_leccion_fecha (opcional) - aceptar YYYY-MM-DD o ISO
    if (data.ultima_leccion_fecha !== undefined && data.ultima_leccion_fecha !== null && data.ultima_leccion_fecha !== '') {
        const d = new Date(data.ultima_leccion_fecha);
        if (isNaN(d)) errors.push('ultima_leccion_fecha no es una fecha válida');
        else parsed.ultima_leccion_fecha = d.toISOString().split('T')[0];
    }

    // moduloId (opcional)
    if (data.moduloId !== undefined && data.moduloId !== null && data.moduloId !== '') {
        const m = Number(data.moduloId);
        if (isNaN(m) || m <= 0) errors.push('moduloId debe ser un entero positivo');
        else parsed.moduloId = Math.floor(m);
    }

    return {
        valid: errors.length === 0,
        errors,
        parsed
    };
}

// =====================================================
// EXPORTAR FUNCIONES
// =====================================================
module.exports = {
    isValidEmail,
    isValidPassword,
    isValidNumber,
    isPositiveNumber,
    isValidName,
    sanitizeString,
    validateRegistrationData,
    validateLoginData,
    validateCalculatorInput,
    validateLessonCompletion,
};