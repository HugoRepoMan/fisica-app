// calculator-unified.js

// Estado global
const state = {
    planeType: 'horizontal', // 'horizontal' | 'inclined'
    hasFriction: false,
    direction: 'horizontal', // 'horizontal' | 'up' | 'down'
    showConfig: false
};

// Constantes físicas
const GRAVITY = 9.81;

// Funciones de navegación
function goBack() {
    window.location.href = 'calculators.html';
}

// Toggle panel de configuración
function toggleConfig() {
    state.showConfig = !state.showConfig;
    const panel = document.getElementById('configPanel');
    panel.classList.toggle('hidden');
}

// Cambiar tipo de plano
function setPlaneType(type) {
    state.planeType = type;
    
    // Actualizar tabs
    document.querySelectorAll('[data-plane]').forEach(btn => {
        btn.classList.toggle('active', btn.dataset.plane === type);
    });
    
    // Mostrar/ocultar grupo de ángulo
    const angleGroup = document.getElementById('angleGroup');
    angleGroup.classList.toggle('hidden', type === 'horizontal');
    
    // Actualizar opciones de dirección
    const upBtn = document.querySelector('[data-direction="up"]');
    const downBtn = document.querySelector('[data-direction="down"]');
    
    if (type === 'inclined') {
        upBtn.classList.remove('hidden');
        downBtn.classList.remove('hidden');
    } else {
        upBtn.classList.add('hidden');
        downBtn.classList.add('hidden');
        state.direction = 'horizontal';
        document.querySelectorAll('[data-direction]').forEach(btn => {
            btn.classList.toggle('active', btn.dataset.direction === 'horizontal');
        });
    }
    
    updateSummary();
    clearResults();
}

// Toggle rozamiento
function toggleFriction() {
    state.hasFriction = document.getElementById('frictionCheck').checked;
    const coeffGroup = document.getElementById('coefficientGroup');
    coeffGroup.classList.toggle('hidden', !state.hasFriction);
    updateSummary();
    clearResults();
}

// Cambiar dirección
function setDirection(dir) {
    state.direction = dir;
    
    document.querySelectorAll('[data-direction]').forEach(btn => {
        btn.classList.toggle('active', btn.dataset.direction === dir);
    });
    
    updateSummary();
    clearResults();
}

// Actualizar resumen de configuración
function updateSummary() {
    document.getElementById('summaryPlane').textContent = 
        state.planeType === 'horizontal' ? 'Horizontal' : 'Inclinado';
    
    document.getElementById('summaryFriction').textContent = 
        state.hasFriction ? 'Sí' : 'No';
    
    const directionText = {
        'horizontal': 'Horizontal',
        'up': 'Subida',
        'down': 'Bajada'
    };
    document.getElementById('summaryDirection').textContent = directionText[state.direction];
}

// Validar inputs
function validateInputs() {
    let isValid = true;
    clearErrors();
    
    // Validar masa
    const mass = parseFloat(document.getElementById('massInput').value);
    if (!mass || mass <= 0) {
        showError('massError', 'La masa debe ser mayor a 0');
        isValid = false;
    }
    
    // Validar ángulo (si plano inclinado)
    if (state.planeType === 'inclined') {
        const angle = parseFloat(document.getElementById('angleInput').value);
        if (!angle || angle <= 0 || angle >= 90) {
            showError('angleError', 'El ángulo debe estar entre 0 y 90 grados');
            isValid = false;
        }
    }
    
    // Validar coeficiente (si hay fricción)
    if (state.hasFriction) {
        const coeff = parseFloat(document.getElementById('coefficientInput').value);
        if (coeff === null || coeff === undefined || coeff < 0 || coeff > 1) {
            showError('coefficientError', 'El coeficiente debe estar entre 0 y 1');
            isValid = false;
        }
    }
    
    // Validar fuerza aplicada
    const force = parseFloat(document.getElementById('forceInput').value);
    if (force === null || force === undefined || force < 0) {
        showError('forceError', 'La fuerza debe ser mayor o igual a 0');
        isValid = false;
    }
    
    return isValid;
}

// Mostrar error
function showError(elementId, message) {
    const errorElement = document.getElementById(elementId);
    errorElement.textContent = message;
    
    const inputId = elementId.replace('Error', 'Input');
    const inputElement = document.getElementById(inputId);
    inputElement.classList.add('error');
}

