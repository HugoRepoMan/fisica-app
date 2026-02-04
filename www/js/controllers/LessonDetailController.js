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
        
        try {
            const token = window.Storage.get("token");
            if (!token) {
                console.error("❌ No hay token");
                alert("Error: No hay sesión activa");
                window.location.href = "login.html";
                return;
            }

            console.log("📡 Enviando progreso al backend...");
            console.log({ puntaje, total_preguntas: totalPreguntas });

            const response = await fetch(`${window.CONFIG.API_URL}/progreso/completar`, {
                method: "POST",
                headers: {
                    "x-auth-token": token,
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({
                    puntaje: puntaje,
                    total_preguntas: totalPreguntas
                })
            });

            if (!response.ok) {
                const errorText = await response.text();
                console.error("❌ Error del servidor:", response.status, errorText);
                throw new Error(`Error ${response.status}: ${errorText}`);
            }

            const data = await response.json();
            console.log("✅ Respuesta del backend:", data);

            // CRÍTICO: Actualizar lecciones_completadas
            if (data.resumen) {
                const userData = window.Storage.get("user_data") || {};
                
                // Actualizar TODOS los campos del resumen
                userData.xp = data.resumen.nuevo_total_xp || userData.xp || 0;
                userData.nivel = data.resumen.nuevo_nivel || userData.nivel || 1;
                userData.energia = data.resumen.nueva_energia || userData.energia || 5;
                
                // CRÍTICO: Incrementar lecciones completadas
                if (userData.lecciones_completadas !== undefined) {
                    userData.lecciones_completadas++;
                } else {
                    userData.lecciones_completadas = 1;
                }
                
                window.Storage.set("user_data", userData);
                console.log("✅ Datos actualizados:", userData);
                console.log(`📚 Lecciones completadas: ${userData.lecciones_completadas}`);
            }

            // Mostrar mensaje de éxito
            const xpGanada = data.resumen?.xp_ganada || 0;
            const subiNivel = data.resumen?.subio_nivel || false;
            
            let mensaje = `¡Excelente trabajo! 🎉\n\nGanaste ${xpGanada} XP`;
            if (subiNivel) {
                mensaje += `\n\n🎊 ¡SUBISTE DE NIVEL! Ahora eres nivel ${data.resumen.nuevo_nivel}`;
            }
            
            alert(mensaje);
            
            // Volver a la ruta de aprendizaje
            window.location.href = "learning-path.html";

        } catch (error) {
            console.error("❌ Error al guardar progreso:", error);
            alert("Completaste la lección, pero hubo un error al guardar el progreso. Por favor, verifica tu conexión.");
            window.location.href = "learning-path.html";
        }
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
