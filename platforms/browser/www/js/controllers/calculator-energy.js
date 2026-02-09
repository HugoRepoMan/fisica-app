let mode = 'kinetic';
let gravity = 9.81;

function goBack() { window.location.href = 'calculators.html'; }

function updateGuide() {
    const guides = {
        kinetic: [
            '<div><span>1️⃣</span> Ingresa la masa del objeto (kg)</div>',
            '<div><span>2️⃣</span> Ingresa su velocidad (m/s)</div>',
            '<div><span>3️⃣</span> Presiona "Calcular"</div>',
            '<div><span>💡</span> Energía Cinética = movimiento</div>'
        ],
        potential: [
            '<div><span>1️⃣</span> Selecciona el planeta/gravedad</div>',
            '<div><span>2️⃣</span> Ingresa masa (kg) y altura (m)</div>',
            '<div><span>3️⃣</span> Presiona "Calcular"</div>',
            '<div><span>💡</span> Energía Potencial = posición</div>'
        ],
        work: [
            '<div><span>1️⃣</span> Ingresa la fuerza aplicada (N)</div>',
            '<div><span>2️⃣</span> Ingresa distancia (m) y ángulo (°)</div>',
            '<div><span>3️⃣</span> Presiona "Calcular"</div>',
            '<div><span>💡</span> Trabajo = Fuerza × Distancia</div>'
        ]
    };
    document.getElementById('guideSteps').innerHTML = guides[mode].join('');
}

function setMode(m) {
    mode = m;
    document.querySelectorAll('.tab').forEach((t,i) => t.classList.toggle('active', (m==='kinetic'&&i===0)||(m==='potential'&&i===1)||(m==='work'&&i===2)));
    
    const formulas = {kinetic: 'Ec = ½mv²', potential: 'Ep = mgh', work: 'W = F·d·cos(θ)'};
    document.getElementById('formula').textContent = formulas[m];
    
    // Mostrar selector de gravedad solo en potencial
    document.getElementById('gravitySelector').classList.toggle('hidden', m !== 'potential');
    
    let html = '';
    if (m === 'kinetic') {
        html = `
            <div class="section-title">⚡ Energía Cinética</div>
            <p class="section-help">Energía del movimiento</p>
            <div class="input-group">
                <label>Masa (kg)
                    <span class="hint-icon" title="Peso del objeto">?</span>
                </label>
                <p class="input-hint">¿Cuánto pesa el objeto en kilogramos?</p>
                <input type="number" id="m" step="0.01" placeholder="ej. 10">
            </div>
            <div class="input-group">
                <label>Velocidad (m/s)
                    <span class="hint-icon" title="Qué tan rápido se mueve">?</span>
                </label>
                <p class="input-hint">¿Qué tan rápido se está moviendo?</p>
                <input type="number" id="v" step="0.01" placeholder="ej. 5">
            </div>
        `;
    } else if (m === 'potential') {
        html = `
            <div class="section-title">📍 Energía Potencial</div>
            <p class="section-help">Energía por estar en altura</p>
            <div class="input-group">
                <label>Masa (kg)
                    <span class="hint-icon" title="Peso del objeto">?</span>
                </label>
                <p class="input-hint">¿Cuánto pesa el objeto?</p>
                <input type="number" id="m" step="0.01" placeholder="ej. 10">
            </div>
            <div class="input-group">
                <label>Altura (m)
                    <span class="hint-icon" title="Qué tan alto está">?</span>
                </label>
                <p class="input-hint">¿A qué altura se encuentra?</p>
                <input type="number" id="h" step="0.01" placeholder="ej. 20">
            </div>
        `;
    } else {
        html = `
            <div class="section-title">💪 Trabajo</div>
            <p class="section-help">Energía transferida por una fuerza</p>
            <div class="input-group">
                <label>Fuerza (N)
                    <span class="hint-icon" title="Fuerza aplicada">?</span>
                </label>
                <p class="input-hint">¿Cuántos Newtons de fuerza aplicas?</p>
                <input type="number" id="f" step="0.01" placeholder="ej. 100">
            </div>
            <div class="input-group">
                <label>Distancia (m)
                    <span class="hint-icon" title="Espacio recorrido">?</span>
                </label>
                <p class="input-hint">¿Qué distancia desplazas el objeto?</p>
                <input type="number" id="d" step="0.01" placeholder="ej. 5">
            </div>
            <div class="input-group">
                <label>Ángulo (°)
                    <span class="hint-icon" title="Ángulo entre fuerza y movimiento">?</span>
                </label>
                <p class="input-hint">Ángulo entre fuerza y movimiento (0°=paralelio)</p>
                <input type="number" id="a" value="0" step="1" placeholder="ej. 0">
            </div>
        `;
    }
    document.getElementById('inputs').innerHTML = html;
    updateGuide();
    clearAll();
}

function changeGravity() {
    gravity = parseFloat(document.getElementById('gravitySelect').value) || 9.81;
    clearAll();
}

function calculate() {
    let result = 0, label = '';
    const showInvalid = () => {
        document.getElementById('results').innerHTML = `<h3 class="results-title">❌ Resultado</h3><div class="result-item"><span class="result-label">Error</span><span class="result-value">Ingresa valores válidos</span></div>`;
        document.getElementById('results').classList.remove('hidden');
    };

    if (mode === 'kinetic') {
        const m = parseFloat(document.getElementById('m').value);
        const v = parseFloat(document.getElementById('v').value);
        if (isNaN(m) || isNaN(v)) { showInvalid(); return; }
        result = 0.5 * m * v * v;
        label = '⚡ Energía Cinética';
    } else if (mode === 'potential') {
        const m = parseFloat(document.getElementById('m').value);
        const h = parseFloat(document.getElementById('h').value);
        if (isNaN(m) || isNaN(h)) { showInvalid(); return; }
        result = m * gravity * h;
        label = '📍 Energía Potencial';
    } else {
        const f = parseFloat(document.getElementById('f').value);
        const d = parseFloat(document.getElementById('d').value);
        const a = parseFloat(document.getElementById('a').value) || 0;
        if (isNaN(f) || isNaN(d)) { showInvalid(); return; }
        result = f * d * Math.cos(a * Math.PI / 180);
        label = '💪 Trabajo';
    }
    document.getElementById('results').innerHTML = `<h3 class="results-title">✅ Resultado</h3><div class="result-item"><span class="result-label">${label}</span><span class="result-value">${result.toFixed(2)} J</span></div>`;
    document.getElementById('results').classList.remove('hidden');
}

function clearAll() {
    document.querySelectorAll('input').forEach(i => i.value = i.id==='a'?'0':'');
    document.getElementById('results').classList.add('hidden');
    gravity = parseFloat(document.getElementById('gravitySelect')?.value) || 9.81;
}

setMode('kinetic');
