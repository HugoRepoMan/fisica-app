// js/services/progressService.js

// 1. NO USAR IMPORT. El ApiService ya es global.
window.ProgressService = {
    async getProgresoLeccion(moduloId) {
        try {
            // Usamos el ApiService que definimos en api.js
            const response = await window.ApiService.get(`/progreso/${moduloId}`);
            return response ? response.data : null;
        } catch (error) {
            console.error("Error en ProgressService:", error);
            return null;
        }
    }
};