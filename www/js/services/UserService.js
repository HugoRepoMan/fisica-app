// www/js/services/UserService.js - VERSIÓN CORREGIDA

(function() {
    // Usar la constante global en lugar de URL hardcodeada
    const API_URL = window.CONFIG ? window.CONFIG.API_URL + "/auth" : "https://fisica-backend-pro.onrender.com/api/auth";

    window.UserService = {
        /**
         * Login de usuario
         * @param {string} email 
         * @param {string} password 
         * @returns {Promise<Object>}
         */
        login: async function(email, password) {
            try {
                const res = await fetch(`${API_URL}/login`, {
                    method: "POST",
                    headers: { 
                        "Content-Type": "application/json" 
                    },
                    body: JSON.stringify({ 
                        email: email, 
                        password: password 
                    })
                });

                // Verificar respuesta HTTP
                if (!res.ok) {
                    const error = await res.json();
                    return { 
                        error: error.error || `Error ${res.status}: ${res.statusText}` 
                    };
                }

                return await res.json();

            } catch (e) {
                console.error("Error en login:", e);
                return { 
                    error: e.message === "Failed to fetch" 
                        ? "No hay conexión a internet" 
                        : "Error de conexión" 
                };
            }
        },

        /**
         * Registro de nuevo usuario
         * @param {string} nombre 
         * @param {string} email 
         * @param {string} password 
         * @returns {Promise<Object>}
         */
        register: async function(nombre, email, password) {
            try {
                const res = await fetch(`${API_URL}/registro`, {
                    method: "POST",
                    headers: { 
                        "Content-Type": "application/json" 
                    },
                    body: JSON.stringify({ 
                        nombre: nombre, 
                        email: email, 
                        password: password 
                    })
                });

                const data = await res.json();

                // Verificar respuesta HTTP
                if (!res.ok) {
                    return { 
                        error: data.error || `Error ${res.status}: ${res.statusText}` 
                    };
                }

                return data;

            } catch (e) {
                console.error("Error en registro:", e);
                return { 
                    error: e.message === "Failed to fetch"
                        ? "No hay conexión a internet"
                        : "Error de red" 
                };
            }
        },

        /**
         * Obtener perfil del usuario actual
         * @returns {Promise<Object>}
         */
        getProfile: async function() {
            try {
                const token = window.Storage.get("token");
                if (!token) {
                    return { error: "No hay sesión activa" };
                }

                const res = await fetch(`${API_URL.replace('/auth', '/usuario')}/perfil`, {
                    method: "GET",
                    headers: { 
                        "Content-Type": "application/json",
                        "x-auth-token": token
                    }
                });

                if (!res.ok) {
                    const error = await res.json();
                    return { error: error.error || "Error al obtener perfil" };
                }

                return await res.json();

            } catch (e) {
                console.error("Error al obtener perfil:", e);
                return { error: "Error de conexión" };
            }
        }
    };
})();
