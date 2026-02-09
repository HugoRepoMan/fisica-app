// CALCULADORA UNIFICADA - VERSIÓN CORREGIDA
// Diagrama con etiquetas bien posicionadas

const state = {
    planeType: 'horizontal',
    hasFriction: false,
    direction: 'horizontal',
    showConfig: false,
    results: null
};

const GRAVITY = 9.81;

function goBack() {
    window.location.href = 'calculators.html';
}

function toggleConfig() {
    state.showConfig = !state.showConfig;
    document.getElementById('configPanel').classList.toggle('hidden');
    setTimeout(() => {
        if (window.lucide) lucide.createIcons();
    }, 100);
}

function setPlaneType(type) {
    state.planeType = type;
    document.querySelectorAll('[data-plane]').forEach(btn => {
        btn.classList.toggle('active', btn.dataset.plane === type);
    });
    document.getElementById('angleGroup').classList.toggle('hidden', type === 'horizontal');
    
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
    if (window.lucide) lucide.createIcons();
}

function toggleFriction() {
    state.hasFriction = document.getElementById('frictionCheck').checked;
    document.getElementById('coefficientGroup').classList.toggle('hidden', !state.hasFriction);
    updateSummary();
    clearResults();
}

function setDirection(dir) {
    state.direction = dir;
    document.querySelectorAll('[data-direction]').forEach(btn => {
        btn.classList.toggle('active', btn.dataset.direction === dir);
    });
    updateSummary();
    clearResults();
}

function updateSummary() {
    document.getElementById('summaryPlane').textContent = 
        state.planeType === 'horizontal' ? 'Horizontal' : 'Inclinado';
    document.getElementById('summaryFriction').textContent = 
        state.hasFriction ? 'Sí' : 'No';
    const dirMap = { horizontal: 'Horizontal', up: 'Subida', down: 'Bajada' };
    document.getElementById('summaryDirection').textContent = dirMap[state.direction];
}

function validateInputs() {
    clearErrors();
    let isValid = true;
    
    const mass = parseFloat(document.getElementById('massInput').value);
    if (!mass || mass <= 0) {
        showError('massError', 'La masa debe ser mayor a 0');
        isValid = false;
    }
    
    if (state.planeType === 'inclined') {
        const angle = parseFloat(document.getElementById('angleInput').value);
        if (!angle || angle <= 0 || angle >= 90) {
            showError('angleError', 'El ángulo debe estar entre 0° y 90°');
            isValid = false;
        }
    }
    
    if (state.hasFriction) {
        const coeff = parseFloat(document.getElementById('coefficientInput').value);
        if (coeff === null || coeff === undefined || coeff < 0 || coeff > 1) {
            showError('coefficientError', 'El coeficiente debe estar entre 0 y 1');
            isValid = false;
        }
    }
    
    const force = parseFloat(document.getElementById('forceInput').value);
    if (force === null || force === undefined || force < 0) {
        showError('forceError', 'La fuerza debe ser mayor o igual a 0');
        isValid = false;
    }
    
    return isValid;
}

function showError(elementId, message) {
    document.getElementById(elementId).textContent = message;
    const inputId = elementId.replace('Error', 'Input');
    document.getElementById(inputId).classList.add('error');
}

function clearErrors() {
    document.querySelectorAll('.error-message').forEach(el => el.textContent = '');
    document.querySelectorAll('.input-field').forEach(el => el.classList.remove('error'));
}

function calculate() {
    if (!validateInputs()) return;
    
    const mass = parseFloat(document.getElementById('massInput').value);
    const angle = state.planeType === 'inclined' ? parseFloat(document.getElementById('angleInput').value) : 0;
    const angleRad = (angle * Math.PI) / 180;
    const coefficient = state.hasFriction ? parseFloat(document.getElementById('coefficientInput').value) : 0;
    const appliedForce = parseFloat(document.getElementById('forceInput').value) || 0;
    
    const weight = mass * GRAVITY;
    const weightParallel = state.planeType === 'inclined' ? weight * Math.sin(angleRad) : 0;
    const weightPerpendicular = state.planeType === 'inclined' ? weight * Math.cos(angleRad) : weight;
    const normalForce = weightPerpendicular;
    const frictionForce = state.hasFriction ? coefficient * normalForce : 0;
    
    let netForce = 0;
    if (state.planeType === 'horizontal') {
        netForce = appliedForce - frictionForce;
    } else {
        if (state.direction === 'up') {
            netForce = appliedForce - weightParallel - frictionForce;
        } else if (state.direction === 'down') {
            netForce = weightParallel - frictionForce - appliedForce;
        } else {
            netForce = appliedForce - frictionForce;
        }
    }
    
    const acceleration = netForce / mass;
    
    state.results = {
        weight, weightParallel, weightPerpendicular, normalForce,
        frictionForce, netForce, acceleration, mass, angle, appliedForce
    };
    
    displayResults();
}

