let mode = 'momentum';

function goBack() { window.location.href = 'calculators.html'; }

function updateGuide() {
    const guides = {
        momentum: [
            '<div><span>1️⃣</span> Ingresa la masa del objeto (kg)</div>',
            '<div><span>2️⃣</span> Ingresa su velocidad (m/s)</div>',
            '<div><span>3️⃣</span> Presiona "Calcular"</div>',
            '<div><span>💡</span> Momentum = "cantidad de movimiento"</div>'
        ],
        impulse: [
            '<div><span>1️⃣</span> Ingresa la fuerza aplicada (N)</div>',
            '<div><span>2️⃣</span> Ingresa el tiempo (s)</div>',
            '<div><span>3️⃣</span> Presiona "Calcular"</div>',
            '<div><span>💡</span> Impulso = cambio en momentum</div>'
        ]
    };
    document.getElementById('guideSteps').innerHTML = guides[mode].join('');
}

function setMode(m) {
    mode = m;
    document.querySelectorAll('.tab').forEach((t,i) => t.classList.toggle('active', (m==='momentum'&&i===0)||(m==='impulse'&&i===1)));
    const formulas = {momentum: 'p = mv', impulse: 'J = F·Δt'};
    document.getElementById('formula').textContent = formulas[m];
    
    let html = '';
    if (m === 'momentum') {
        html = `
            <div class="section-title">🎯 Momentum (Cantidad de Movimiento)</div>
            <p class="section-help">Mide cuánto movimiento tiene un objeto</p>
            <div class="input-group">
                <label>Masa (kg)
                    <span class="hint-icon" title="Peso del objeto">?</span>
                </label>
                <p class="input-hint">¿Cuánto pesa el objeto en kilogramos?</p>
                <input type="number" id="m" step="0.01" placeholder="ej. 5">
            </div>
            <div class="input-group">
                <label>Velocidad (m/s)
                    <span class="hint-icon" title="Qué tan rápido se mueve">?</span>
                </label>
                <p class="input-hint">¿Qué tan rápido se está moviendo?</p>
                <input type="number" id="v" step="0.01" placeholder="ej. 10">
            </div>
            <div class="section-help" style="margin-top:12px; background:#fef3c7; padding:12px; border-radius:8px; border-left:3px solid #ca8a04;">
                📝 Un objeto pesado moviendo rápido tiene más momentum que uno ligero lento.
            </div>
        `;
    } else {
        html = `
            <div class="section-title">⚡ Impulso (Cambio de Momentum)</div>
            <p class="section-help">Efecto de una fuerza aplicada por tiempo</p>
            <div class="input-group">
                <label>Fuerza (N)
                    <span class="hint-icon" title="Fuerza aplicada">?</span>
                </label>
                <p class="input-hint">¿Cuán fuerte empujas o tiras?</p>
                <input type="number" id="f" step="0.01" placeholder="ej. 100">
            </div>
            <div class="input-group">
                <label>Tiempo (s)
                    <span class="hint-icon" title="Duración de la fuerza">?</span>
                </label>
                <p class="input-hint">¿Cuántos segundos aplicas la fuerza?</p>
                <input type="number" id="t" step="0.01" placeholder="ej. 2">
            </div>
            <div class="section-help" style="margin-top:12px; background:#d1fae5; padding:12px; border-radius:8px; border-left:3px solid #059669;">
                📝 Más fuerza + más tiempo = mayor cambio de movimiento
            </div>
        `;
    }
    document.getElementById('inputs').innerHTML = html;
    updateGuide();
    clearAll();
}

function calculate() {
    let result = 0, label = '';
    const showInvalid = () => {
        document.getElementById('results').innerHTML = `<h3 class="results-title">❌ Resultado</h3><div class="result-item"><span class="result-label">Error</span><span class="result-value">Ingresa valores válidos</span></div>`;
        document.getElementById('results').classList.remove('hidden');
    };

    if (mode === 'momentum') {
        const m = parseFloat(document.getElementById('m').value);
        const v = parseFloat(document.getElementById('v').value);
        if (isNaN(m) || isNaN(v)) { showInvalid(); return; }
        result = m * v;
        label = '🎯 Momentum';
    } else {
        const f = parseFloat(document.getElementById('f').value);
        const t = parseFloat(document.getElementById('t').value);
        if (isNaN(f) || isNaN(t)) { showInvalid(); return; }
        result = f * t;
        label = '⚡ Impulso';
    }
    document.getElementById('results').innerHTML = `<h3 class="results-title">✅ Resultado</h3><div class="result-item"><span class="result-label">${label}</span><span class="result-value">${result.toFixed(2)} kg·m/s</span></div>`;
    document.getElementById('results').classList.remove('hidden');
}

function clearAll() {
    document.querySelectorAll('input').forEach(i => i.value = '');
    document.getElementById('results').classList.add('hidden');
}

setMode('momentum');
