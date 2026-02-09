// www/js/services/ContentService.js - VERSIÓN CORREGIDA (sin axios)

(function() {
    // Usar la constante global en lugar de URL hardcodeada
    const API_CONTENT = window.CONFIG ? window.CONFIG.API_URL + "/content" : "https://fisica-backend-pro.onrender.com/api/content";

    window.ContentService = {
        /**
         * Obtener la ruta de aprendizaje (módulos)
         * @returns {Promise<Array>}
         */
        async getRutaAprendizaje() {
            try {
                const token = window.Storage.get("token");
                if (!token) {
                    console.warn("⚠️ No hay token, no se puede obtener ruta");
                    return null;
                }

                // Intentar obtener de caché primero (si existe)
                const cached = window.CacheService ? 
                    window.CacheService.get('ruta_aprendizaje') : null;
                
                if (cached) {
                    console.log("📦 Usando ruta de aprendizaje cacheada");
                    return cached;
                }

                // Fetch con timeout
                const controller = new AbortController();
                const timeoutId = setTimeout(() => controller.abort(), 15000);

                const response = await fetch(`${API_CONTENT}/ruta`, {
                    method: "GET",
                    headers: {
                        "x-auth-token": token,
                        "Content-Type": "application/json"
                    },
                    signal: controller.signal
                });

                clearTimeout(timeoutId);

                if (!response.ok) {
                    throw new Error(`HTTP ${response.status}`);
                }

                const data = await response.json();

                // Guardar en caché (si existe el servicio)
                if (window.CacheService) {
                    window.CacheService.set('ruta_aprendizaje', data, 3600000); // 1 hora
                }

                return data;

            } catch (e) {
                if (e.name === 'AbortError') {
                    console.warn("⏱️ Timeout al obtener ruta de aprendizaje");
                } else {
                    console.warn("⚠️ Error al obtener ruta:", e.message);
                }
                
                // Intentar devolver versión cacheada si existe
                const cached = window.CacheService ? 
                    window.CacheService.get('ruta_aprendizaje') : null;
                
                return cached || null;
            }
        },

        /**
         * Obtener lección específica por ID de módulo
         * @param {number} moduloId 
         * @returns {Promise<Object>}
         */
        async getLeccion(moduloId) {
            try {
                const token = window.Storage.get("token");
                if (!token) return null;

                const controller = new AbortController();
                const timeoutId = setTimeout(() => controller.abort(), 15000);

                const response = await fetch(`${API_CONTENT}/leccion/${moduloId}`, {
                    method: "GET",
                    headers: {
                        "x-auth-token": token,
                        "Content-Type": "application/json"
                    },
                    signal: controller.signal
                });

                clearTimeout(timeoutId);

                if (!response.ok) {
                    throw new Error(`HTTP ${response.status}`);
                }

                return await response.json();

            } catch (e) {
                console.warn("⚠️ Error al obtener lección:", e.message);
                return null;
            }
        }
    };
})();