function displayResults() {
    const { weight, weightParallel, weightPerpendicular, normalForce, frictionForce, netForce, acceleration } = state.results;
    
    document.getElementById('resultWeight').textContent = `${weight.toFixed(2)} N`;
    document.getElementById('resultNormal').textContent = `${normalForce.toFixed(2)} N`;
    document.getElementById('resultNetForce').textContent = `${netForce.toFixed(2)} N`;
    document.getElementById('resultAcceleration').textContent = `${acceleration.toFixed(2)} m/s²`;
    
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
    
    document.getElementById('resultsCard').classList.remove('hidden');
    document.getElementById('resultsCard').scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    
    if (window.lucide) lucide.createIcons();
}

function clearResults() {
    document.getElementById('resultsCard').classList.add('hidden');
    state.results = null;
}

function clearInputs() {
    document.getElementById('massInput').value = '';
    document.getElementById('angleInput').value = '30';
    document.getElementById('coefficientInput').value = '0.3';
    document.getElementById('forceInput').value = '';
    clearErrors();
    clearResults();
}

function showDiagram() {
    if (!state.results) return;
    document.getElementById('diagramModal').classList.remove('hidden');
    setTimeout(() => {
        drawDiagram();
        if (window.lucide) lucide.createIcons();
    }, 100);
}

function closeDiagram() {
    document.getElementById('diagramModal').classList.add('hidden');
}

