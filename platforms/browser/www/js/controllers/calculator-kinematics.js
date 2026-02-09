let mode = 'mru';

function goBack() { window.location.href = 'calculators.html'; }

function updateGuide() {
    const guides = {
        mru: [
            '<div><span>1️⃣</span> Ingresa la velocidad (m/s)</div>',
            '<div><span>2️⃣</span> Ingresa distancia o tiempo</div>',
            '<div><span>3️⃣</span> Presiona "Calcular"</div>',
            '<div><span>💡</span> El app calcula automáticamente el valor faltante</div>'
        ],
        mruv: [
            '<div><span>1️⃣</span> Ingresa velocidad inicial y final (m/s)</div>',
            '<div><span>2️⃣</span> O ingresa aceleración y tiempo</div>',
            '<div><span>3️⃣</span> Presiona "Calcular"</div>',
            '<div><span>💡</span> Necesitas 3 valores mínimo para calcular</div>'
        ]
    };
    document.getElementById('guideSteps').innerHTML = guides[mode].join('');
}

function setMode(m) {
    mode = m;
    document.querySelectorAll('.tab').forEach((t,i) => t.classList.toggle('active', (m==='mru'&&i===0)||(m==='mruv'&&i===1)));
    document.getElementById('mruInputs').classList.toggle('hidden', m!=='mru');
    document.getElementById('mruvInputs').classList.toggle('hidden', m!=='mruv');
    document.getElementById('formula').textContent = m==='mru' ? 'v = d / t' : 'vf = v₀ + at';
    updateGuide();
    clearAll();
}

function calculate() {
    let html = '<h3 class="results-title">✅ Resultados</h3>';
    if (mode === 'mru') {
        const v = parseFloat(document.getElementById('velocity').value);
        const d = parseFloat(document.getElementById('distance').value);
        const t = parseFloat(document.getElementById('time').value);
        if (!isNaN(v) && !isNaN(d) && v !== 0) {
            html += `<div class="result-item"><span class="result-label">⏱️ Tiempo</span><span class="result-value">${(d/v).toFixed(2)} s</span></div>`;
        } else if (!isNaN(v) && !isNaN(t)) {
            html += `<div class="result-item"><span class="result-label">📏 Distancia</span><span class="result-value">${(v*t).toFixed(2)} m</span></div>`;
        } else if (!isNaN(d) && !isNaN(t) && t !== 0) {
            html += `<div class="result-item"><span class="result-label">🚗 Velocidad</span><span class="result-value">${(d/t).toFixed(2)} m/s</span></div>`;
        } else {
            html += `<div class="result-item"><span class="result-label">❌ Error</span><span class="result-value">Ingresa 2 valores válidos</span></div>`;
        }
    } else {
        const v0 = parseFloat(document.getElementById('v0').value) || 0;
        const vf = parseFloat(document.getElementById('vf').value);
        const a = parseFloat(document.getElementById('acceleration').value);
        const d = parseFloat(document.getElementById('distance2').value);
        const t = parseFloat(document.getElementById('time2').value);
        
        let count = 0;
        if (!isNaN(v0) && v0 !== '') count++;
        if (!isNaN(vf) && vf !== '') count++;
        if (!isNaN(a) && a !== '') count++;
        if (!isNaN(d) && d !== '') count++;
        if (!isNaN(t) && t !== '') count++;
        
        if (count < 3) {
            html += `<div class="result-item"><span class="result-label">❌ Error</span><span class="result-value">Necesitas al menos 3 valores</span></div>`;
        } else {
            if (!isNaN(vf) && !isNaN(a) && a !== 0) html += `<div class="result-item"><span class="result-label">⏱️ Tiempo</span><span class="result-value">${((vf-v0)/a).toFixed(2)} s</span></div>`;
            if (!isNaN(a) && !isNaN(t)) html += `<div class="result-item"><span class="result-label">🏁 Velocidad Final</span><span class="result-value">${(v0+a*t).toFixed(2)} m/s</span></div>`;
            if (!isNaN(a) && !isNaN(t)) html += `<div class="result-item"><span class="result-label">📏 Distancia</span><span class="result-value">${(v0*t+0.5*a*t*t).toFixed(2)} m</span></div>`;
        }
    }
    document.getElementById('results').innerHTML = html;
    document.getElementById('results').classList.remove('hidden');
}

function clearAll() {
    document.querySelectorAll('input').forEach(i => i.value = '');
    document.getElementById('results').classList.add('hidden');
}

// Inicializar guía al cargar
updateGuide();
