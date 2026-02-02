window.LearningPathController = {

    async init() {
        console.log("🚀 [LearningPath] INIT");

        try {
            // Primero renderizar con datos locales mientras carga
            this.renderHeaderFromLocalStorage();

            // Luego sincronizar con el backend
            await this.sincronizarDatosDesdeBD();
            
            // Actualizar header con datos frescos
            this.renderHeaderFromLocalStorage();

            // Cargar módulos/lecciones
            let modulos = await window.ContentService.getRutaAprendizaje();

            if (!modulos || !Array.isArray(modulos) || modulos.length === 0) {
                console.warn("⚠️ No se pudieron cargar módulos del backend, usando datos de respaldo");
                modulos = this.getMockData();
            }

            this.renderPath(modulos);

        } catch (e) {
            console.error("❌ ERROR INIT:", e);
            // En caso de error, usar datos de respaldo
            this.renderHeaderFromLocalStorage();
            this.renderPath(this.getMockData());
        }
    },

    async sincronizarDatosDesdeBD() {
        try {
            console.log("🔄 [LearningPath] Sincronizando datos del usuario...");
            
            // Llamar a UserService.getProfile o endpoint similar
            // Basándome en tu backend, usaría:
            const token = window.Storage.get("token");
            if (!token) {
                console.warn("⚠️ No hay token, no se puede sincronizar");
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
                console.warn("⚠️ Error al obtener perfil:", response.status);
                return;
            }

            const result = await response.json();
            console.log("📥 [LearningPath] Perfil recibido:", result);

            // Según tu backend, la respuesta podría ser directa o en result.data
            const userData = result;

            if (userData) {
                // Actualizar user_data en localStorage
                window.Storage.set("user_data", {
                    id: userData.id,
                    nombre: userData.nombre,
                    email: userData.email,
                    nivel: userData.nivel || 1,
                    xp: userData.xp || 0,
                    racha: userData.racha || 0,
                    vidas: userData.vidas !== undefined ? userData.vidas : 5,
                    energia: userData.energia !== undefined ? userData.energia : 5,
                    logros: userData.logros || []
                });

                window.Storage.set("userName", userData.nombre || "Estudiante");
                console.log("✅ [LearningPath] Datos sincronizados");
            }

        } catch (e) {
            console.error("❌ Error sincronizando:", e);
        }
    },

    renderHeaderFromLocalStorage() {
        const userData = window.Storage.get("user_data") || {};
        const userName = window.Storage.get("userName") || "Estudiante";

        console.log("🎨 [LearningPath] Renderizando header:", { userData, userName });

        const set = (id, val) => {
            const el = document.getElementById(id);
            if (el) {
                el.textContent = val;
            } else {
                console.warn(`⚠️ Elemento #${id} no encontrado`);
            }
        };

        // Limpiar nombre
        let cleanName = userName;
        if (typeof cleanName === 'string') {
            cleanName = cleanName.replace(/['"]+/g, '').trim();
            cleanName = cleanName.charAt(0).toUpperCase() + cleanName.slice(1);
        }

        set("welcomeGreeting", `¡Hola, ${cleanName}!`);
        set("totalXPText", userData.xp || 0);
        set("streakCount", userData.racha || 0);
        set("livesCount", userData.vidas !== undefined ? userData.vidas : 5);
        set("energyCount", userData.energia !== undefined ? userData.energia : 5);

        const nivelEl = document.getElementById("userLevelDisplay");
        if (nivelEl) {
            nivelEl.textContent = `Nivel ${userData.nivel || 1}`;
        }

        // Barra de progreso
        this.renderProgressBar(userData);
    },

    renderProgressBar(userData) {
        const xpActual = userData.xp || 0;
        const nivel = userData.nivel || 1;
        
        // XP necesario para el siguiente nivel (puedes ajustar esta fórmula)
        const xpParaSiguienteNivel = nivel * 200; // 200 XP por nivel
        const xpEnEsteNivel = xpActual % xpParaSiguienteNivel;
        const porcentaje = (xpEnEsteNivel / xpParaSiguienteNivel) * 100;

        const progressFill = document.getElementById("progressFill");
        if (progressFill) {
            progressFill.style.width = `${Math.min(porcentaje, 100)}%`;
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

        console.log("🎨 [LearningPath] Renderizando", modulos.length, "módulos");

        container.innerHTML = "";

        if (!modulos || modulos.length === 0) {
            container.innerHTML = `
                <div style="text-align: center; padding: 40px; color: #64748b;">
                    <p style="font-size: 18px; margin-bottom: 10px;">📚</p>
                    <p>No hay módulos disponibles</p>
                    <p style="font-size: 14px; margin-top: 8px;">Intenta recargar la página</p>
                </div>
            `;
            return;
        }

        modulos.forEach((modulo, index) => {
            const card = document.createElement("div");
            card.className = "lesson-card";
            
            // Estados: desbloqueado, bloqueado, completado
            const estado = modulo.estado || (index === 0 ? 'desbloqueado' : 'bloqueado');
            
            if (estado === 'bloqueado') {
                card.classList.add('locked');
            } else if (estado === 'completado') {
                card.classList.add('completed');
            }

            const icono = estado === 'completado' ? '✅' : 
                         estado === 'bloqueado' ? '🔒' : '📖';

            card.innerHTML = `
                <div style="display: flex; align-items: center; gap: 16px;">
                    <div style="font-size: 32px;">${icono}</div>
                    <div style="flex: 1;">
                        <h3 style="margin: 0 0 4px 0; font-size: 18px; font-weight: 600;">
                            ${modulo.titulo || 'Módulo ' + (index + 1)}
                        </h3>
                        <p style="margin: 0; font-size: 14px; color: #64748b;">
                            ${modulo.descripcion || 'Sin descripción'}
                        </p>
                        ${modulo.xp ? `<p style="margin: 4px 0 0 0; font-size: 12px; color: #059669; font-weight: 600;">+${modulo.xp} XP</p>` : ''}
                    </div>
                </div>
            `;

            // Click handler
            if (estado !== 'bloqueado') {
                card.style.cursor = 'pointer';
                card.addEventListener('click', () => {
                    this.abrirModulo(modulo);
                });
            }

            container.appendChild(card);
        });
    },

    abrirModulo(modulo) {
        console.log("📖 [LearningPath] Abriendo módulo:", modulo);
        
        // Guardar el módulo seleccionado
        window.Storage.set("modulo_actual", modulo);
        
        // Redirigir a la página de detalle
        window.location.href = `lesson-detail.html?id=${modulo.id || modulo.id_modulo}`;
    },

    getMockData() {
        return [
            { 
                id: 1,
                titulo: "Leyes de Newton", 
                descripcion: "Fundamentos de la dinámica", 
                estado: "desbloqueado",
                xp: 100
            },
            { 
                id: 2,
                titulo: "Fricción", 
                descripcion: "Fuerzas de rozamiento", 
                estado: "bloqueado",
                xp: 150
            },
            { 
                id: 3,
                titulo: "Trabajo y Energía", 
                descripcion: "Conservación de la energía", 
                estado: "bloqueado",
                xp: 200
            }
        ];
    },

    irAlMenu() {
        window.location.replace("menu.html");
    }
};

// Inicialización cuando la página carga
document.addEventListener("DOMContentLoaded", () => {
    if (window.LearningPathController && window.LearningPathController.init) {
        window.LearningPathController.init();
    }
});

// También en deviceready para Cordova
document.addEventListener("deviceready", () => {
    if (window.LearningPathController && window.LearningPathController.init) {
        window.LearningPathController.init();
    }
}, false);