// DIAGRAMA MEJORADO - ETIQUETAS BIEN SEPARADAS
function drawDiagram() {
    const canvas = document.getElementById('diagramCanvas');
    // Ajustar tamaño del canvas para ser responsivo y compatible con devicePixelRatio
    const rect = canvas.getBoundingClientRect();
    const dpr = window.devicePixelRatio || 1;
    canvas.width = Math.round(rect.width * dpr);
    canvas.height = Math.round(rect.height * dpr);
    const ctx = canvas.getContext('2d');
    // Mapear el sistema de coordenadas a CSS pixels para mantener fuentes y medidas coherentes
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    const width = rect.width;
    const height = rect.height;
    ctx.clearRect(0, 0, width, height);
    // cajas de etiquetas para evitar solapamientos
    window._diagramLabelBoxes = [];
    
    // Fondo
    const gradient = ctx.createLinearGradient(0, 0, 0, height);
    gradient.addColorStop(0, '#ffffff');
    gradient.addColorStop(1, '#f9fafb');
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, width, height);
    
    const centerX = width / 2;
    const centerY = height / 2;
    const { weight, weightParallel, weightPerpendicular, normalForce, frictionForce, appliedForce, angle } = state.results;
    
    // Escala
    const maxForce = Math.max(weight, normalForce, appliedForce, frictionForce, 1);
    const scale = Math.min(150 / maxForce, 3);
    
    ctx.save();
    ctx.translate(centerX, centerY);
    
    // PLANO
    if (state.planeType === 'inclined') {
        ctx.save();
        ctx.rotate((-angle * Math.PI) / 180);
        
        ctx.fillStyle = '#e5e7eb';
        ctx.fillRect(-250, 30, 500, 50);
        ctx.strokeStyle = '#9ca3af';
        ctx.lineWidth = 3;
        ctx.strokeRect(-250, 30, 500, 50);
        
        ctx.restore();
        
        // Arco del ángulo
        ctx.beginPath();
        ctx.arc(80, 10, 50, -angle * Math.PI / 180, 0, false);
        ctx.strokeStyle = '#6366f1';
        ctx.lineWidth = 2;
        ctx.setLineDash([5, 5]);
        ctx.stroke();
        ctx.setLineDash([]);
        
        ctx.fillStyle = '#6366f1';
        ctx.font = 'bold 20px Arial';
        ctx.fillText(`${angle}°`, 140, 20);
    } else {
        ctx.fillStyle = '#e5e7eb';
        ctx.fillRect(-250, 30, 500, 50);
        ctx.strokeStyle = '#9ca3af';
        ctx.lineWidth = 3;
        ctx.strokeRect(-250, 30, 500, 50);
    }
    
    // OBJETO 3D
    ctx.save();
    if (state.planeType === 'inclined') {
        ctx.rotate((-angle * Math.PI) / 180);
    }
    
    // Sombra
    ctx.fillStyle = 'rgba(0, 0, 0, 0.1)';
    ctx.fillRect(-38, -35, 76, 70);
    
    // Cubo 3D
    const cubeGrad = ctx.createLinearGradient(-35, -50, -35, 30);
    cubeGrad.addColorStop(0, '#8b5cf6');
    cubeGrad.addColorStop(1, '#6366f1');
    ctx.fillStyle = cubeGrad;
    ctx.fillRect(-35, -50, 70, 80);
    
    ctx.fillStyle = '#a78bfa';
    ctx.beginPath();
    ctx.moveTo(-35, -50);
    ctx.lineTo(-20, -65);
    ctx.lineTo(50, -65);
    ctx.lineTo(35, -50);
    ctx.closePath();
    ctx.fill();
    
    ctx.fillStyle = '#7c3aed';
    ctx.beginPath();
    ctx.moveTo(35, -50);
    ctx.lineTo(50, -65);
    ctx.lineTo(50, 15);
    ctx.lineTo(35, 30);
    ctx.closePath();
    ctx.fill();
    
    ctx.strokeStyle = '#5b21b6';
    ctx.lineWidth = 3;
    ctx.strokeRect(-35, -50, 70, 80);
    
    ctx.restore();
    
    const objY = state.planeType === 'inclined' ? -15 : -10;
    
    // VECTORES CON POSICIONES INTELIGENTES PARA ETIQUETAS
    
    // Peso (hacia abajo)
    drawVectorWithSmartLabel(ctx, 0, objY, 0, weight * scale, '#ef4444', `W = ${weight.toFixed(1)}N`, 4, 'bottom');
    
    // Normal (hacia arriba)
    drawVectorWithSmartLabel(ctx, 0, objY, 0, -normalForce * scale, '#3b82f6', `N = ${normalForce.toFixed(1)}N`, 4, 'top');
    
    if (state.planeType === 'inclined') {
        const angleRad = angle * Math.PI / 180;
        
        // Peso paralelo
        drawVectorWithSmartLabel(ctx, 0, objY,
            weightParallel * scale * Math.cos(angleRad),
            weightParallel * scale * Math.sin(angleRad),
            '#f97316', `W∥ = ${weightParallel.toFixed(1)}N`, 3, 'right', true);
        
        // Peso perpendicular
        drawVectorWithSmartLabel(ctx, 0, objY,
            -weightPerpendicular * scale * Math.sin(angleRad),
            weightPerpendicular * scale * Math.cos(angleRad),
            '#fb923c', `W⊥ = ${weightPerpendicular.toFixed(1)}N`, 3, 'left', true);
    }
    
    if (appliedForce > 0) {
        let fx = 0, fy = 0, labelPos = 'right';
        if (state.planeType === 'inclined') {
            const angleRad = angle * Math.PI / 180;
            if (state.direction === 'up') {
                fx = appliedForce * scale * Math.cos(angleRad);
                fy = -appliedForce * scale * Math.sin(angleRad);
                labelPos = 'right';
            } else if (state.direction === 'down') {
                fx = -appliedForce * scale * Math.cos(angleRad);
                fy = appliedForce * scale * Math.sin(angleRad);
                labelPos = 'left';
            } else {
                fx = appliedForce * scale;
                fy = 0;
                labelPos = 'right';
            }
        } else {
            fx = appliedForce * scale;
            fy = 0;
            labelPos = 'right';
        }
        drawVectorWithSmartLabel(ctx, 0, objY, fx, fy, '#10b981', `F = ${appliedForce.toFixed(1)}N`, 4, labelPos);
    }
    
    if (state.hasFriction && frictionForce > 0) {
        drawVectorWithSmartLabel(ctx, 0, objY, -frictionForce * scale, 0, '#f59e0b', `Fr = ${frictionForce.toFixed(1)}N`, 4, 'left');
    }
    
    // Sistema de coordenadas
    drawCoordinateSystem(ctx, -230, 220);
    
    ctx.restore();
}

