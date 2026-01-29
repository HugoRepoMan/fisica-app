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
    validateCalculatorInput
};