window.ProfileController = {
    _inicializado: false,

    async init() {
        if (this._inicializado) return;
        this._inicializado = true;
        console.log("🔄 [ProfileController] Inicializando...");
        
        try {
            await this.sincronizarPerfil();

            const user = window.Storage.get("user_data") || {};
            const rawName = window.Storage.get("userName") || "Estudiante";
            
            const cleanName = String(rawName).replace(/['"]+/g, '').trim();

            const userNameEl = document.getElementById("userName");
            if (userNameEl) userNameEl.textContent = cleanName;

            this.renderEstadisticas(user);
            this.renderProgressBar(user);
            await this.renderAchievements(user.logros || []);
            
            console.log("✅ [ProfileController] Perfil cargado correctamente");
        } catch (error) {
            console.error("❌ [ProfileController] Error:", error);

            // Intentar renderizar con datos locales aunque falle el backend
            const user = window.Storage.get("user_data") || {};
            // Evaluar logros con datos locales
            user.logros = this.evaluarLogros(user);
            window.Storage.set("user_data", user);
            this.renderEstadisticas(user);
            this.renderProgressBar(user);
            await this.renderAchievements(user.logros || []);
        }
    },

    async sincronizarPerfil() {
        try {
            console.log("📡 [ProfileController] Sincronizando con backend...");

            const token = window.Storage.get("token");
            if (!token) {
                console.warn("⚠️ No hay token");
                return;
            }

            // Guardar datos locales ANTES de sincronizar
            const datosLocales = window.Storage.get("user_data") || {};

            const response = await fetch(`${window.CONFIG.API_URL}/usuario/perfil`, {
                method: "GET",
                headers: {
                    "x-auth-token": token,
                    "Content-Type": "application/json"
                }
            });

            if (!response.ok) {
                throw new Error(`HTTP ${response.status}`);
            }

            let result = await response.json();
            console.log("📥 [ProfileController] Respuesta backend:", result);

            // MANEJO ROBUSTO: Puede venir en diferentes formatos
            let data = result.data || result.usuario || result;

            // Preservar el MAYOR entre local y backend para no perder progreso
            const backendLecciones = parseInt(data.lecciones_completadas || data.completed_lessons || 0);
            const localLecciones = parseInt(datosLocales.lecciones_completadas || 0);
            const leccionesFinales = Math.max(backendLecciones, localLecciones);

            // Merge logros: unión de backend y locales
            const backendLogros = Array.isArray(data.logros) ? data.logros :
                                  Array.isArray(data.achievements) ? data.achievements : [];
            const localLogros = Array.isArray(datosLocales.logros) ? datosLocales.logros : [];
            const logrosMerged = [...new Set([...backendLogros, ...localLogros])];

            // EXTRACCIÓN SEGURA de todos los campos posibles
            const datosSincronizados = {
                id: data.id,
                nombre: data.nombre || data.name || "Estudiante",
                email: data.email,
                xp: Math.max(parseInt(data.xp || data.xp_actual || data.experiencia || 0), parseInt(datosLocales.xp || 0)),
                racha: Math.max(parseInt(data.racha || data.streak || 0), parseInt(datosLocales.racha || 0)),
                nivel: parseInt(data.nivel || data.level || 1),
                vidas: datosLocales.vidas !== undefined ? parseInt(datosLocales.vidas) :
                       (data.vidas !== undefined ? parseInt(data.vidas) : 5),
                energia: datosLocales.energia !== undefined ? parseInt(datosLocales.energia) :
                         (data.energia !== undefined ? parseInt(data.energia) : 5),
                lecciones_completadas: leccionesFinales,
                total_aciertos: Math.max(
                    parseInt(data.total_aciertos || data.correct_answers || 0),
                    parseInt(datosLocales.total_aciertos || 0)
                ),
                total_intentos: Math.max(
                    parseInt(data.total_intentos || data.total_attempts || 0),
                    parseInt(datosLocales.total_intentos || 0)
                ),
                logros: logrosMerged,
                ultima_leccion_fecha: datosLocales.ultima_leccion_fecha || null,
                ultima_regeneracion: datosLocales.ultima_regeneracion || Date.now()
            };

            // Recalcular nivel basado en XP
            const xpPorNivel = 100;
            const nivelCalculado = Math.floor(datosSincronizados.xp / xpPorNivel) + 1;
            datosSincronizados.nivel = Math.max(datosSincronizados.nivel, nivelCalculado);

            // Calcular precisión
            if (datosSincronizados.total_intentos > 0) {
                datosSincronizados.precision = Math.round(
                    (datosSincronizados.total_aciertos / datosSincronizados.total_intentos) * 100
                );
            } else {
                datosSincronizados.precision = 0;
            }

            // Evaluar logros basados en estadísticas actuales
            datosSincronizados.logros = this.evaluarLogros(datosSincronizados);

            window.Storage.set("user_data", datosSincronizados);
            window.Storage.set("userName", datosSincronizados.nombre);

            console.log("✅ [ProfileController] Datos sincronizados:", datosSincronizados);
        } catch (error) {
            console.error("❌ [ProfileController] Error al sincronizar:", error);
            throw error;
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
                console.log(`🏅 [ProfileController] Logro desbloqueado: ID ${regla.id}`);
            }
        });

        return logrosActuales;
    },

    renderEstadisticas(user) {
        console.log("📊 [ProfileController] Renderizando estadísticas");

        const stats = document.querySelectorAll(".stat-card strong");
        if (stats.length >= 4) {
            stats[0].textContent = `${user.racha || 0} días`;
            stats[1].textContent = `${user.lecciones_completadas || 0}`;
            stats[2].textContent = `${user.precision || 0}%`;
            stats[3].textContent = `${user.xp || 0}`;
        } else {
            console.warn("⚠️ No se encontraron 4 stat-cards");
        }
    },

    renderProgressBar(user) {
        const progressFill = document.getElementById("progressFill");
        const xpStatusText = document.getElementById("xpStatusText");
        const levelDisplay = document.getElementById("userLevelDisplay");

        const xpActual = parseInt(user.xp || 0);
        const nivel = parseInt(user.nivel || 1);
        const xpPorNivel = 100;
        const xpBaseNivel = (nivel - 1) * xpPorNivel;
        const xpEnEsteNivel = xpActual - xpBaseNivel;
        const porcentaje = Math.min(Math.max((xpEnEsteNivel / xpPorNivel) * 100, 0), 100);

        if (levelDisplay) {
            levelDisplay.textContent = `Nivel ${nivel}`;
        }

        if (xpStatusText) {
            const xpRestante = xpPorNivel - xpEnEsteNivel;
            xpStatusText.textContent = `${Math.max(xpEnEsteNivel, 0)} / ${xpPorNivel} XP (${Math.max(xpRestante, 0)} XP para nivel ${nivel + 1})`;
        }

        if (progressFill) {
            setTimeout(() => {
                progressFill.style.width = `${porcentaje}%`;
            }, 200);
        }
    },

    async renderAchievements(userLogros) {
        console.log("🏆 [ProfileController] Renderizando logros");
        console.log("Logros del usuario:", userLogros);

        const container = document.querySelector(".achievements");
        if (!container) {
            console.warn("⚠️ No se encontró contenedor .achievements");
            return;
        }

        // Intentar obtener logros del backend
        let todosLosLogros = await this.obtenerLogrosDisponibles();

        // Si no se pudieron obtener, usar lista por defecto
        if (!todosLosLogros || todosLosLogros.length === 0) {
            console.log("⚠️ Usando logros por defecto");
            todosLosLogros = [
                { id: 1, emoji: '🎓', titulo: 'Primer Paso', descripcion: 'Completaste tu primera lección' },
                { id: 2, emoji: '📚', titulo: 'Estudiante Dedicado', descripcion: 'Completa 5 lecciones' },
                { id: 3, emoji: '🍎', titulo: 'Maestro Newton', descripcion: 'Domina las leyes de Newton' },
                { id: 4, emoji: '🔥', titulo: 'Racha de Fuego', descripcion: '7 días consecutivos' },
                { id: 5, emoji: '🧮', titulo: 'Calculador Pro', descripcion: '50 cálculos correctos' },
                { id: 6, emoji: '🧠', titulo: 'Genio de la Física', descripcion: '95% de precisión' },
                { id: 7, emoji: '⭐', titulo: 'Estrella Brillante', descripcion: 'Alcanza el nivel 10' }
            ];
        }

        const title = container.querySelector("h3");
        container.innerHTML = "";
        if (title) container.appendChild(title);

        todosLosLogros.forEach(logro => {
            // Verificar si el usuario tiene este logro (manejar ambos formatos)
            const logroId = logro.id || logro.logro_id;
            const esCompletado = userLogros.includes(logroId) || 
                                userLogros.some(l => l.id === logroId || l === logroId);
            
            const div = document.createElement("div");
            div.className = `achievement ${esCompletado ? 'completed' : 'locked'}`;
            
            div.innerHTML = `
                <span class="emoji" style="font-size: 28px;">${logro.emoji || logro.icono || '🏆'}</span>
                <div style="flex: 1;">
                    <strong style="display: block; margin-bottom: 4px;">${logro.titulo || logro.title}</strong>
                    <p style="margin: 0; font-size: 13px; color: #64748b;">${logro.descripcion || logro.description || logro.desc}</p>
                </div>
                ${esCompletado ? '<span class="check" style="color: #10b981; font-size: 20px;">✔</span>' : ''}
            `;
            
            container.appendChild(div);
        });

        console.log(`✅ [ProfileController] ${todosLosLogros.length} logros renderizados`);
    },

    async obtenerLogrosDisponibles() {
        try {
            const token = window.Storage.get("token");
            if (!token) {
                console.warn("⚠️ No hay token para obtener logros");
                return null;
            }

            // Intentar endpoint /usuario/logros
            const response = await fetch(`${window.CONFIG.API_URL}/usuario/logros`, {
                method: "GET",
                headers: {
                    "x-auth-token": token,
                    "Content-Type": "application/json"
                }
            });

            if (!response.ok) {
                console.warn(`⚠️ Endpoint /usuario/logros no disponible (${response.status})`);
                return null;
            }

            const logros = await response.json();
            console.log("📥 [ProfileController] Logros del backend:", logros);
            
            // Manejar diferentes formatos de respuesta
            if (Array.isArray(logros)) {
                return logros;
            } else if (logros.data && Array.isArray(logros.data)) {
                return logros.data;
            } else if (logros.logros && Array.isArray(logros.logros)) {
                return logros.logros;
            }
            
            return null;
        } catch (error) {
            console.warn("⚠️ [ProfileController] Error obteniendo logros:", error.message);
            return null;
        }
    },

    logout() {
        if (confirm("¿Seguro que quieres cerrar sesión?")) {
            window.Storage.clear();
            window.location.replace("login.html");
        }
    }
};

document.addEventListener("DOMContentLoaded", () => {
    if (window.ProfileController) {
        window.ProfileController.init();
    }
});

document.addEventListener("deviceready", () => {
    if (window.ProfileController) {
        window.ProfileController.init();
    }
}, false);