// FUNCIÓN MEJORADA PARA DIBUJAR VECTORES CON ETIQUETAS INTELIGENTES
function drawVectorWithSmartLabel(ctx, x, y, dx, dy, color, label, width = 3, labelPosition = 'auto', dashed = false) {
    ctx.save();

    ctx.shadowColor = 'rgba(0, 0, 0, 0.2)';
    ctx.shadowBlur = 4;
    ctx.shadowOffsetX = 2;
    ctx.shadowOffsetY = 2;

    ctx.strokeStyle = color;
    ctx.fillStyle = color;
    ctx.lineWidth = width;

    if (dashed) {
        ctx.setLineDash([8, 4]);
    }

    // Línea del vector
    ctx.beginPath();
    ctx.moveTo(x, y);
    ctx.lineTo(x + dx, y + dy);
    ctx.stroke();
    ctx.setLineDash([]);

    // Flecha
    // Validar valores
    if (!isFinite(dx) || !isFinite(dy)) { ctx.restore(); return; }
    const angle = Math.atan2(dy, dx);
    const len = Math.sqrt(dx * dx + dy * dy);
    // Head length proportional to vector length but clamped
    const headlen = Math.max(8, Math.min(18, len * 0.25));
    // Si el vector es muy pequeño, dibujar una flecha corta desplazada desde el objeto
    if (len < 6) {
        const shortLen = 24;
        const sx = x + Math.cos(angle) * (shortLen * 0.2);
        const sy = y + Math.sin(angle) * (shortLen * 0.2);
        const ex = x + Math.cos(angle) * shortLen;
        const ey = y + Math.sin(angle) * shortLen;
        ctx.beginPath();
        ctx.moveTo(sx, sy);
        ctx.lineTo(ex, ey);
        ctx.stroke();
        // cabeza
        const headlen2 = Math.max(6, Math.min(12, shortLen * 0.25));
        ctx.beginPath();
        ctx.moveTo(ex, ey);
        ctx.lineTo(
            ex - headlen2 * Math.cos(angle - Math.PI / 6),
            ey - headlen2 * Math.sin(angle - Math.PI / 6)
        );
        ctx.lineTo(
            ex - headlen2 * Math.cos(angle + Math.PI / 6),
            ey - headlen2 * Math.sin(angle + Math.PI / 6)
        );
        ctx.closePath();
        ctx.fill();
    } else {
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
    }
    ctx.shadowColor = 'transparent';

    // ETIQUETA CON POSICIONAMIENTO INTELIGENTE
    ctx.font = 'bold 16px Arial';
    const metrics = ctx.measureText(label);
    const padding = 8;

    let labelX, labelY;

    // Calcular posición según el tipo de etiqueta
    if (labelPosition === 'auto') {
        if (Math.abs(dx) > Math.abs(dy)) {
            labelX = x + dx * 0.5;
            labelY = y + dy * 0.5 - 25;
        } else {
            labelX = x + dx * 0.5 + 50;
            labelY = y + dy * 0.5;
        }
    } else {
        const offset = 40;
        switch(labelPosition) {
            case 'top':
                labelX = x + dx * 0.5;
                labelY = y + dy * 0.5 - offset;
                break;
            case 'bottom':
                labelX = x + dx * 0.5;
                labelY = y + dy * 0.5 + offset;
                break;
            case 'right':
                labelX = x + dx * 0.5 + offset;
                labelY = y + dy * 0.5;
                break;
            case 'left':
                labelX = x + dx * 0.5 - offset;
                labelY = y + dy * 0.5;
                break;
            default:
                labelX = x + dx * 0.5;
                labelY = y + dy * 0.5 - 25;
        }
    }

    // Fondo de la etiqueta
    ctx.fillStyle = 'white';
    ctx.strokeStyle = color;
    ctx.lineWidth = 2.5;
    let rectX = labelX - metrics.width / 2 - padding;
    let rectY = labelY - 22;
    const rectW = metrics.width + padding * 2;
    const rectH = 32;

    // Evitar solapamientos con otras etiquetas guardadas en window._diagramLabelBoxes
    if (!window._diagramLabelBoxes) window._diagramLabelBoxes = [];

    const overlaps = (a, b) => {
        return !(a.x + a.w < b.x || a.x > b.x + b.w || a.y + a.h < b.y || a.y > b.y + b.h);
    };

    // Intentos de desplazamiento para evitar colisiones
    const attempts = [
        {dx: 0, dy: 0},
        {dx: 0, dy: -(rectH + 8)},
        {dx: 0, dy: rectH + 8},
        {dx: rectW + 12, dy: 0},
        {dx: -(rectW + 12), dy: 0},
        {dx: rectW + 12, dy: -(rectH + 8)},
        {dx: -(rectW + 12), dy: rectH + 8}
    ];

    let placed = false;
    for (let i = 0; i < attempts.length && !placed; i++) {
        const aX = rectX + attempts[i].dx;
        const aY = rectY + attempts[i].dy;
        const box = { x: aX, y: aY, w: rectW, h: rectH };
        let collision = false;
        for (const other of window._diagramLabelBoxes) {
            if (overlaps(box, other)) { collision = true; break; }
        }
        if (!collision) {
            rectX = aX;
            rectY = aY;
            placed = true;
        }
    }

    // Si aún colisiona, desplazar verticalmente hasta encontrar espacio
    if (!placed) {
        let offsetY = 0;
        for (let i = 0; i < 10; i++) {
            const aY = rectY + (i + 1) * (rectH + 6);
            const box = { x: rectX, y: aY, w: rectW, h: rectH };
            let collision = false;
            for (const other of window._diagramLabelBoxes) {
                if (overlaps(box, other)) { collision = true; break; }
            }
            if (!collision) { rectY = aY; offsetY = (i + 1) * (rectH + 6); break; }
        }
    }

    // Guardar caja de etiqueta
    window._diagramLabelBoxes.push({ x: rectX, y: rectY, w: rectW, h: rectH });

    ctx.beginPath();
    roundRect(ctx, rectX, rectY, rectW, rectH, 8);
    ctx.fill();
    ctx.stroke();

    // Texto de la etiqueta (centrado)
    ctx.fillStyle = color;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    // Asegurar que el texto no sale del canvas (usar coordenadas CSS)
    const canvasW = ctx.canvas.width / (window.devicePixelRatio || 1);
    const cx = Math.max(rectX + rectW / 2, Math.min(rectX + rectW / 2, canvasW - 4));
    ctx.fillText(label, cx, rectY + rectH / 2);
    // Restaurar alineación por si acaso
    ctx.textAlign = 'start';
    ctx.textBaseline = 'alphabetic';

    ctx.restore();
}

