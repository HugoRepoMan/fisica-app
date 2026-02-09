/**
 * LessonController - Proyecto Team ESPE
 * Gestiona lecciones, vidas y XP con navegación blindada.
 */

window.LessonController = {
    currentLesson: null,
    userVidas: 0,
    userXP: 0,

    // 1. Inicialización
    async init() {
        console.log("Controlador de lección iniciado...");
        
        // Cargar datos locales
        const userData = window.Storage.get("user_data");
        if (userData) {
            this.userVidas = userData.vidas;
            this.userXP = userData.xp;
        }

        this.renderVidas();
        this.cargarContenido();

        // 2. ROMPER EL BUCLE: Capturar el botón físico de atrás (Android)
        document.addEventListener("backbutton", (e) => {
            e.preventDefault(); // Evita la navegación por defecto
            this.salirDeLeccion();
        }, false);
    },

    // 3. Cargar datos del servidor de Hugo (Render)
    async cargarContenido() {
        const lessonId = window.Storage.get("current_modulo_id");
        
        if (!lessonId) {
            this.salirDeLeccion();
            return;
        }

        try {
            const response = await window.ApiService.get(`/lecciones/${lessonId}`);
            if (response && response.data) {
                this.currentLesson = response.data;
                this.renderLeccion();
            }
        } catch (error) {
            console.error("Error cargando lección:", error);
        }
    },

    // 4. Lógica de error (Vidas)
    async manejarError() {
        if (this.userVidas > 0) {
            this.userVidas -= 1;
            
            const userData = window.Storage.get("user_data");
            userData.vidas = this.userVidas;
            window.Storage.set("user_data", userData);

            try {
                await window.ApiService.post('/usuarios/actualizar-vidas', { 
                    vidas: this.userVidas 
                });
            } catch (err) {
                console.warn("Error de sincronización con Render");
            }

            this.renderVidas();
            alert("¡Incorrecto! Pierdes una vida ❤️");
        }

        if (this.userVidas <= 0) {
            alert("Te has quedado sin vidas. Regresando al menú...");
            this.salirDeLeccion();
        }
    },

    // 5. Finalizar (XP y Progreso)
    async finalizarLeccion() {
        const moduloId = window.Storage.get("current_modulo_id");
        const recompensa = 20;

        try {
            const response = await window.ApiService.post('/progreso/completar', {
                moduloId: moduloId,
                xp: recompensa
            });

            if (response) {
                this.userXP += recompensa;
                const userData = window.Storage.get("user_data");
                userData.xp = this.userXP;
                window.Storage.set("user_data", userData);

                alert(`¡Felicidades! Ganaste ${recompensa} XP`);
                this.salirDeLeccion();
            }
        } catch (error) {
            console.error("No se pudo guardar progreso en Aiven");
        }
    },

    // 6. FUNCIÓN CLAVE: Salida Limpia
    // Reemplaza la entrada actual en el historial para que 'Atrás' no regrese aquí.
    salirDeLeccion() {
        window.location.replace("learning-path.html");
    },

    renderVidas() {
        const el = document.getElementById("livesCount");
        if (el) el.innerText = `❤️ x${this.userVidas}`;
    }
};

document.addEventListener("DOMContentLoaded", () => window.LessonController.init());