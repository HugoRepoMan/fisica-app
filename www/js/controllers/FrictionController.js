window.FrictionController = {
    mode: 'force',
    isDiagramVisible: false,

    init() {
        this.setMode('force');
    },

    setMode(mode) {
        this.mode = mode;
        
        // 1. Actualizar botones activos
        document.querySelectorAll('.mode-btn').forEach(b => b.classList.remove('active'));
        const idMap = { 'force': 'btn-force', 'coefficient': 'btn-coeff', 'normal': 'btn-normal' };
        document.getElementById(idMap[mode]).classList.add('active');
        
        // 2. Actualizar la FÓRMULA VISUAL según la opción
        const formulaEl = document.getElementById('formula-display');
        if (mode === 'force') {
            formulaEl.textContent = "Fr = μ × N";
        } else if (mode === 'coefficient') {
            formulaEl.textContent = "μ = Fr / N";
        } else if (mode === 'normal') {
            formulaEl.textContent = "N = Fr / μ";
        }

        // 3. Mostrar/ocultar campos de entrada
        document.getElementById('field-mu').classList.toggle('is-hidden', mode === 'coefficient');
        document.getElementById('field-normal').classList.toggle('is-hidden', mode === 'normal');
        document.getElementById('field-force').classList.toggle('is-hidden', mode === 'force');
        
        this.clear();
    },

    // ESTA ES LA FUNCIÓN QUE DEBES DEJAR (La que usa el backend)
    async calculate() {
        const datos = {
            // 'fuerza_rozamiento' es lo que espera tu backend en calculatorController.js
            calcular: this.mode === 'force' ? 'fuerza_rozamiento' : this.mode,
            coeficiente: document.getElementById('input-mu').value,
            normal: document.getElementById('input-normal').value,
            fuerza_rozamiento: document.getElementById('input-force').value
        };

        try {
            // Llamada asíncrona al backend
            const data = await CalculadoraService.calcularFriccion(datos);
            
            // Actualizar resultado en pantalla
            document.getElementById('res-display').innerHTML = 
                `${data.resultado} <span class="unit">${data.unidad || ''}</span>`;
                
            // Refrescar el diagrama visual
            this.updateLive(); 
        } catch (error) {
            alert("Error: " + (error.response?.data?.error || "No se pudo conectar al servidor"));
        }
    },

    // Se encarga de la parte visual (Diagrama)
    updateLive() {
        const mu = parseFloat(document.getElementById('input-mu').value) || 0;
        const n = parseFloat(document.getElementById('input-normal').value) || 0;
        const fr_in = parseFloat(document.getElementById('input-force').value) || 0;
        
        let res = 0;
        if (this.mode === 'force') res = mu * n;
        else if (this.mode === 'coefficient') res = n !== 0 ? fr_in / n : 0;
        else if (this.mode === 'normal') res = mu !== 0 ? fr_in / mu : 0;

        // Si no hemos llamado al servidor aún, mostramos un cálculo local previo
        if (!document.getElementById('res-display').innerText.includes('N') || res === 0) {
             document.getElementById('res-display').innerHTML = `${res.toFixed(2)} <span class="unit">${this.mode === 'coefficient' ? '' : ' N'}</span>`;
        }

        if (this.isDiagramVisible) {
            const finalFr = (this.mode === 'force') ? res : fr_in;
            this.renderDCL(mu, n, finalFr);
        }
    },

    toggleDiagram() {
        this.isDiagramVisible = !this.isDiagramVisible;
        document.getElementById('dcl-box').classList.toggle('is-hidden');
        document.getElementById('txt-diagram').textContent = this.isDiagramVisible ? 'Ocultar DCL' : 'Ver Diagrama de Cuerpo Libre';
        if (this.isDiagramVisible) this.updateLive();
    },

    renderDCL(mu, n, fr) {
        const scaleN = Math.min(n / 2, 80) || 40;
        const scaleF = Math.min(fr / 2, 100) || 50;

        const svg = `
            <svg width="100%" height="350" viewBox="0 0 400 350" style="background: #f8fafc; border-radius: 16px">
                <defs>
                    <pattern id="hatch" width="10" height="10" patternUnits="userSpaceOnUse" patternTransform="rotate(45)">
                        <line x1="0" y1="0" x2="0" y2="10" stroke="#cbd5e1" stroke-width="1"/>
                    </pattern>
                    <marker id="arr-c" markerWidth="10" markerHeight="10" refX="9" refY="3" orient="auto"><polygon points="0 0, 10 3, 0 6" fill="#06B6D4"/></marker>
                    <marker id="arr-p" markerWidth="10" markerHeight="10" refX="9" refY="3" orient="auto"><polygon points="0 0, 10 3, 0 6" fill="#9333EA"/></marker>
                    <marker id="arr-o" markerWidth="10" markerHeight="10" refX="9" refY="3" orient="auto"><polygon points="0 0, 10 3, 0 6" fill="#F97316"/></marker>
                    <marker id="arr-r" markerWidth="10" markerHeight="10" refX="9" refY="3" orient="auto"><polygon points="0 0, 10 3, 0 6" fill="#EF4444"/></marker>
                </defs>
                <rect x="0" y="250" width="400" height="100" fill="url(#hatch)" />
                <line x1="0" y1="250" x2="400" y2="250" stroke="#94a3b8" stroke-width="3" />
                <rect x="150" y="170" width="100" height="80" fill="#9333EA" rx="4" />
                <text x="200" y="215" text-anchor="middle" fill="white" font-weight="bold">Objeto</text>
                <line x1="200" y1="170" x2="200" y2="${170 - scaleN}" stroke="#06B6D4" stroke-width="3" marker-end="url(#arr-c)" />
                <text x="210" y="${160 - scaleN}" fill="#06B6D4" font-weight="bold">N = ${n.toFixed(1)} N</text>
                <line x1="200" y1="250" x2="200" y2="${250 + scaleN}" stroke="#EF4444" stroke-width="3" marker-end="url(#arr-r)" />
                <text x="210" y="${265 + scaleN}" fill="#EF4444" font-weight="bold">P = ${n.toFixed(1)} N</text>
                <line x1="150" y1="210" x2="${150 - scaleF}" y2="210" stroke="#9333EA" stroke-width="3" marker-end="url(#arr-p)" />
                <text x="${140 - scaleF}" y="205" text-anchor="end" fill="#9333EA" font-weight="bold">Fr = ${fr.toFixed(1)} N</text>
                <line x1="250" y1="210" x2="${250 + scaleF}" y2="210" stroke="#F97316" stroke-width="3" marker-end="url(#arr-o)" />
                <text x="${260 + scaleF}" y="205" fill="#F97316" font-weight="bold">F</text>
                <rect x="20" y="280" width="120" height="40" fill="white" rx="8" stroke="#e2e8f0" stroke-width="1" />
                <text x="80" y="305" text-anchor="middle" fill="#1e293b" font-weight="bold">μ = ${mu.toFixed(2)}</text>
            </svg>`;
        document.getElementById('svg-container').innerHTML = svg;
    },

    clear() {
        document.querySelectorAll('input').forEach(i => i.value = '');
        document.getElementById('res-display').innerHTML = `-- <span class="unit">N</span>`;
        if (this.isDiagramVisible) this.renderDCL(0.40, 0, 0);
    }
};