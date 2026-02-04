const MenuController = {
    async init() {
        console.log("🏠 [MenuController] Inicializando...");
        
        if (!window.Storage || typeof window.Storage.get !== 'function') {
            console.error("❌ [MenuController] Storage no disponible");
            return;
        }

        // Sincronizar datos del usuario
        await this.sincronizarDatos();

        // Renderizar interfaz
        const userData = window.Storage.get("user_data");
        console.log("👤 [MenuController] user_data:", userData);
        
        let userName = "Estudiante";
        
        if (userData && typeof userData === 'object') {
            userName = userData.nombre || userData.name || userName;
        } else {
            const userNameDirect = window.Storage.get("userName");
            if (userNameDirect) {
                userName = userNameDirect;
            }
        }
        
        if (typeof userName === 'string') {
            userName = userName.replace(/['"]+/g, '').trim();
            userName = userName.charAt(0).toUpperCase() + userName.slice(1);
        }
        
        console.log("✅ [MenuController] Nombre final:", userName);
        
        const welcomeText = document.getElementById("welcomeText");
        if (welcomeText) {
            welcomeText.textContent = `¡Hola, ${userName}!`;
        }
        
        if (userData && typeof userData === 'object') {
            const nivelText = document.getElementById("nivelText");
            const xpText = document.getElementById("xpText");
            const vidasText = document.getElementById("vidasText");
            const energiaText = document.getElementById("energiaText");
            
            if (nivelText) {
                nivelText.textContent = `Nivel ${userData.nivel || 1}`;
            }
            
            if (xpText) {
                xpText.textContent = `${userData.xp || 0} XP`;
            }

            if (vidasText) {
                vidasText.textContent = `❤️ ${userData.vidas !== undefined ? userData.vidas : 5}`;
            }

            if (energiaText) {
                energiaText.textContent = `⚡ ${userData.energia !== undefined ? userData.energia : 5}`;
            }
        }
    },

    async sincronizarDatos() {
        try {
            console.log("📡 [MenuController] Sincronizando datos...");
            
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
            console.log("📥 [MenuController] Respuesta backend:", result);

            // MANEJO ROBUSTO de la respuesta
            let data = result.data || result.usuario || result;

            const datosActualizados = {
                id: data.id,
                nombre: data.nombre || data.name || "Estudiante",
                email: data.email,
                nivel: parseInt(data.nivel || data.level || 1),
                xp: parseInt(data.xp || data.xp_actual || data.experiencia || 0),
                racha: parseInt(data.racha || data.streak || 0),
                vidas: data.vidas !== undefined ? parseInt(data.vidas) : 5,
                energia: data.energia !== undefined ? parseInt(data.energia) : 5,
                lecciones_completadas: parseInt(data.lecciones_completadas || data.completed_lessons || 0),
                total_aciertos: parseInt(data.total_aciertos || data.correct_answers || 0),
                total_intentos: parseInt(data.total_intentos || data.total_attempts || 0),
                logros: Array.isArray(data.logros) ? data.logros : 
                       Array.isArray(data.achievements) ? data.achievements : []
            };

            window.Storage.set("user_data", datosActualizados);
            window.Storage.set("userName", datosActualizados.nombre);
            
            console.log("✅ [MenuController] Datos sincronizados");

        } catch (error) {
            console.error("❌ [MenuController] Error:", error);
        }
    },

    goLearning() { 
        console.log("🎓 [MenuController] Ir a learning-path");
        window.location.href = "learning-path.html"; 
    },
    
    goCalculators() { 
        console.log("🔢 [MenuController] Ir a calculators");
        window.location.href = "calculators.html"; 
    },
    
    goProfile() { 
        console.log("👤 [MenuController] Ir a profile");
        window.location.href = "profile.html"; 
    },
    
    logout() {
        console.log("🚪 [MenuController] Cerrando sesión");
        
        if (confirm("¿Estás seguro de que quieres cerrar sesión?")) {
            localStorage.clear();
            window.location.replace("login.html");
        }
    }
};

document.addEventListener("DOMContentLoaded", function() {
    MenuController.init();
});

document.addEventListener("deviceready", function() {
    MenuController.init();
}, false);
