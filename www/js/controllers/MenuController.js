const MenuController = {
    async init() {
        console.log("🏠 [MenuController] Inicializando...");
        
        if (!window.Storage || typeof window.Storage.get !== 'function') {
            console.error("❌ [MenuController] Storage.js no se cargó correctamente");
            return;
        }

        // Sincronizar datos del usuario desde el backend
        await this.sincronizarDatos();

        // Obtener datos actualizados
        const userData = window.Storage.get("user_data");
        console.log("👤 [MenuController] user_data:", userData);
        
        let userName = "Estudiante";
        
        if (userData && typeof userData === 'object') {
            userName = userData.nombre || userName;
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
        
        // Renderizar nombre
        const welcomeText = document.getElementById("welcomeText");
        if (welcomeText) {
            // CORREGIDO: Uso correcto de backticks (ya lo tenías bien aquí)
            welcomeText.textContent = `¡Hola, ${userName}!`;
        }
        
        // Renderizar nivel y XP
        if (userData && typeof userData === 'object') {
            const nivelText = document.getElementById("nivelText");
            const xpText = document.getElementById("xpText");
            const vidasText = document.getElementById("vidasText");
            const energiaText = document.getElementById("energiaText");
            
            if (nivelText) {
                // CORREGIDO: Asegurando Template Literal
                nivelText.textContent = `Nivel ${userData.nivel || 1}`;
            }
            
            if (xpText) {
                // CORREGIDO: Asegurando Template Literal
                xpText.textContent = `${userData.xp || 0} XP`;
            }

            if (vidasText) {
                // CORREGIDO: Asegurando Template Literal
                vidasText.textContent = `❤️ ${userData.vidas !== undefined ? userData.vidas : 5}`;
            }

            if (energiaText) {
                // CORREGIDO: Asegurando Template Literal
                energiaText.textContent = `⚡ ${userData.energia !== undefined ? userData.energia : 5}`;
            }
        }
    },

    async sincronizarDatos() {
        try {
            console.log("📡 [MenuController] Sincronizando datos del usuario...");
            
            const token = window.Storage.get("token");
            if (!token) {
                console.warn("⚠️ No hay token");
                return;
            }

            // CORREGIDO: Backticks para la URL de la API
            const response = await fetch(`${window.CONFIG.API_URL}/usuario/perfil`, {
                method: "GET",
                headers: {
                    "x-auth-token": token,
                    "Content-Type": "application/json"
                }
            });

            if (!response.ok) {
                // CORREGIDO: Backticks para el log de error
                console.warn(`⚠️ Error al obtener perfil: ${response.status}`);
                return;
            }

            const data = await response.json();
            console.log("📥 [MenuController] Datos recibidos:", data);

            // Actualizar user_data en localStorage
            const datosActualizados = {
                id: data.id,
                nombre: data.nombre,
                email: data.email,
                nivel: data.nivel || 1,
                xp: data.xp || 0,
                racha: data.racha || 0,
                vidas: data.vidas !== undefined ? data.vidas : 5,
                energia: data.energia !== undefined ? data.energia : 5,
                lecciones_completadas: data.lecciones_completadas || 0,
                total_aciertos: data.total_aciertos || 0,
                total_intentos: data.total_intentos || 0,
                logros: data.logros || []
            };

            window.Storage.set("user_data", datosActualizados);
            window.Storage.set("userName", data.nombre || "Estudiante");
            
            console.log("✅ [MenuController] Datos sincronizados");

        } catch (error) {
            console.error("❌ [MenuController] Error sincronizando:", error);
        }
    },

    // Métodos de navegación
    goLearning() { window.location.href = "learning-path.html"; },
    goCalculators() { window.location.href = "calculators.html"; },
    goProfile() { window.location.href = "profile.html"; },
    
    logout() {
        if (confirm("¿Estás seguro de que quieres cerrar sesión?")) {
            // Es mejor limpiar Storage completo si usas un helper
            if (window.Storage && window.Storage.clear) {
                window.Storage.clear();
            } else {
                localStorage.clear();
            }
            window.location.replace("login.html");
        }
    }
};

// Inicialización corregida para evitar doble ejecución
const initOnce = () => {
    if (!window.menuInitialized) {
        window.menuInitialized = true;
        MenuController.init();
    }
};

document.addEventListener("DOMContentLoaded", initOnce);
document.addEventListener("deviceready", initOnce, false);