// Limpiar errores
function clearErrors() {
    document.querySelectorAll('.error-message').forEach(el => {
        el.textContent = '';
    });
    document.querySelectorAll('.input-field').forEach(el => {
        el.classList.remove('error');
    });
}

// Calcular
function calculate() {
    if (!validateInputs()) {
        return;
    }
    
    // Obtener valores
    const mass = parseFloat(document.getElementById('massInput').value);
    const angle = state.planeType === 'inclined' ? 
        parseFloat(document.getElementById('angleInput').value) : 0;
    const angleRad = (angle * Math.PI) / 180;
    const coefficient = state.hasFriction ? 
        parseFloat(document.getElementById('coefficientInput').value) : 0;
    const appliedForce = parseFloat(document.getElementById('forceInput').value) || 0;
    
    // Calcular componentes del peso
    const weight = mass * GRAVITY;
    const weightParallel = state.planeType === 'inclined' ? 
        weight * Math.sin(angleRad) : 0;
    const weightPerpendicular = state.planeType === 'inclined' ? 
        weight * Math.cos(angleRad) : weight;
    
    // Fuerza normal
    const normalForce = weightPerpendicular;
    
    // Fuerza de fricción
    const frictionForce = state.hasFriction ? coefficient * normalForce : 0;
    
    // Calcular fuerza neta según configuración
    let netForce = 0;
    
    if (state.planeType === 'horizontal') {
        netForce = appliedForce - frictionForce;
    } else {
        // Plano inclinado
        if (state.direction === 'up') {
            netForce = appliedForce - weightParallel - frictionForce;
        } else if (state.direction === 'down') {
            netForce = weightParallel - frictionForce - appliedForce;
        } else {
            // horizontal en plano inclinado
            netForce = appliedForce - frictionForce;
        }
    }
    
    // Aceleración
    const acceleration = netForce / mass;
    
    // Guardar resultados en el estado para el diagrama
    state.results = {
        weight,
        weightParallel,
        weightPerpendicular,
        normalForce,
        frictionForce,
        netForce,
        acceleration,
        mass,
        angle,
        appliedForce
    };
    
    // Mostrar resultados
    displayResults();
}

// Mostrar resultados
function displayResults() {
    const { weight, weightParallel, weightPerpendicular, normalForce, 
            frictionForce, netForce, acceleration } = state.results;
    
    // Actualizar valores
    document.getElementById('resultWeight').textContent = `${weight.toFixed(2)} N`;
    document.getElementById('resultNormal').textContent = `${normalForce.toFixed(2)} N`;
    document.getElementById('resultNetForce').textContent = `${netForce.toFixed(2)} N`;
    document.getElementById('resultAcceleration').textContent = `${acceleration.toFixed(2)} m/s²`;
    
    // Mostrar/ocultar componentes según configuración
    if (state.planeType === 'inclined') {
        document.getElementById('resultWeightParallelItem').classList.remove('hidden');
        document.getElementById('resultWeightPerpendicularItem').classList.remove('hidden');
        document.getElementById('resultWeightParallel').textContent = `${weightParallel.toFixed(2)} N`;
        document.getElementById('resultWeightPerpendicular').textContent = `${weightPerpendicular.toFixed(2)} N`;
    } else {
        document.getElementById('resultWeightParallelItem').classList.add('hidden');
        document.getElementById('resultWeightPerpendicularItem').classList.add('hidden');
    }
    
    if (state.hasFriction) {
        document.getElementById('resultFrictionItem').classList.remove('hidden');
        document.getElementById('resultFriction').textContent = `${frictionForce.toFixed(2)} N`;
    } else {
        document.getElementById('resultFrictionItem').classList.add('hidden');
    }
    
    // Mostrar card de resultados
    document.getElementById('resultsCard').classList.remove('hidden');
    
    // Scroll suave hacia resultados
    document.getElementById('resultsCard').scrollIntoView({ 
        behavior: 'smooth', 
        block: 'nearest' 
    });
}

// Limpiar resultados
function clearResults() {
    document.getElementById('resultsCard').classList.add('hidden');
    state.results = null;
}

// Limpiar inputs
function clearInputs() {
    document.getElementById('massInput').value = '';
    document.getElementById('angleInput').value = '30';
    document.getElementById('coefficientInput').value = '0.3';
    document.getElementById('forceInput').value = '';
    clearErrors();
    clearResults();
}

