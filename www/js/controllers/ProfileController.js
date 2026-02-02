/**
 * ProfileController - CORREGIDO TOTALMENTE
 * Gestiona estadísticas reales, niveles y logros desde el Backend.
 */

window.ProfileController = {
    async init() {
        console.log("🔄 Cargando perfil del usuario...");
        
        try {
            // Sincronizar datos frescos desde el backend
            await this.sincronizarPerfil();

            // Obtener datos actualizados del almacenamiento local
            const user = window.Storage.get("user_data") || { 
                xp: 0, 
                racha: 0, 
                nivel: 1, 
                lecciones_completadas: 0, 
                precision: 0 
            };
            const rawName = window.Storage.get("userName") || "Estudiante";
            
            // Limpieza de nombre
            const cleanName = typeof rawName === 'string' ? 
                rawName.replace(/['"]+/g, '').trim() : rawName;

            // Renderizar nombre
            const userNameEl = document.getElementById("userName");
            if (userNameEl) userNameEl.textContent = cleanName;

            // Renderizar estadísticas
            const stats = document.querySelectorAll(".stat-card strong");
            if (stats.length >= 4) {
                // CORRECCIÓN: Uso de backticks para interpolación de strings
                stats[0].textContent = `${user.racha || 0} días`;
                stats[1].textContent = `${user.lecciones_completadas || 0}`;
                stats[2].textContent = `${user.precision || 0}%`;
                stats[3].textContent = `${user.xp || 0}`;
            }

            // Renderizar barra de progreso
            this.renderProgressBar(user);

            // Renderizar logros
            this.renderAchievements(user.logros || []);
            
            console.log("✅ Perfil cargado correctamente");
        } catch (error) {
            console.error("❌ Error al cargar perfil:", error);
            // Solo alertar si es un error crítico de lógica, no de red silenciosa
        }
    },

    async sincronizarPerfil() {
        try {
            console.log("📡 Sincronizando perfil con backend...");
            
            const token = window.Storage.get("token");
            if (!token) {
                console.warn("⚠️ No hay token");
                return;
            }

            // CORRECCIÓN: URL envuelta en backticks
            const response = await fetch(`${window.CONFIG.API_URL}/usuario/perfil`, {
                method: "GET",
                headers: {
                    "x-auth-token": token,
                    "Content-Type": "application/json"
                }
            });

            if (!response.ok) {
                // CORRECCIÓN: Error message envuelto en backticks
                throw new Error(`HTTP ${response.status}`);
            }

            const data = await response.json();
            console.log("📥 Datos recibidos:", data);

            const datosSincronizados = {
                id: data.id,
                nombre: data.nombre,
                email: data.email,
                xp: data.xp || 0,
                racha: data.racha || 0,
                nivel: data.nivel || 1,
                vidas: data.vidas || 5,
                energia: data.energia || 5,
                lecciones_completadas: data.lecciones_completadas || 0,
                total_aciertos: data.total_aciertos || 0,
                total_intentos: data.total_intentos || 0,
                precision: data.total_intentos > 0 ? 
                    Math.round((data.total_aciertos / data.total_intentos) * 100) : 0,
                logros: data.logros || []
            };

            window.Storage.set("user_data", datosSincronizados);
            window.Storage.set("userName", data.nombre || "Estudiante");
            
            console.log("✅ Datos sincronizados:", datosSincronizados);
        } catch (error) {
            console.error("❌ Error al sincronizar perfil:", error);
            throw error;
        }
    },

    renderProgressBar(user) {
        const progressFill = document.getElementById("progressFill");
        const xpStatusText = document.getElementById("xpStatusText");
        const levelDisplay = document.getElementById("userLevelDisplay");

        const xpActual = user.xp || 0;
        const nivel = user.nivel || 1;
        const xpPorNivel = 200; 
        const xpEnEsteNivel = xpActual % xpPorNivel;
        const porcentaje = Math.min((xpEnEsteNivel / xpPorNivel) * 100, 100);
        
        if (levelDisplay) {
            // CORRECCIÓN: Template literal
            levelDisplay.textContent = `Nivel ${nivel}`;
        }
        
        if (xpStatusText) {
            const xpRestante = xpPorNivel - xpEnEsteNivel;
            // CORRECCIÓN: Template literal
            xpStatusText.textContent = `${xpEnEsteNivel} / ${xpPorNivel} XP (${xpRestante} XP para nivel ${nivel + 1})`;
        }

        if (progressFill) {
            setTimeout(() => {
                // CORRECCIÓN: Template literal para estilo CSS
                progressFill.style.width = `${porcentaje}%`;
            }, 200);
        }
    },

    renderAchievements(userLogros) {
        const container = document.querySelector(".achievements");
        if (!container) return;

        const todosLosLogros = [
            { id: 1, emoji: '🎓', titulo: 'Primer Paso', desc: 'Completaste tu primera lección' },
            { id: 4, emoji: '🔥', titulo: 'Racha de Fuego', desc: 'Mantén una racha de 7 días' },
            { id: 3, emoji: '🍎', titulo: 'Maestro Newton', desc: 'Completa mecánica clásica' },
            { id: 7, emoji: '⭐', titulo: 'Perfeccionista', desc: '3 estrellas en 10 lecciones' }
        ];

        const title = container.querySelector("h3");
        container.innerHTML = "";
        if (title) container.appendChild(title);

        todosLosLogros.forEach(logro => {
            const esCompletado = userLogros.includes(logro.id);
            const div = document.createElement("div");
            // CORRECCIÓN: Template literal para clases dinámicas
            div.className = `achievement ${esCompletado ? 'completed' : 'locked'}`;
            
            div.innerHTML = `
                <span class="emoji">${logro.emoji}</span>
                <div>
                    <strong>${logro.titulo}</strong>
                    <p>${logro.desc}</p>
                </div>
                ${esCompletado ? '<span class="check">✔</span>' : ''}
            `;
            container.appendChild(div);
        });
    },

    logout() {
        if (confirm("¿Seguro que quieres cerrar sesión?")) {
            window.Storage.clear();
            window.location.replace("login.html");
        }
    }
};

// Inicialización
document.addEventListener("DOMContentLoaded", () => {
    if (window.ProfileController) window.ProfileController.init();
});

document.addEventListener("deviceready", () => {
    if (window.ProfileController) window.ProfileController.init();
}, false);