function drawCoordinateSystem(ctx, x, y) {
    ctx.save();
    ctx.strokeStyle = '#6b7280';
    ctx.lineWidth = 2.5;
    
    // Eje X
    ctx.beginPath();
    ctx.moveTo(x, y);
    ctx.lineTo(x + 60, y);
    ctx.stroke();
    
    ctx.beginPath();
    ctx.moveTo(x + 60, y);
    ctx.lineTo(x + 52, y - 6);
    ctx.lineTo(x + 52, y + 6);
    ctx.closePath();
    ctx.fillStyle = '#6b7280';
    ctx.fill();
    
    // Eje Y
    ctx.beginPath();
    ctx.moveTo(x, y);
    ctx.lineTo(x, y - 60);
    ctx.stroke();
    
    ctx.beginPath();
    ctx.moveTo(x, y - 60);
    ctx.lineTo(x - 6, y - 52);
    ctx.lineTo(x + 6, y - 52);
    ctx.closePath();
    ctx.fill();
    
    // Etiquetas
    ctx.font = 'bold 16px Arial';
    ctx.fillText('x', x + 72, y + 6);
    ctx.fillText('y', x - 6, y - 72);
    
    ctx.restore();
}

function roundRect(ctx, x, y, width, height, radius) {
    ctx.moveTo(x + radius, y);
    ctx.lineTo(x + width - radius, y);
    ctx.quadraticCurveTo(x + width, y, x + width, y + radius);
    ctx.lineTo(x + width, y + height - radius);
    ctx.quadraticCurveTo(x + width, y + height, x + width - radius, y + height);
    ctx.lineTo(x + radius, y + height);
    ctx.quadraticCurveTo(x, y + height, x, y + height - radius);
    ctx.lineTo(x, y + radius);
    ctx.quadraticCurveTo(x, y, x + radius, y);
}

// Inicializar
document.addEventListener('DOMContentLoaded', () => {
    updateSummary();
    if (window.lucide) lucide.createIcons();
});
