let mode = 'kinetic';
function goBack() { window.location.href = 'calculators.html'; }
function setMode(m) {
    mode = m;
    document.querySelectorAll('.tab').forEach((t,i) => t.classList.toggle('active', (m==='kinetic'&&i===0)||(m==='potential'&&i===1)||(m==='work'&&i===2)));
    const formulas = {kinetic: 'Ec = ½mv²', potential: 'Ep = mgh', work: 'W = Fd·cos(θ)'};
    document.getElementById('formula').textContent = formulas[m];
    let html = '';
    if (m === 'kinetic') html = '<div class="input-group"><label>Masa (kg)</label><input type="number" id="m" step="0.01"></div><div class="input-group"><label>Velocidad (m/s)</label><input type="number" id="v" step="0.01"></div>';
    else if (m === 'potential') html = '<div class="input-group"><label>Masa (kg)</label><input type="number" id="m" step="0.01"></div><div class="input-group"><label>Altura (m)</label><input type="number" id="h" step="0.01"></div>';
    else html = '<div class="input-group"><label>Fuerza (N)</label><input type="number" id="f" step="0.01"></div><div class="input-group"><label>Distancia (m)</label><input type="number" id="d" step="0.01"></div><div class="input-group"><label>Ángulo (°)</label><input type="number" id="a" value="0" step="1"></div>';
    document.getElementById('inputs').innerHTML = html;
    clearAll();
}
function calculate() {
    let result = 0, label = '';
    if (mode === 'kinetic') {
        const m = parseFloat(document.getElementById('m').value);
        const v = parseFloat(document.getElementById('v').value);
        result = 0.5 * m * v * v;
        label = 'Energía Cinética';
    } else if (mode === 'potential') {
        const m = parseFloat(document.getElementById('m').value);
        const h = parseFloat(document.getElementById('h').value);
        result = m * 9.81 * h;
        label = 'Energía Potencial';
    } else {
        const f = parseFloat(document.getElementById('f').value);
        const d = parseFloat(document.getElementById('d').value);
        const a = parseFloat(document.getElementById('a').value) || 0;
        result = f * d * Math.cos(a * Math.PI / 180);
        label = 'Trabajo';
    }
    document.getElementById('results').innerHTML = `<h3 class="results-title">Resultado</h3><div class="result-item"><span class="result-label">${label}</span><span class="result-value">${result.toFixed(2)} J</span></div>`;
    document.getElementById('results').classList.remove('hidden');
}
function clearAll() {
    document.querySelectorAll('input').forEach(i => i.value = i.id==='a'?'0':'');
    document.getElementById('results').classList.add('hidden');
}
setMode('kinetic');
