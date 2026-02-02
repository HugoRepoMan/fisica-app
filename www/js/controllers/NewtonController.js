window.NewtonController = {
    mode: 'force',
    isDiagramVisible: false,
    GRAVITY: 9.81,

    init() {
        this.setMode('force');
    },

    setMode(mode) {
        this.mode = mode;
        document.querySelectorAll('.mode-btn').forEach(b => b.classList.remove('active'));
        
        const config = {
            force: { btn: 'btn-force', formula: 'F = m × a', unit: 'N' },
            mass: { btn: 'btn-mass', formula: 'm = F / a', unit: 'kg' },
            acceleration: { btn: 'btn-accel', formula: 'a = F / m', unit: 'm/s²' }
        };

        document.getElementById(config[mode].btn).classList.add('active');
        document.getElementById('formula-display').textContent = config[mode].formula;

        // Mostrar/ocultar campos
        document.getElementById('field-mass').classList.toggle('is-hidden', mode === 'mass');
        document.getElementById('field-accel').classList.toggle('is-hidden', mode === 'acceleration');
        document.getElementById('field-force').classList.toggle('is-hidden', mode === 'force');
        
        this.clear();
    },

    updateLive() {
        const mass = parseFloat(document.getElementById('input-mass').value) || 0;
        const accel = parseFloat(document.getElementById('input-accel').value) || 0;
        const force = parseFloat(document.getElementById('input-force').value) || 0;
        
        let res = 0;
        if (this.mode === 'force') res = mass * accel;
        else if (this.mode === 'mass') res = accel !== 0 ? force / accel : 0;
        else if (this.mode === 'acceleration') res = mass !== 0 ? force / mass : 0;

        const units = { force: 'N', mass: 'kg', acceleration: 'm/s²' };
        document.getElementById('res-display').innerHTML = `${res.toFixed(2)} <span class="unit">${units[this.mode]}</span>`;

        if (this.isDiagramVisible) {
            const finalF = (this.mode === 'force') ? res : force;
            const finalM = (this.mode === 'mass') ? res : mass;
            const finalA = (this.mode === 'acceleration') ? res : accel;
            this.renderDCL(finalM, finalA, finalF);
        }
    },

    calculate() { this.updateLive(); },

    toggleDiagram() {
        this.isDiagramVisible = !this.isDiagramVisible;
        document.getElementById('dcl-box').classList.toggle('is-hidden');
        document.getElementById('txt-diagram').textContent = this.isDiagramVisible ? 'Ocultar DCL' : 'Ver Diagrama de Cuerpo Libre';
        if (this.isDiagramVisible) this.updateLive();
    },

    renderDCL(mass, acceleration, force) {
        const weight = mass * this.GRAVITY;
        const forceScale = Math.min(force / 2, 100) || 40;
        const weightScale = Math.min(weight / 2, 80) || 40;
        const accelScale = Math.min(acceleration * 15, 80);

        const svg = `
            <svg width="100%" height="350" viewBox="0 0 400 400" style="background: #f8fafc; border-radius: 16px">
                <defs>
                    <pattern id="hatch" width="10" height="10" patternUnits="userSpaceOnUse" patternTransform="rotate(45)">
                        <line x1="0" y1="0" x2="0" y2="10" stroke="#cbd5e1" stroke-width="1"/>
                    </pattern>
                    <marker id="arr-blue" markerWidth="10" markerHeight="10" refX="9" refY="3" orient="auto"><polygon points="0 0, 10 3, 0 6" fill="#3B82F6"/></marker>
                    <marker id="arr-red" markerWidth="10" markerHeight="10" refX="9" refY="3" orient="auto"><polygon points="0 0, 10 3, 0 6" fill="#EF4444"/></marker>
                    <marker id="arr-green" markerWidth="10" markerHeight="10" refX="9" refY="3" orient="auto"><polygon points="0 0, 10 3, 0 6" fill="#10B981"/></marker>
                    <marker id="arr-yellow" markerWidth="10" markerHeight="10" refX="9" refY="3" orient="auto"><polygon points="0 0, 10 3, 0 6" fill="#F59E0B"/></marker>
                </defs>
                <rect x="0" y="320" width="400" height="80" fill="url(#hatch)" />
                <line x1="0" y1="320" x2="400" y2="320" stroke="#94a3b8" stroke-width="3" />
                
                <rect x="160" y="240" width="80" height="80" fill="#4F46E5" rx="4" />
                <text x="200" y="285" text-anchor="middle" fill="white" font-weight="bold">m = ${mass.toFixed(1)}kg</text>

                <line x1="240" y1="280" x2="${240 + forceScale}" y2="280" stroke="#3B82F6" stroke-width="3" marker-end="url(#arr-blue)" />
                <text x="${250 + forceScale}" y="275" fill="#3B82F6" font-weight="bold">F = ${force.toFixed(1)}N</text>

                <line x1="200" y1="320" x2="200" y2="${320 + weightScale}" stroke="#EF4444" stroke-width="3" marker-end="url(#arr-red)" />
                <text x="210" y="${340 + weightScale}" fill="#EF4444" font-weight="bold">P = ${weight.toFixed(1)}N</text>

                <line x1="200" y1="240" x2="200" y2="${240 - weightScale}" stroke="#10B981" stroke-width="3" marker-end="url(#arr-green)" />
                <text x="210" y="${230 - weightScale}" fill="#10B981" font-weight="bold">N = ${weight.toFixed(1)}N</text>

                ${acceleration !== 0 ? `
                <line x1="200" y1="200" x2="${200 + accelScale}" y2="200" stroke="#F59E0B" stroke-width="2" stroke-dasharray="5,5" marker-end="url(#arr-yellow)" />
                <text x="${210 + accelScale}" y="195" fill="#F59E0B" font-weight="bold">a = ${acceleration.toFixed(1)}m/s²</text>
                ` : ''}
            </svg>`;
        document.getElementById('svg-container').innerHTML = svg;
    },

    clear() {
        document.querySelectorAll('input').forEach(i => i.value = '');
        document.getElementById('res-display').innerHTML = `-- <span class="unit">N</span>`;
    }
};