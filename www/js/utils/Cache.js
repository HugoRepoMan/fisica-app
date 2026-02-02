// www/js/utils/Cache.js
// Sistema de caché simple para modo offline

(function() {
    window.CacheService = {
        /**
         * Guardar datos en caché con tiempo de expiración
         * @param {string} key - Clave única
         * @param {any} data - Datos a cachear
         * @param {number} ttl - Tiempo de vida en milisegundos (default: 1 hora)
         */
        set: function(key, data, ttl = 3600000) {
            try {
                const item = {
                    data: data,
                    expiry: new Date().getTime() + ttl,
                    timestamp: new Date().toISOString()
                };
                
                localStorage.setItem(`cache_${key}`, JSON.stringify(item));
                console.log(`💾 Cacheado: ${key} (expira en ${ttl/1000/60} min)`);
                
            } catch (e) {
                console.error("Error al guardar en caché:", e);
            }
        },

        /**
         * Obtener datos del caché
         * @param {string} key - Clave única
         * @returns {any|null} - Datos o null si no existe o expiró
         */
        get: function(key) {
            try {
                const itemStr = localStorage.getItem(`cache_${key}`);
                if (!itemStr) return null;
                
                const item = JSON.parse(itemStr);
                
                // Verificar si expiró
                if (new Date().getTime() > item.expiry) {
                    console.log(`⏰ Caché expirado: ${key}`);
                    localStorage.removeItem(`cache_${key}`);
                    return null;
                }
                
                console.log(`📦 Caché hit: ${key}`);
                return item.data;
                
            } catch (e) {
                console.error("Error al leer caché:", e);
                return null;
            }
        },

        /**
         * Eliminar entrada específica del caché
         * @param {string} key 
         */
        delete: function(key) {
            try {
                localStorage.removeItem(`cache_${key}`);
                console.log(`🗑️ Caché eliminado: ${key}`);
            } catch (e) {
                console.error("Error al eliminar caché:", e);
            }
        },

        /**
         * Limpiar todo el caché
         */
        clear: function() {
            try {
                const keys = Object.keys(localStorage);
                let count = 0;
                
                keys.forEach(key => {
                    if (key.startsWith('cache_')) {
                        localStorage.removeItem(key);
                        count++;
                    }
                });
                
                console.log(`🗑️ Caché limpiado: ${count} entradas`);
            } catch (e) {
                console.error("Error al limpiar caché:", e);
            }
        },

        /**
         * Limpiar caché expirado
         */
        cleanExpired: function() {
            try {
                const keys = Object.keys(localStorage);
                let count = 0;
                
                keys.forEach(key => {
                    if (key.startsWith('cache_')) {
                        try {
                            const item = JSON.parse(localStorage.getItem(key));
                            if (new Date().getTime() > item.expiry) {
                                localStorage.removeItem(key);
                                count++;
                            }
                        } catch (e) {
                            // Si no se puede parsear, eliminar
                            localStorage.removeItem(key);
                            count++;
                        }
                    }
                });
                
                if (count > 0) {
                    console.log(`🗑️ Caché expirado limpiado: ${count} entradas`);
                }
            } catch (e) {
                console.error("Error al limpiar caché expirado:", e);
            }
        },

        /**
         * Obtener estadísticas del caché
         * @returns {Object}
         */
        stats: function() {
            try {
                const keys = Object.keys(localStorage);
                const cacheKeys = keys.filter(k => k.startsWith('cache_'));
                
                let totalSize = 0;
                let expired = 0;
                const now = new Date().getTime();
                
                cacheKeys.forEach(key => {
                    const itemStr = localStorage.getItem(key);
                    totalSize += itemStr.length;
                    
                    try {
                        const item = JSON.parse(itemStr);
                        if (now > item.expiry) expired++;
                    } catch (e) {}
                });
                
                return {
                    total: cacheKeys.length,
                    expired: expired,
                    size: `${(totalSize / 1024).toFixed(2)} KB`
                };
            } catch (e) {
                console.error("Error al obtener stats:", e);
                return { total: 0, expired: 0, size: '0 KB' };
            }
        }
    };

    // Limpiar caché expirado al iniciar
    document.addEventListener("deviceready", function() {
        window.CacheService.cleanExpired();
    });
})();
