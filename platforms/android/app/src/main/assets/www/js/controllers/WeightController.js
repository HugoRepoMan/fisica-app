window.WeightController = {
    mode: 'weight',
    isDiagramVisible: false,

    init() {
        this.setMode('weight');
    },

    setMode(mode) {
        this.mode = mode;
        document.querySelectorAll('.mode-btn').forEach(b => b.classList.remove('active'));
        
        const config = {
            weight: { btn: 'btn-weight', formula: 'P = m × g', unit: 'N' },
            mass: { btn: 'btn-mass', formula: 'm = P / g', unit: 'kg' },
            gravity: { btn: 'btn-gravity', formula: 'g = P / m', unit: 'm/s²' }
        };

        document.getElementById(config[mode].btn).classList.add('active');
        document.getElementById('formula-display').textContent = config[mode].formula;

        document.getElementById('field-mass').classList.toggle('is-hidden', mode === 'mass');
        document.getElementById('field-gravity').classList.toggle('is-hidden', mode === 'gravity');
        document.getElementById('field-weight').classList.toggle('is-hidden', mode === 'weight');
        
        this.clear();
    },

    setGravityPreset(val) {
        document.getElementById('input-gravity').value = val;
        this.updateLive();
    },

    updateLive() {
        const mass = parseFloat(document.getElementById('input-mass').value) || 0;
        const gravity = parseFloat(document.getElementById('input-gravity').value) || 0;
        const weight = parseFloat(document.getElementById('input-weight').value) || 0;
        
        let res = 0;
        if (this.mode === 'weight') res = mass * gravity;
        else if (this.mode === 'mass') res = gravity !== 0 ? weight / gravity : 0;
        else if (this.mode === 'gravity') res = mass !== 0 ? weight / mass : 0;

        const units = { weight: 'N', mass: 'kg', gravity: 'm/s²' };
        document.getElementById('res-display').innerHTML = `${res.toFixed(2)} <span class="unit">${units[this.mode]}</span>`;

        if (this.isDiagramVisible) {
            const finalM = (this.mode === 'mass') ? res : mass;
            const finalG = (this.mode === 'gravity') ? res : gravity;
            const finalP = (this.mode === 'weight') ? res : weight;
            this.renderDCL(finalM, finalG, finalP);
        }
    },

    calculate() { this.updateLive(); },

    toggleDiagram() {
        this.isDiagramVisible = !this.isDiagramVisible;
        document.getElementById('dcl-box').classList.toggle('is-hidden');
        document.getElementById('txt-diagram').textContent = this.isDiagramVisible ? 'Ocultar DCL' : 'Ver Diagrama de Cuerpo Libre';
        if (this.isDiagramVisible) this.updateLive();
    },

    renderDCL(mass, gravity, weight) {
        // Escala dinámica para la flecha del peso (máximo 120px)
        const weightScale = Math.min(weight / 2, 120) || 40;

        const svg = `
            <svg width="100%" height="450" viewBox="0 0 400 450" style="background: linear-gradient(#e0f2fe, #f8fafc); border-radius: 16px" role="img">
                <defs>
                    <marker id="arr-pink" markerWidth="10" markerHeight="10" refX="9" refY="3" orient="auto">
                        <polygon points="0 0, 10 3, 0 6" fill="#EC4899"/>
                    </marker>
                    <marker id="arr-blue-weight" markerWidth="10" markerHeight="10" refX="9" refY="3" orient="auto">
                        <polygon points="0 0, 10 3, 0 6" fill="#3B82F6" />
                    </marker>
                </defs>

                <circle cx="200" cy="400" r="80" fill="#10B981" opacity="0.3" />
                <circle cx="200" cy="400" r="60" fill="#10B981" opacity="0.5" />
                <text x="200" y="405" text-anchor="middle" fill="#047857" font-size="12" font-weight="bold">Tierra</text>
                <text x="200" y="420" text-anchor="middle" fill="#047857" font-size="10">g = ${gravity.toFixed(2)} m/s²</text>

                <circle cx="200" cy="180" r="40" fill="#EC4899" stroke="#BE185D" stroke-width="3" />
                <text x="200" y="185" text-anchor="middle" fill="white" font-size="14" font-weight="bold">m = ${mass.toFixed(1)}kg</text>

                <line x1="200" y1="220" x2="200" y2="${220 + weightScale}" stroke="#EC4899" stroke-width="4" marker-end="url(#arr-pink)" />
                <text x="230" y="${220 + weightScale / 2}" fill="#EC4899" font-weight="bold" font-size="16">P = ${weight.toFixed(1)} N</text>

                <g opacity="0.3">
                    <line x1="100" y1="50" x2="100" y2="100" stroke="#3B82F6" stroke-width="2" stroke-dasharray="3,3" marker-end="url(#arr-blue-weight)" />
                    <line x1="200" y1="50" x2="200" y2="100" stroke="#3B82F6" stroke-width="2" stroke-dasharray="3,3" marker-end="url(#arr-blue-weight)" />
                    <line x1="300" y1="50" x2="300" y2="100" stroke="#3B82F6" stroke-width="2" stroke-dasharray="3,3" marker-end="url(#arr-blue-weight)" />
                </g>

                <rect x="270" y="20" width="115" height="45" fill="white" stroke="#3B82F6" stroke-width="2" rx="8" />
                <text x="327" y="38" text-anchor="middle" fill="#3B82F6" font-size="11" font-weight="bold">Campo Gravitacional</text>

                <rect x="10" y="380" width="125" height="60" fill="#FEF3C7" stroke="#F59E0B" stroke-width="2" rx="8" />
                <text x="72" y="398" text-anchor="middle" fill="#92400E" font-size="10" font-weight="bold">Masa: ${mass} kg</text>
                <text x="72" y="413" text-anchor="middle" fill="#92400E" font-size="10" font-weight="bold">Gravedad: ${gravity} m/s²</text>
                <text x="72" y="428" text-anchor="middle" fill="#92400E" font-size="10" font-weight="bold">Peso: ${weight.toFixed(1)} N</text>

                <text x="10" y="30" fill="#1F2937" font-size="16" font-weight="bold">DCL - Peso</text>
            </svg>`;
        
        document.getElementById('svg-container').innerHTML = svg;
    },

    clear() {
        document.getElementById('input-mass').value = '';
        document.getElementById('input-weight').value = '';
        document.getElementById('input-gravity').value = '9.81';
        document.getElementById('res-display').innerHTML = `-- <span class="unit">N</span>`;
    }
};