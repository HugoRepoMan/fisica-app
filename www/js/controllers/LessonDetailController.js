window.LessonDetailController = {
    currentStep: 0,
    lessonData: null,
    totalSteps: 0,
    aciertos: 0,
    totalPreguntas: 0,

    async init() {
        console.log("📚 [LessonDetail] Inicializando...");
        
        const moduloId = window.Storage.get("current_modulo_id");
        console.log("📖 Módulo ID:", moduloId);
        
        if (!moduloId) {
            console.error("❌ No hay módulo seleccionado");
            alert("Error: No se pudo cargar la lección");
            window.location.href = "learning-path.html";
            return;
        }
        
        this.lessonData = await this.obtenerDatosLeccion(moduloId);
        
        if (!this.lessonData) {
            console.error("❌ No se pudieron cargar los datos de la lección");
            alert("Error al cargar la lección. Usando contenido de respaldo.");
            this.lessonData = this.getMockLesson();
        }
        
        this.totalSteps = this.lessonData.theory.length + this.lessonData.questions.length;
        this.totalPreguntas = this.lessonData.questions.length;
        this.aciertos = 0;
        this.renderStep();
    },

    async procesarError() {
        try {
            const vidasEl = document.getElementById("livesCount");
            if (vidasEl) {
                let vidas = parseInt(vidasEl.innerText) || 0;
                if (vidas > 0) {
                    vidasEl.innerText = vidas - 1;
                    console.log("💔 Vida restada (visual)");
                }
            }

            // Llamar al backend para restar vida
            const token = window.Storage.get("token");
            if (token) {
                await fetch(`${window.CONFIG.API_URL}/progreso/fallar`, {
                    method: "POST",
                    headers: {
                        "x-auth-token": token,
                        "Content-Type": "application/json"
                    }
                });
                console.log("💔 Vida restada en el servidor");
            }
        } catch (error) {
            console.error("Error al restar vida:", error);
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
        container.innerHTML = `
            <div class="animate__animated animate__fadeIn">
                <span class="tag is-success is-light is-rounded mb-4">❓ Pregunta</span>
                <h2 class="title is-5 mb-6">${pregunta.question}</h2>
                <div id="optionsContainer" class="columns is-multiline">
                    ${pregunta.options.map((opt, i) => `
                        <div class="column is-12">
                            <button class="button is-fullwidth is-white is-rounded shadow-sm option-btn" 
                                    onclick="LessonDetailController.validarRespuesta(${i}, ${pregunta.correctAnswer})">
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
            setTimeout(() => this.siguiente(), 2000);
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
        const moduloId = window.Storage.get("current_modulo_id");

        try {
            const token = window.Storage.get("token");
            if (!token) {
                console.error("❌ No hay token");
                alert("Error: No hay sesión activa");
                window.location.href = "login.html";
                return;
            }

            console.log("📡 Enviando progreso al backend...");
            console.log({ puntaje, total_preguntas: totalPreguntas, leccion_id: moduloId });

            const response = await fetch(`${window.CONFIG.API_URL}/progreso/completar`, {
                method: "POST",
                headers: {
                    "x-auth-token": token,
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({
                    puntaje: puntaje,
                    total_preguntas: totalPreguntas,
                    leccion_id: moduloId,
                    moduloId: moduloId
                })
            });

            if (!response.ok) {
                const errorText = await response.text();
                console.error("❌ Error del servidor:", response.status, errorText);
                throw new Error(`Error ${response.status}: ${errorText}`);
            }

            const data = await response.json();
            console.log("✅ Respuesta del backend:", data);

            // Actualizar datos del usuario localmente
            const userData = window.Storage.get("user_data") || {};

            if (data.resumen) {
                // Actualizar campos del resumen
                userData.xp = data.resumen.nuevo_total_xp || userData.xp || 0;
                userData.nivel = data.resumen.nuevo_nivel || userData.nivel || 1;
                userData.energia = data.resumen.nueva_energia || userData.energia || 5;

                // Usar lecciones_completadas del backend si viene, sino incrementar
                if (data.resumen.lecciones_completadas !== undefined) {
                    userData.lecciones_completadas = parseInt(data.resumen.lecciones_completadas);
                } else {
                    userData.lecciones_completadas = (parseInt(userData.lecciones_completadas) || 0) + 1;
                }
            } else {
                // Aunque no haya resumen, incrementar lecciones completadas
                userData.lecciones_completadas = (parseInt(userData.lecciones_completadas) || 0) + 1;
            }

            // Actualizar aciertos e intentos localmente
            userData.total_aciertos = (parseInt(userData.total_aciertos) || 0) + puntaje;
            userData.total_intentos = (parseInt(userData.total_intentos) || 0) + totalPreguntas;

            // Evaluar y desbloquear logros
            userData.logros = this.evaluarLogros(userData);

            window.Storage.set("user_data", userData);
            console.log("✅ Datos actualizados:", userData);
            console.log(`📚 Lecciones completadas: ${userData.lecciones_completadas}`);

            // Limpiar caché de ruta para forzar re-render con nuevo estado
            if (window.CacheService) {
                window.CacheService.delete('ruta_aprendizaje');
            }

            // Mostrar mensaje de éxito
            const xpGanada = data.resumen?.xp_ganada || 0;
            const subiNivel = data.resumen?.subio_nivel || false;

            let mensaje = `¡Excelente trabajo! 🎉\n\nGanaste ${xpGanada} XP`;
            if (subiNivel) {
                mensaje += `\n\n🎊 ¡SUBISTE DE NIVEL! Ahora eres nivel ${data.resumen.nuevo_nivel}`;
            }

            // Notificar logros nuevos
            const logrosNuevos = data.nuevos_logros || [];
            if (logrosNuevos.length > 0) {
                mensaje += `\n\n🏅 ¡Nuevos logros desbloqueados!`;
            }

            alert(mensaje);

            // Volver a la ruta de aprendizaje
            window.location.href = "learning-path.html";

        } catch (error) {
            console.error("❌ Error al guardar progreso:", error);

            // Aun si falla el backend, actualizar progreso localmente
            const userData = window.Storage.get("user_data") || {};
            userData.lecciones_completadas = (parseInt(userData.lecciones_completadas) || 0) + 1;
            userData.total_aciertos = (parseInt(userData.total_aciertos) || 0) + puntaje;
            userData.total_intentos = (parseInt(userData.total_intentos) || 0) + totalPreguntas;
            userData.logros = this.evaluarLogros(userData);
            window.Storage.set("user_data", userData);

            if (window.CacheService) {
                window.CacheService.delete('ruta_aprendizaje');
            }

            alert("Completaste la lección. Tu progreso se guardó localmente.");
            window.location.href = "learning-path.html";
        }
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
        if (confirm("¿Seguro que quieres salir? Perderás tu progreso.")) {
            window.location.href = "learning-path.html"; 
        }
    },

    async obtenerDatosLeccion(id) {
        try {
            console.log(`📡 [LessonDetail] Cargando lección ${id} desde backend...`);
            
            const token = window.Storage.get("token");
            if (!token) {
                console.warn("⚠️ No hay token, usando datos de respaldo");
                return this.getMockLesson();
            }

            // Intentar cargar desde el backend
            const response = await fetch(`${window.CONFIG.API_URL}/content/leccion/${id}`, {
                method: "GET",
                headers: {
                    "x-auth-token": token,
                    "Content-Type": "application/json"
                }
            });

            if (!response.ok) {
                console.warn(`⚠️ Endpoint /content/leccion/${id} no disponible (${response.status})`);
                console.log("📚 Usando datos de respaldo");
                return this.getMockLesson();
            }

            const leccionData = await response.json();
            console.log("✅ [LessonDetail] Lección cargada desde backend:", leccionData);
            
            // Validar que tenga la estructura correcta
            if (leccionData.theory && leccionData.questions) {
                return leccionData;
            } else {
                console.warn("⚠️ Estructura de lección inválida");
                return this.getMockLesson();
            }

        } catch (error) {
            console.error("❌ Error al cargar lección:", error);
            console.log("📚 Usando datos de respaldo");
            return this.getMockLesson();
        }
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
