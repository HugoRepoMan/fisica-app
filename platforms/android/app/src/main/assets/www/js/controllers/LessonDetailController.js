window.LessonDetailController = {
    currentStep: 0,
    lessonData: null,
    totalSteps: 0,
    aciertos: 0,
    totalPreguntas: 0,
    moduloId: null,
    _inicializado: false,

    async init() {
        // Evitar doble inicialización (DOMContentLoaded + deviceready)
        if (this._inicializado) return;
        this._inicializado = true;
        console.log("📚 [LessonDetail] Inicializando...");

        this.moduloId = window.Storage.get("current_modulo_id");
        console.log("📖 Módulo ID:", this.moduloId);

        if (!this.moduloId) {
            console.error("❌ No hay módulo seleccionado");
            alert("Error: No se pudo cargar la lección");
            window.location.href = "learning-path.html";
            return;
        }

        // Verificar vidas y energía antes de empezar
        const userData = window.Storage.get("user_data") || {};
        const vidas = userData.vidas !== undefined ? parseInt(userData.vidas) : 5;
        const energia = userData.energia !== undefined ? parseInt(userData.energia) : 5;

        if (vidas <= 0) {
            alert("❤️ No tienes vidas disponibles.\nEspera a que se regeneren para continuar.");
            window.location.href = "learning-path.html";
            return;
        }

        // Obtener costo de energía del módulo
        const contenidoLocal = window.LessonContentDB ? window.LessonContentDB.getContenido(this.moduloId) : null;
        const energiaCosto = contenidoLocal ? contenidoLocal.energia_costo : 1;

        if (energia < energiaCosto) {
            alert(`⚡ No tienes suficiente energía.\nNecesitas ${energiaCosto} de energía para esta lección.\nCompleta logros o espera a que se regenere.`);
            window.location.href = "learning-path.html";
            return;
        }

        // Descontar energía al iniciar lección
        userData.energia = energia - energiaCosto;
        window.Storage.set("user_data", userData);
        this.actualizarVidasUI(vidas, userData.energia);

        this.lessonData = await this.obtenerDatosLeccion(this.moduloId);

        if (!this.lessonData) {
            console.error("❌ No se pudieron cargar los datos de la lección");
            alert("Error al cargar la lección. Usando contenido de respaldo.");
            this.lessonData = this.getMockLesson();
        }

        this.totalSteps = this.lessonData.theory.length + this.lessonData.questions.length;
        this.totalPreguntas = this.lessonData.questions.length;
        this.aciertos = 0;
        this.currentStep = 0;
        this.renderStep();
    },

    actualizarVidasUI(vidas, energia) {
        const vidasEl = document.getElementById("livesCount");
        if (vidasEl) vidasEl.innerText = vidas;
        const energiaEl = document.getElementById("energyCount");
        if (energiaEl) energiaEl.innerText = energia;
    },

    async procesarError() {
        try {
            const userData = window.Storage.get("user_data") || {};
            let vidas = userData.vidas !== undefined ? parseInt(userData.vidas) : 5;

            // Intentar sincronizar con backend primero
            try {
                const token = window.Storage.get("token");
                if (token) {
                    const resp = await fetch(`${window.CONFIG.API_URL}/progreso/fallar`, {
                        method: "POST",
                        headers: {
                            "x-auth-token": token,
                            "Content-Type": "application/json"
                        },
                        body: JSON.stringify({ moduloId: this.moduloId })
                    });
                    if (resp.ok) {
                        const data = await resp.json();
                        if (data.vidas !== undefined) {
                            vidas = parseInt(data.vidas);
                            userData.vidas = vidas;
                            window.Storage.set("user_data", userData);
                            console.log(`💔 Vida sincronizada con backend. Quedan: ${vidas}`);
                        }
                    } else {
                        throw new Error(`HTTP ${resp.status}`);
                    }
                } else {
                    throw new Error("Sin token");
                }
            } catch (e) {
                console.warn("⚠️ Fallback local para vidas:", e.message);
                if (vidas > 0) {
                    vidas--;
                    userData.vidas = vidas;
                    window.Storage.set("user_data", userData);
                    console.log(`💔 Vida restada localmente. Quedan: ${vidas}`);
                }
            }

            this.actualizarVidasUI(vidas, userData.energia);

            if (vidas <= 0) {
                alert("💔 Te has quedado sin vidas.\nNo puedes continuar esta lección.");
                window.location.href = "learning-path.html";
                return;
            }
        } catch (error) {
            console.error("Error al procesar fallo:", error);
        }
    },

    renderStep() {
        const isTheory = this.currentStep < this.lessonData.theory.length;
        const container = document.getElementById("lessonContent");
        const footer = document.getElementById("lessonFooter");

        const progress = ((this.currentStep + 1) / this.totalSteps) * 100;
        const progressBar = document.getElementById("lessonProgressBar");
        const stepCounter = document.getElementById("stepCounter");

        if (progressBar) progressBar.style.width = `${progress}%`;
        if (stepCounter) stepCounter.textContent = `${this.currentStep + 1}/${this.totalSteps}`;

        if (isTheory) {
            const theory = this.lessonData.theory[this.currentStep];
            if (footer) footer.classList.remove("is-hidden");
            container.innerHTML = `
                <div class="animate__animated animate__fadeIn">
                    <span class="tag is-info is-light is-rounded mb-4">📚 Teoría</span>
                    <h2 class="title is-4">${theory.title}</h2>
                    <div class="box card-content-theory mb-5">
                        <p class="has-text-grey-dark">${theory.content}</p>
                    </div>
                    <div class="box has-background-link-light has-text-centered is-borderless-indigo">
                        <p class="is-size-7 has-text-link mb-2">📐 Fórmula</p>
                        <p class="title is-3 has-text-link-dark font-mono">${theory.formula}</p>
                        <p class="is-size-7 mt-3">${theory.formulaExplanation}</p>
                    </div>
                </div>
            `;
        } else {
            if (footer) footer.classList.add("is-hidden");
            const qIndex = this.currentStep - this.lessonData.theory.length;
            this.renderPregunta(this.lessonData.questions[qIndex]);
        }

        if (window.lucide) lucide.createIcons();
    },

    renderPregunta(pregunta) {
        const container = document.getElementById("lessonContent");
        
        // Mezclar opciones
        const indices = Array.from({length: pregunta.options.length}, (_, i) => i);
        for (let i = indices.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [indices[i], indices[j]] = [indices[j], indices[i]];
        }
        const optsMezcladas = indices.map(i => pregunta.options[i]);
        const nuevoCorrect = indices.indexOf(pregunta.correctAnswer);
        
        container.innerHTML = `
            <div class="animate__animated animate__fadeIn">
                <span class="tag is-success is-light is-rounded mb-4">❓ Pregunta</span>
                <h2 class="title is-5 mb-6">${pregunta.question}</h2>
                <div id="optionsContainer" class="columns is-multiline">
                    ${optsMezcladas.map((opt, i) => `
                        <div class="column is-12">
                            <button class="button is-fullwidth is-white is-rounded shadow-sm option-btn"
                                    onclick="LessonDetailController.validarRespuesta(${i}, ${nuevoCorrect})">
                                <span class="option-letter mr-3">${String.fromCharCode(65 + i)}</span> ${opt}
                            </button>
                        </div>
                    `).join('')}
                </div>
            </div>
        `;
    },

    async validarRespuesta(selectedIndex, correctIndex) {
        const buttons = document.querySelectorAll('.option-btn');
        buttons.forEach(btn => btn.disabled = true);

        if (selectedIndex === correctIndex) {
            buttons[selectedIndex].classList.add('is-success');
            this.aciertos++;
            console.log(`✅ Respuesta correcta! (${this.aciertos}/${this.totalPreguntas})`);
            setTimeout(() => this.siguiente(), 1000);
        } else {
            buttons[selectedIndex].classList.add('is-danger');
            buttons[correctIndex].classList.add('is-success');
            await this.procesarError();
            console.log(`❌ Respuesta incorrecta (${this.aciertos}/${this.totalPreguntas})`);
            // Solo continuar si aún tiene vidas (procesarError redirige si no)
            const userData = window.Storage.get("user_data") || {};
            if ((userData.vidas || 0) > 0) {
                setTimeout(() => this.siguiente(), 2000);
            }
        }
    },

    async siguiente() {
        if (this.currentStep + 1 < this.totalSteps) {
            this.currentStep++;
            this.renderStep();
        } else {
            await this.finalizarLeccion();
        }
    },

    async finalizarLeccion() {
        console.log("🎉 [LessonDetail] Finalizando lección...");
        console.log(`📊 Aciertos: ${this.aciertos}/${this.totalPreguntas}`);

        const puntaje = this.aciertos;
        const totalPreguntas = this.totalPreguntas;
        const moduloId = this.moduloId;

        // Obtener XP de recompensa del módulo
        const contenidoLocal = window.LessonContentDB ? window.LessonContentDB.getContenido(moduloId) : null;
        const xpModulo = contenidoLocal ? contenidoLocal.xp_recompensa : 50;
        // XP proporcional a aciertos
        const xpGanada = totalPreguntas > 0 ? Math.round((puntaje / totalPreguntas) * xpModulo) : xpModulo;

        try {
            const token = window.Storage.get("token");
            if (!token) {
                console.error("❌ No hay token");
                alert("Error: No hay sesión activa");
                window.location.href = "login.html";
                return;
            }

            console.log("📡 Enviando progreso al backend...");

            const response = await fetch(`${window.CONFIG.API_URL}/progreso/completar`, {
                method: "POST",
                headers: {
                    "x-auth-token": token,
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({
                    puntaje: parseInt(puntaje),
                    total_preguntas: parseInt(totalPreguntas),
                    leccion_id: parseInt(moduloId),
                    moduloId: parseInt(moduloId),
                    modulo_id: parseInt(moduloId),
                    xp: parseInt(xpGanada)
                })
            });

            let backendData = null;
            if (response.ok) {
                backendData = await response.json();
                console.log("✅ Respuesta del backend:", backendData);
            } else {
                console.warn(`⚠️ Backend respondió ${response.status}, actualizando solo localmente`);
            }

            this.actualizarProgresoLocal(backendData, puntaje, totalPreguntas, xpGanada);

        } catch (error) {
            console.error("❌ Error al guardar progreso:", error);
            this.actualizarProgresoLocal(null, puntaje, totalPreguntas, xpGanada);
        }
    },

    actualizarProgresoLocal(backendData, puntaje, totalPreguntas, xpGanada) {
        const userData = window.Storage.get("user_data") || {};
        const resumen = backendData ? backendData.resumen : null;

        // **IMPORTANTE: Mantener registro de lecciones completadas**
        // Array de IDs de lecciones completadas para persistencia correcta
        if (!Array.isArray(userData.lecciones_completadas_ids)) {
            userData.lecciones_completadas_ids = [];
        }
        if (!userData.lecciones_completadas_ids.includes(this.moduloId)) {
            userData.lecciones_completadas_ids.push(this.moduloId);
            console.log("✅ Lección #" + this.moduloId + " marcada como completada");
        }

        // Lecciones completadas (contador)
        if (resumen && resumen.lecciones_completadas !== undefined) {
            userData.lecciones_completadas = Math.max(
                parseInt(resumen.lecciones_completadas),
                (parseInt(userData.lecciones_completadas) || 0) + 1
            );
        } else {
            userData.lecciones_completadas = (parseInt(userData.lecciones_completadas) || 0) + 1;
        }

        // XP: usar backend si disponible, sino calcular localmente
        if (resumen && resumen.nuevo_total_xp !== undefined) {
            userData.xp = Math.max(parseInt(resumen.nuevo_total_xp), (parseInt(userData.xp) || 0) + xpGanada);
        } else {
            userData.xp = (parseInt(userData.xp) || 0) + xpGanada;
        }

        // Nivel: calcular basado en XP (100 XP por nivel)
        const xpPorNivel = 100;
        const nivelCalculado = Math.floor(userData.xp / xpPorNivel) + 1;
        const nivelAnterior = parseInt(userData.nivel) || 1;
        if (resumen && resumen.nuevo_nivel) {
            userData.nivel = Math.max(parseInt(resumen.nuevo_nivel), nivelCalculado);
        } else {
            userData.nivel = nivelCalculado;
        }
        const subioNivel = userData.nivel > nivelAnterior;

        // Energía del backend o mantener local
        if (resumen && resumen.nueva_energia !== undefined) {
            userData.energia = parseInt(resumen.nueva_energia);
        }

        // Aciertos e intentos
        userData.total_aciertos = (parseInt(userData.total_aciertos) || 0) + puntaje;
        userData.total_intentos = (parseInt(userData.total_intentos) || 0) + totalPreguntas;

        // Racha: actualizar si completó lección hoy
        userData.racha = this.actualizarRacha(userData);

        // Evaluar logros
        userData.logros = this.evaluarLogros(userData);

        window.Storage.set("user_data", userData);

        // Limpiar caché
        if (window.CacheService) {
            window.CacheService.delete('ruta_aprendizaje');
        }

        console.log("✅ Progreso actualizado:", userData);

        // Mensaje de éxito
        let mensaje = `¡Excelente trabajo! 🎉\n\n⭐ Aciertos: ${puntaje}/${totalPreguntas}\n💫 +${xpGanada} XP`;
        if (subioNivel) {
            mensaje += `\n\n🎊 ¡SUBISTE DE NIVEL! Ahora eres nivel ${userData.nivel}`;
        }

        alert(mensaje);
        window.location.href = "learning-path.html";
    },

    actualizarRacha(userData) {
        const ahora = new Date();
        const hoyStr = ahora.toISOString().split('T')[0]; // "YYYY-MM-DD"
        const ultimaLeccion = userData.ultima_leccion_fecha || null;
        let racha = parseInt(userData.racha) || 0;

        if (!ultimaLeccion) {
            // Primera lección completada
            racha = 1;
        } else {
            const ultimaFecha = new Date(ultimaLeccion);
            const diffMs = ahora.getTime() - ultimaFecha.getTime();
            const diffHoras = diffMs / (1000 * 60 * 60);

            if (ultimaLeccion === hoyStr) {
                // Ya completó una lección hoy, mantener racha
            } else if (diffHoras <= 48) {
                // Completó ayer o dentro de 48h → sumar racha
                racha++;
            } else {
                // Más de 48h sin completar → reiniciar racha
                racha = 1;
            }
        }

        userData.ultima_leccion_fecha = hoyStr;
        return racha;
    },

    evaluarLogros(userData) {
        const logrosActuales = Array.isArray(userData.logros) ? [...userData.logros] : [];
        const lecciones = parseInt(userData.lecciones_completadas) || 0;
        const racha = parseInt(userData.racha) || 0;
        const aciertos = parseInt(userData.total_aciertos) || 0;
        const intentos = parseInt(userData.total_intentos) || 0;
        const nivel = parseInt(userData.nivel) || 1;
        const precision = intentos > 0 ? (aciertos / intentos) * 100 : 0;

        const reglas = [
            { id: 1, condicion: lecciones >= 1 },
            { id: 2, condicion: lecciones >= 5 },
            { id: 3, condicion: lecciones >= 3 },
            { id: 4, condicion: racha >= 7 },
            { id: 5, condicion: aciertos >= 50 },
            { id: 6, condicion: precision >= 95 && intentos >= 10 },
            { id: 7, condicion: nivel >= 10 }
        ];

        reglas.forEach(regla => {
            if (regla.condicion && !logrosActuales.includes(regla.id)) {
                logrosActuales.push(regla.id);
                console.log(`🏅 Logro desbloqueado: ID ${regla.id}`);
            }
        });

        return logrosActuales;
    },

    salir() {
        if (confirm("¿Seguro que quieres salir? Perderás tu progreso en esta lección.")) {
            window.location.href = "learning-path.html";
        }
    },

    async obtenerDatosLeccion(id) {
        try {
            console.log(`📡 [LessonDetail] Cargando lección ${id}...`);

            // 1. Intentar contenido local completo (tiene theory + questions)
            if (window.LessonContentDB) {
                const contenidoLocal = window.LessonContentDB.getContenido(id);
                if (contenidoLocal && contenidoLocal.theory && contenidoLocal.questions) {
                    console.log("✅ Contenido cargado desde base local");

                    // Intentar enriquecer con datos del backend
                    try {
                        const token = window.Storage.get("token");
                        if (token) {
                            const response = await fetch(`${window.CONFIG.API_URL}/content/leccion/${id}`, {
                                method: "GET",
                                headers: {
                                    "x-auth-token": token,
                                    "Content-Type": "application/json"
                                }
                            });
                            if (response.ok) {
                                const backendData = await response.json();
                                console.log("📥 Datos adicionales del backend:", backendData);
                                // El backend retorna un array de lecciones sparse
                                // Se podría integrar el contenido_texto y formula_latex si se desea
                            }
                        }
                    } catch (e) {
                        console.warn("⚠️ No se pudieron obtener datos adicionales del backend");
                    }

                    return contenidoLocal;
                }
            }

            // 2. Si no hay contenido local, intentar backend y transformar
            const token = window.Storage.get("token");
            if (token) {
                const response = await fetch(`${window.CONFIG.API_URL}/content/leccion/${id}`, {
                    method: "GET",
                    headers: {
                        "x-auth-token": token,
                        "Content-Type": "application/json"
                    }
                });

                if (response.ok) {
                    const data = await response.json();
                    console.log("📥 Datos del backend:", data);

                    // El backend retorna: [{id, modulo_id, titulo, contenido_texto, formula_latex}]
                    const lecciones = Array.isArray(data) ? data : [data];
                    if (lecciones.length > 0) {
                        return this.transformarDatosBackend(lecciones);
                    }
                }
            }

            // 3. Fallback a mock
            console.warn("⚠️ Usando datos de respaldo");
            return this.getMockLesson();

        } catch (error) {
            console.error("❌ Error al cargar lección:", error);
            return this.getMockLesson();
        }
    },

    /**
     * Transforma datos del backend al formato esperado por el frontend
     * Backend: [{id, modulo_id, titulo, contenido_texto, formula_latex}]
     * Frontend: {theory: [{title, content, formula, formulaExplanation}], questions: [...]}
     */
    transformarDatosBackend(lecciones) {
        const theory = lecciones.map(l => ({
            title: l.titulo || 'Lección',
            content: l.contenido_texto || 'Contenido no disponible.',
            formula: l.formula_latex || '',
            formulaExplanation: l.explicacion_formula || ''
        }));

        // El backend no tiene preguntas, agregar preguntas genéricas
        const questions = [
            {
                question: '¿Entendiste el contenido de esta lección?',
                options: ['Sí, lo entendí completamente', 'Necesito repasar', 'No lo entendí', 'Parcialmente'],
                correctAnswer: 0,
                explanation: '¡Excelente! Sigue adelante con la siguiente lección.'
            }
        ];

        return { theory, questions };
    },

    getMockLesson() {
        return {
            theory: [
                {
                    title: '¿Qué es el MRU?',
                    content: 'El Movimiento Rectilíneo Uniforme (MRU) es aquel en el que un objeto se mueve en línea recta con velocidad constante.',
                    formula: 'v = d / t',
                    formulaExplanation: 'Donde v es velocidad, d es distancia y t es tiempo.'
                }
            ],
            questions: [
                {
                    question: 'Si un auto va a 20 m/s por 5 segundos, ¿qué distancia recorre?',
                    options: ['100 metros', '25 metros', '4 metros', '15 metros'],
                    correctAnswer: 0,
                    explanation: 'd = v × t = 20 × 5 = 100 metros'
                },
                {
                    question: '¿Qué caracteriza al MRU?',
                    options: ['Velocidad constante', 'Aceleración variable', 'Velocidad cero', 'Movimiento circular'],
                    correctAnswer: 0,
                    explanation: 'En el MRU la velocidad es constante'
                }
            ]
        };
    }
};

document.addEventListener("DOMContentLoaded", () => {
    if (window.LessonDetailController) {
        LessonDetailController.init();
    }
});

document.addEventListener("deviceready", () => {
    if (window.LessonDetailController) {
        LessonDetailController.init();
    }
}, false);
