window.LearningPathController = {

    async init() {
        console.log("🚀 [LearningPath] INIT");

        try {
            this.renderHeaderFromLocalStorage();
            await this.sincronizarDatosDesdeBD();
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

    async sincronizarDatosDesdeBD() {
        try {
            console.log("🔄 [LearningPath] Sincronizando datos...");
            
            const token = window.Storage.get("token");
            if (!token) {
                console.warn("⚠️ No hay token");
                return;
            }

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

            // MANEJO ROBUSTO: Puede venir en result.data, result.usuario, o directamente
            let userData = result.data || result.usuario || result;

            // MANEJO ROBUSTO: Extraer campos de forma segura
            const datosActualizados = {
                id: userData.id,
                nombre: userData.nombre || userData.name || "Estudiante",
                email: userData.email,
                nivel: parseInt(userData.nivel || userData.level || 1),
                xp: parseInt(userData.xp || userData.xp_actual || userData.experiencia || 0),
                racha: parseInt(userData.racha || userData.streak || 0),
                vidas: userData.vidas !== undefined ? parseInt(userData.vidas) : 5,
                energia: userData.energia !== undefined ? parseInt(userData.energia) : 5,
                lecciones_completadas: parseInt(userData.lecciones_completadas || userData.completed_lessons || 0),
                total_aciertos: parseInt(userData.total_aciertos || userData.correct_answers || 0),
                total_intentos: parseInt(userData.total_intentos || userData.total_attempts || 0),
                logros: Array.isArray(userData.logros) ? userData.logros : 
                       Array.isArray(userData.achievements) ? userData.achievements : []
            };

            window.Storage.set("user_data", datosActualizados);
            window.Storage.set("userName", datosActualizados.nombre);
            
            console.log("✅ [LearningPath] Datos sincronizados:", datosActualizados);
        } catch (e) {
            console.error("❌ Error sincronizando:", e.message);
        }
    },

    async cargarModulos() {
        try {
            console.log("📚 [LearningPath] Cargando módulos del backend...");
            
            let modulos = await window.ContentService.getRutaAprendizaje();
            
            // Si ContentService devuelve null o vacío
            if (!modulos || !Array.isArray(modulos) || modulos.length === 0) {
                console.warn("⚠️ Backend no devolvió módulos, usando mock data");
                return this.getMockData();
            }

            console.log(`✅ [LearningPath] ${modulos.length} módulos cargados del backend`);
            return modulos;
            
        } catch (e) {
            console.error("❌ Error cargando módulos:", e);
            return this.getMockData();
        }
    },

    aplicarLogicaDesbloqueo(modulos) {
        const userData = window.Storage.get("user_data") || {};
        const leccionesCompletadas = parseInt(userData.lecciones_completadas || 0);
        
        console.log(`🔓 [LearningPath] Aplicando lógica de desbloqueo...`);
        console.log(`📊 Lecciones completadas: ${leccionesCompletadas}`);

        return modulos.map((modulo, index) => {
            let estado;
            
            if (index === 0) {
                // Primera lección
                estado = leccionesCompletadas > 0 ? 'completado' : 'desbloqueado';
            } else {
                // Lecciones siguientes
                if (leccionesCompletadas > index) {
                    estado = 'completado';
                } else if (leccionesCompletadas === index) {
                    estado = 'desbloqueado';
                } else {
                    estado = 'bloqueado';
                }
            }
            
            console.log(`  Módulo ${index + 1} (${modulo.titulo}): ${estado}`);
            
            return {
                ...modulo,
                estado: estado
            };
        });
    },

    renderHeaderFromLocalStorage() {
        const userData = window.Storage.get("user_data") || {};
        const userName = window.Storage.get("userName") || "Estudiante";

        console.log("🎨 [LearningPath] Renderizando header");

        const set = (id, val) => {
            const el = document.getElementById(id);
            if (el) {
                el.textContent = val;
            }
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
        const xpParaSiguienteNivel = nivel * 200;
        const xpEnEsteNivel = xpActual % xpParaSiguienteNivel;
        const porcentaje = (xpEnEsteNivel / xpParaSiguienteNivel) * 100;

        const progressFill = document.getElementById("progressFill");
        if (progressFill) {
            progressFill.style.width = `${Math.min(Math.max(porcentaje, 0), 100)}%`;
        }

        const xpStatusText = document.getElementById("xpStatusText");
        if (xpStatusText) {
            const xpRestante = xpParaSiguienteNivel - xpEnEsteNivel;
            xpStatusText.textContent = `${xpEnEsteNivel} / ${xpParaSiguienteNivel} XP (${xpRestante} XP para nivel ${nivel + 1})`;
        }
    },

    renderPath(modulos) {
        const container = document.getElementById("learningPathContainer");
        if (!container) {
            console.error("❌ No se encontró #learningPathContainer");
            return;
        }

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
            
            if (estado === 'bloqueado') card.classList.add('locked');
            if (estado === 'completado') card.classList.add('completed');

            const icono = estado === 'completado' ? '✅' : 
                         estado === 'bloqueado' ? '🔒' : '📖';
            
            const estadoTexto = estado === 'completado' ? 
                '<span style="color: #10b981; font-size: 12px; font-weight: 600;">✓ Completado</span>' :
                estado === 'bloqueado' ? 
                '<span style="color: #94a3b8; font-size: 12px;">🔒 Completa la lección anterior</span>' :
                '<span style="color: #3b82f6; font-size: 12px; font-weight: 600;">📖 Disponible</span>';

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
                        ${modulo.xp ? `<p style="margin: 4px 0 0 0; font-size: 12px; color: #059669; font-weight: 600;">+${modulo.xp} XP</p>` : ''}
                    </div>
                </div>
            `;

            if (estado !== 'bloqueado') {
                card.style.cursor = 'pointer';
                card.addEventListener('click', () => this.abrirModulo(modulo));
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
        
        window.Storage.set("modulo_actual", modulo);
        window.Storage.set("current_modulo_id", modulo.id || modulo.id_modulo);
        
        window.location.href = `lesson-detail.html?id=${modulo.id || modulo.id_modulo}`;
    },

    getMockData() {
        return [
            { id: 1, titulo: "Leyes de Newton", descripcion: "Fundamentos de la dinámica", xp: 50 },
            { id: 2, titulo: "MRU - Problemas Avanzados", descripcion: "Aplicaciones prácticas", xp: 60 },
            { id: 3, titulo: "MRUV - Caída Libre", descripcion: "Aceleración constante", xp: 75 },
            { id: 4, titulo: "Primera Ley de Newton", descripcion: "Inercia y equilibrio", xp: 80 }
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
