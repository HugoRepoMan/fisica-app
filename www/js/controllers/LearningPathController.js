window.LearningPathController = {

    async init() {
        console.log("🚀 [LearningPath] INIT");

        try {
            this.renderHeaderFromLocalStorage();
            await this.sincronizarDatosDesdeBD();
            this.verificarRegeneracion();
            this.renderHeaderFromLocalStorage();

            let modulos = await this.cargarModulos();
            modulos = this.aplicarLogicaDesbloqueo(modulos);
            this.renderPath(modulos);

        } catch (e) {
            console.error("❌ ERROR INIT:", e);
            this.renderHeaderFromLocalStorage();
            this.renderPath(this.getMockData());
        }
    },

    /**
     * Regenerar vidas y energía con el tiempo
     * 1 vida cada 30 minutos, 1 energía cada 60 minutos
     */
    verificarRegeneracion() {
        const userData = window.Storage.get("user_data") || {};
        const ahora = Date.now();
        const ultimaRegen = parseInt(userData.ultima_regeneracion) || ahora;
        const diffMinutos = (ahora - ultimaRegen) / (1000 * 60);

        const MAX_VIDAS = 5;
        const MAX_ENERGIA = 5;
        let vidas = userData.vidas !== undefined ? parseInt(userData.vidas) : MAX_VIDAS;
        let energia = userData.energia !== undefined ? parseInt(userData.energia) : MAX_ENERGIA;

        if (diffMinutos >= 30) {
            const vidasRegen = Math.floor(diffMinutos / 30);
            const energiaRegen = Math.floor(diffMinutos / 60);

            if (vidas < MAX_VIDAS) {
                vidas = Math.min(vidas + vidasRegen, MAX_VIDAS);
            }
            if (energia < MAX_ENERGIA) {
                energia = Math.min(energia + energiaRegen, MAX_ENERGIA);
            }

            userData.vidas = vidas;
            userData.energia = energia;
            userData.ultima_regeneracion = ahora;
            window.Storage.set("user_data", userData);
            console.log(`🔄 Regeneración: ${vidasRegen} vidas, ${energiaRegen} energía`);
        }

        // Verificar racha (si pasaron más de 48h sin completar, reiniciar)
        if (userData.ultima_leccion_fecha) {
            const ultimaFecha = new Date(userData.ultima_leccion_fecha);
            const diffHoras = (ahora - ultimaFecha.getTime()) / (1000 * 60 * 60);
            if (diffHoras > 48 && userData.racha > 0) {
                userData.racha = 0;
                window.Storage.set("user_data", userData);
                console.log("🔥 Racha reiniciada por inactividad (>48h)");
            }
        }
    },

    async sincronizarDatosDesdeBD() {
        try {
            console.log("🔄 [LearningPath] Sincronizando datos...");

            const token = window.Storage.get("token");
            if (!token) {
                console.warn("⚠️ No hay token");
                return;
            }

            const datosLocales = window.Storage.get("user_data") || {};

            const response = await fetch(`${window.CONFIG.API_URL}/usuario/perfil`, {
                method: "GET",
                headers: {
                    "x-auth-token": token,
                    "Content-Type": "application/json"
                }
            });

            if (!response.ok) {
                console.warn(`⚠️ Error HTTP ${response.status}`);
                return;
            }

            let result = await response.json();
            console.log("📥 [LearningPath] Respuesta backend:", result);

            let userData = result.data || result.usuario || result;

            const backendLecciones = parseInt(userData.lecciones_completadas || userData.completed_lessons || 0);
            const localLecciones = parseInt(datosLocales.lecciones_completadas || 0);
            const leccionesFinales = Math.max(backendLecciones, localLecciones);

            const backendLogros = Array.isArray(userData.logros) ? userData.logros :
                                  Array.isArray(userData.achievements) ? userData.achievements : [];
            const localLogros = Array.isArray(datosLocales.logros) ? datosLocales.logros : [];
            const logrosMerged = [...new Set([...backendLogros, ...localLogros])];

            const datosActualizados = {
                id: userData.id,
                nombre: userData.nombre || userData.name || "Estudiante",
                email: userData.email,
                nivel: parseInt(userData.nivel || userData.level || 1),
                xp: parseInt(userData.xp || userData.xp_actual || userData.experiencia || 0),
                racha: Math.max(parseInt(userData.racha || userData.streak || 0), parseInt(datosLocales.racha || 0)),
                vidas: userData.vidas !== undefined ? parseInt(userData.vidas) :
                       (datosLocales.vidas !== undefined ? datosLocales.vidas : 5),
                energia: userData.energia !== undefined ? parseInt(userData.energia) :
                         (datosLocales.energia !== undefined ? datosLocales.energia : 5),
                lecciones_completadas: leccionesFinales,
                total_aciertos: Math.max(
                    parseInt(userData.total_aciertos || userData.correct_answers || 0),
                    parseInt(datosLocales.total_aciertos || 0)
                ),
                total_intentos: Math.max(
                    parseInt(userData.total_intentos || userData.total_attempts || 0),
                    parseInt(datosLocales.total_intentos || 0)
                ),
                logros: logrosMerged,
                ultima_leccion_fecha: datosLocales.ultima_leccion_fecha || null,
                ultima_regeneracion: datosLocales.ultima_regeneracion || Date.now()
            };

            // Recalcular nivel basado en XP local si es mayor
            const xpPorNivel = 200;
            const nivelCalculado = Math.floor(datosActualizados.xp / xpPorNivel) + 1;
            datosActualizados.nivel = Math.max(datosActualizados.nivel, nivelCalculado);

            window.Storage.set("user_data", datosActualizados);
            window.Storage.set("userName", datosActualizados.nombre);

            console.log("✅ [LearningPath] Datos sincronizados:", datosActualizados);
        } catch (e) {
            console.error("❌ Error sincronizando:", e.message);
        }
    },

    async cargarModulos() {
        try {
            console.log("📚 [LearningPath] Cargando módulos...");

            // Cargar módulos del backend
            let modulosBackend = [];
            try {
                modulosBackend = await window.ContentService.getRutaAprendizaje();
                if (!Array.isArray(modulosBackend)) modulosBackend = [];
            } catch (e) {
                console.warn("⚠️ Error cargando módulos del backend");
            }

            // Combinar con módulos locales (que tienen contenido completo)
            const modulosLocales = window.LessonContentDB ? window.LessonContentDB.getTodosLosModulos() : [];

            // Crear mapa de módulos del backend por ID
            const backendMap = {};
            modulosBackend.forEach(m => { backendMap[m.id] = m; });

            // Títulos y descripciones para módulos adicionales (5-8)
            const infoModulos = {
                5: { titulo: "Trabajo y Energía", descripcion: "Trabajo mecánico, energía cinética y potencial" },
                6: { titulo: "Fricción y Fuerzas", descripcion: "Fuerzas de fricción y planos inclinados" },
                7: { titulo: "Momentum e Impulso", descripcion: "Cantidad de movimiento y conservación" },
                8: { titulo: "Gravitación Universal", descripcion: "Ley de gravitación y campos gravitacionales" }
            };

            // Construir lista final combinando backend + local
            const modulosFinal = [];
            const idsVistos = new Set();

            // Primero módulos del backend (1-4)
            modulosBackend.forEach(m => {
                const local = modulosLocales.find(l => l.id === m.id);
                modulosFinal.push({
                    ...m,
                    nivel_requerido: local ? local.nivel_requerido : 1,
                    xp: local ? local.xp_recompensa : (m.xp || 50),
                    energia_costo: local ? local.energia_costo : 1
                });
                idsVistos.add(m.id);
            });

            // Agregar módulos locales que no estén en el backend (5-8)
            modulosLocales.forEach(l => {
                if (!idsVistos.has(l.id)) {
                    const info = infoModulos[l.id] || {};
                    modulosFinal.push({
                        id: l.id,
                        titulo: info.titulo || `Módulo ${l.id}`,
                        descripcion: info.descripcion || "Lección avanzada de física",
                        xp: l.xp_recompensa,
                        nivel_requerido: l.nivel_requerido,
                        energia_costo: l.energia_costo
                    });
                }
            });

            // Ordenar por ID
            modulosFinal.sort((a, b) => a.id - b.id);

            if (modulosFinal.length === 0) {
                return this.getMockData();
            }

            console.log(`✅ [LearningPath] ${modulosFinal.length} módulos cargados`);
            return modulosFinal;

        } catch (e) {
            console.error("❌ Error cargando módulos:", e);
            return this.getMockData();
        }
    },

    aplicarLogicaDesbloqueo(modulos) {
        const userData = window.Storage.get("user_data") || {};
        const leccionesCompletadas = parseInt(userData.lecciones_completadas || 0);
        const nivelUsuario = parseInt(userData.nivel || 1);

        console.log(`🔓 [LearningPath] Lecciones completadas: ${leccionesCompletadas}, Nivel: ${nivelUsuario}`);

        return modulos.map((modulo, index) => {
            let estado;
            const nivelRequerido = modulo.nivel_requerido || 1;

            if (leccionesCompletadas > index) {
                estado = 'completado';
            } else if (leccionesCompletadas === index) {
                // Es la siguiente lección a completar
                if (nivelUsuario >= nivelRequerido) {
                    estado = 'desbloqueado';
                } else {
                    estado = 'nivel_insuficiente';
                }
            } else {
                estado = 'bloqueado';
            }

            console.log(`  Módulo ${index + 1} (${modulo.titulo}): ${estado} [Nivel req: ${nivelRequerido}]`);

            return {
                ...modulo,
                estado: estado,
                nivel_requerido: nivelRequerido
            };
        });
    },

    renderHeaderFromLocalStorage() {
        const userData = window.Storage.get("user_data") || {};
        const userName = window.Storage.get("userName") || "Estudiante";

        const set = (id, val) => {
            const el = document.getElementById(id);
            if (el) el.textContent = val;
        };

        let cleanName = String(userName).replace(/['"]+/g, '').trim();
        cleanName = cleanName.charAt(0).toUpperCase() + cleanName.slice(1);

        set("welcomeGreeting", `¡Hola, ${cleanName}!`);
        set("totalXPText", userData.xp || 0);
        set("streakCount", userData.racha || 0);
        set("livesCount", userData.vidas !== undefined ? userData.vidas : 5);
        set("energyCount", userData.energia !== undefined ? userData.energia : 5);

        const nivelEl = document.getElementById("userLevelDisplay");
        if (nivelEl) nivelEl.textContent = `Nivel ${userData.nivel || 1}`;

        this.renderProgressBar(userData);
    },

    renderProgressBar(userData) {
        const xpActual = parseInt(userData.xp || 0);
        const nivel = parseInt(userData.nivel || 1);
        const xpPorNivel = 200;
        const xpBaseNivel = (nivel - 1) * xpPorNivel;
        const xpEnEsteNivel = xpActual - xpBaseNivel;
        const porcentaje = (xpEnEsteNivel / xpPorNivel) * 100;

        const progressFill = document.getElementById("progressFill");
        if (progressFill) {
            progressFill.style.width = `${Math.min(Math.max(porcentaje, 0), 100)}%`;
        }

        const xpStatusText = document.getElementById("xpStatusText");
        if (xpStatusText) {
            const xpRestante = xpPorNivel - xpEnEsteNivel;
            xpStatusText.textContent = `${Math.max(xpEnEsteNivel, 0)} / ${xpPorNivel} XP (${Math.max(xpRestante, 0)} XP para nivel ${nivel + 1})`;
        }
    },

    renderPath(modulos) {
        const container = document.getElementById("learningPathContainer");
        if (!container) {
            console.error("❌ No se encontró #learningPathContainer");
            return;
        }

        const userData = window.Storage.get("user_data") || {};

        console.log(`🎨 [LearningPath] Renderizando ${modulos.length} módulos`);

        container.innerHTML = "";

        if (!modulos || modulos.length === 0) {
            container.innerHTML = `
                <div style="text-align: center; padding: 40px; color: #64748b;">
                    <p style="font-size: 18px; margin-bottom: 10px;">📚</p>
                    <p>No hay módulos disponibles</p>
                </div>
            `;
            return;
        }

        modulos.forEach((modulo, index) => {
            const card = document.createElement("div");
            card.className = "lesson-card";

            const estado = modulo.estado || 'bloqueado';

            if (estado === 'bloqueado' || estado === 'nivel_insuficiente') card.classList.add('locked');
            if (estado === 'completado') card.classList.add('completed');

            const icono = estado === 'completado' ? '✅' :
                         estado === 'bloqueado' ? '🔒' :
                         estado === 'nivel_insuficiente' ? '⚡' : '📖';

            let estadoTexto;
            if (estado === 'completado') {
                estadoTexto = '<span style="color: #10b981; font-size: 12px; font-weight: 600;">✓ Completado</span>';
            } else if (estado === 'nivel_insuficiente') {
                estadoTexto = `<span style="color: #f59e0b; font-size: 12px;">⚡ Requiere nivel ${modulo.nivel_requerido}</span>`;
            } else if (estado === 'bloqueado') {
                estadoTexto = '<span style="color: #94a3b8; font-size: 12px;">🔒 Completa la lección anterior</span>';
            } else {
                estadoTexto = '<span style="color: #3b82f6; font-size: 12px; font-weight: 600;">📖 Disponible</span>';
            }

            // Mostrar costo de energía
            const energiaCosto = modulo.energia_costo || 1;
            const energiaInfo = estado === 'desbloqueado' ?
                `<span style="font-size: 11px; color: #6366f1;">⚡ ${energiaCosto} energía</span>` : '';

            card.innerHTML = `
                <div style="display: flex; align-items: center; gap: 16px;">
                    <div style="font-size: 32px;">${icono}</div>
                    <div style="flex: 1;">
                        <h3 style="margin: 0 0 4px 0; font-size: 18px; font-weight: 600;">
                            ${modulo.titulo || 'Módulo ' + (index + 1)}
                        </h3>
                        <p style="margin: 0 0 4px 0; font-size: 14px; color: #64748b;">
                            ${modulo.descripcion || 'Sin descripción'}
                        </p>
                        ${estadoTexto}
                        ${modulo.xp ? `<p style="margin: 4px 0 0 0; font-size: 12px; color: #059669; font-weight: 600;">+${modulo.xp} XP ${energiaInfo}</p>` : ''}
                    </div>
                </div>
            `;

            if (estado === 'desbloqueado' || estado === 'completado') {
                card.style.cursor = 'pointer';
                card.addEventListener('click', () => this.abrirModulo(modulo));
            } else if (estado === 'nivel_insuficiente') {
                card.style.opacity = '0.6';
                card.addEventListener('click', () => {
                    alert(`⚡ Necesitas alcanzar el nivel ${modulo.nivel_requerido} para desbloquear esta lección.\nTu nivel actual: ${userData.nivel || 1}`);
                });
            } else {
                card.style.opacity = '0.6';
                card.addEventListener('click', () => {
                    alert('🔒 Completa las lecciones anteriores para desbloquear esta.');
                });
            }

            container.appendChild(card);
        });
    },

    abrirModulo(modulo) {
        console.log("📖 [LearningPath] Abriendo módulo:", modulo);

        // Verificar vidas
        const userData = window.Storage.get("user_data") || {};
        const vidas = userData.vidas !== undefined ? parseInt(userData.vidas) : 5;
        const energia = userData.energia !== undefined ? parseInt(userData.energia) : 5;
        const energiaCosto = modulo.energia_costo || 1;

        if (vidas <= 0) {
            alert("❤️ No tienes vidas disponibles.\nEspera a que se regeneren (1 vida cada 30 minutos).");
            return;
        }

        if (energia < energiaCosto) {
            alert(`⚡ No tienes suficiente energía.\nNecesitas ${energiaCosto} de energía.\nTienes: ${energia}\nSe regenera 1 por hora.`);
            return;
        }

        window.Storage.set("modulo_actual", modulo);
        window.Storage.set("current_modulo_id", modulo.id || modulo.id_modulo);

        window.location.href = `lesson-detail.html?id=${modulo.id || modulo.id_modulo}`;
    },

    getMockData() {
        return [
            { id: 1, titulo: "Leyes de Newton", descripcion: "Fundamentos de la dinámica", xp: 50, nivel_requerido: 1, energia_costo: 1 },
            { id: 2, titulo: "MRU - Problemas Avanzados", descripcion: "Aplicaciones prácticas", xp: 60, nivel_requerido: 1, energia_costo: 1 },
            { id: 3, titulo: "MRUV - Caída Libre", descripcion: "Aceleración constante", xp: 75, nivel_requerido: 2, energia_costo: 1 },
            { id: 4, titulo: "Primera Ley de Newton", descripcion: "Inercia y equilibrio", xp: 80, nivel_requerido: 2, energia_costo: 1 }
        ];
    },

    irAlMenu() {
        window.location.replace("menu.html");
    }
};

document.addEventListener("DOMContentLoaded", () => {
    if (window.LearningPathController) window.LearningPathController.init();
});

document.addEventListener("deviceready", () => {
    if (window.LearningPathController) window.LearningPathController.init();
}, false);