// Mostrar diagrama
function showDiagram() {
    if (!state.results) return;
    
    document.getElementById('diagramModal').classList.remove('hidden');
    drawDiagram();
    
    // Reinicializar iconos
    if (window.lucide) {
        lucide.createIcons();
    }
}

// Cerrar diagrama
function closeDiagram() {
    document.getElementById('diagramModal').classList.add('hidden');
}

// Dibujar diagrama en canvas
function drawDiagram() {
    const canvas = document.getElementById('diagramCanvas');
    const ctx = canvas.getContext('2d');
    const { width, height } = canvas;
    
    // Limpiar canvas
    ctx.clearRect(0, 0, width, height);
    ctx.fillStyle = '#f9fafb';
    ctx.fillRect(0, 0, width, height);
    
    const centerX = width / 2;
    const centerY = height / 2;
    const { weight, weightParallel, weightPerpendicular, normalForce, 
            frictionForce, appliedForce, angle } = state.results;
    
    // Escala para los vectores
    const scale = 50 / Math.max(weight, normalForce, appliedForce, frictionForce, 1);
    
    // Dibujar plano
    ctx.save();
    ctx.translate(centerX, centerY);
    
    if (state.planeType === 'inclined') {
        ctx.rotate((-angle * Math.PI) / 180);
    }
    
    // Plano
    ctx.fillStyle = '#e5e7eb';
    ctx.fillRect(-150, 20, 300, 40);
    
    // Objeto (cubo)
    ctx.fillStyle = '#6366f1';
    ctx.fillRect(-30, -30, 60, 50);
    ctx.strokeStyle = '#4f46e5';
    ctx.lineWidth = 2;
    ctx.strokeRect(-30, -30, 60, 50);
    
    // Restablecer rotación
    ctx.restore();
    
    // Dibujar vectores
    drawVector(ctx, centerX, centerY - 10, 0, weight * scale, '#ef4444', 'W', 3);
    drawVector(ctx, centerX, centerY - 10, 0, -normalForce * scale, '#3b82f6', 'N', 3);
    
    if (appliedForce > 0) {
        if (state.direction === 'up' && state.planeType === 'inclined') {
            drawVector(ctx, centerX, centerY - 10, 
                appliedForce * scale * Math.cos((angle * Math.PI) / 180),
                -appliedForce * scale * Math.sin((angle * Math.PI) / 180),
                '#10b981', 'F', 3);
        } else {
            drawVector(ctx, centerX, centerY - 10, appliedForce * scale, 0, '#10b981', 'F', 3);
        }
    }
    
    if (state.hasFriction && frictionForce > 0) {
        drawVector(ctx, centerX, centerY - 10, -frictionForce * scale, 0, '#f59e0b', 'Fr', 3);
    }
    
    // Etiqueta de ángulo
    if (state.planeType === 'inclined') {
        ctx.fillStyle = '#111827';
        ctx.font = '14px sans-serif';
        ctx.fillText(`${angle}°`, centerX + 40, centerY + 40);
    }
}

// Función auxiliar para dibujar vectores
function drawVector(ctx, x, y, dx, dy, color, label, width = 2) {
    ctx.save();
    ctx.strokeStyle = color;
    ctx.fillStyle = color;
    ctx.lineWidth = width;
    
    // Línea
    ctx.beginPath();
    ctx.moveTo(x, y);
    ctx.lineTo(x + dx, y + dy);
    ctx.stroke();
    
    // Flecha
    const angle = Math.atan2(dy, dx);
    const headlen = 10;
    ctx.beginPath();
    ctx.moveTo(x + dx, y + dy);
    ctx.lineTo(
        x + dx - headlen * Math.cos(angle - Math.PI / 6),
        y + dy - headlen * Math.sin(angle - Math.PI / 6)
    );
    ctx.lineTo(
        x + dx - headlen * Math.cos(angle + Math.PI / 6),
        y + dy - headlen * Math.sin(angle + Math.PI / 6)
    );
    ctx.closePath();
    ctx.fill();
    
    // Label
    ctx.font = 'bold 14px sans-serif';
    ctx.fillText(label, x + dx + 10, y + dy);
    
    ctx.restore();
}

// Inicializar
document.addEventListener('DOMContentLoaded', () => {
    updateSummary();
});
