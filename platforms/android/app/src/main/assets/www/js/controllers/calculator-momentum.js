let mode = 'momentum';
function goBack() { window.location.href = 'calculators.html'; }
function setMode(m) {
    mode = m;
    document.querySelectorAll('.tab').forEach((t,i) => t.classList.toggle('active', (m==='momentum'&&i===0)||(m==='impulse'&&i===1)));
    const formulas = {momentum: 'p = mv', impulse: 'J = FΔt'};
    document.getElementById('formula').textContent = formulas[m];
    let html = '';
    if (m === 'momentum') html = '<div class="input-group"><label>Masa (kg)</label><input type="number" id="m" step="0.01"></div><div class="input-group"><label>Velocidad (m/s)</label><input type="number" id="v" step="0.01"></div>';
    else html = '<div class="input-group"><label>Fuerza (N)</label><input type="number" id="f" step="0.01"></div><div class="input-group"><label>Tiempo (s)</label><input type="number" id="t" step="0.01"></div>';
    document.getElementById('inputs').innerHTML = html;
    clearAll();
}
function calculate() {
    let result = 0, label = '';
    if (mode === 'momentum') {
        const m = parseFloat(document.getElementById('m').value);
        const v = parseFloat(document.getElementById('v').value);
        result = m * v;
        label = 'Momentum';
    } else {
        const f = parseFloat(document.getElementById('f').value);
        const t = parseFloat(document.getElementById('t').value);
        result = f * t;
        label = 'Impulso';
    }
    document.getElementById('results').innerHTML = `<h3 class="results-title">Resultado</h3><div class="result-item"><span class="result-label">${label}</span><span class="result-value">${result.toFixed(2)} kg·m/s</span></div>`;
    document.getElementById('results').classList.remove('hidden');
}
function clearAll() {
    document.querySelectorAll('input').forEach(i => i.value = '');
    document.getElementById('results').classList.add('hidden');
}
setMode('momentum');
