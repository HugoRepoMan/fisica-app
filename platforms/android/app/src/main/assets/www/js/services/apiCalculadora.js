// www/js/services/apiCalculadora.js - Usando fetch nativo (sin axios)

(function() {
    // Usar ApiService que ya está configurado con fetch
    const CalculadoraService = {
        async calcularFriccion(datos) {
            try {
                const resultado = await window.ApiService.post('/calculadora/friccion', datos);
                return resultado;
            } catch (error) {
                console.error('Error calculando fricción:', error);
                throw error;
            }
        },
        
        async calcularNewton(datos) {
            try {
                const resultado = await window.ApiService.post('/calculadora/newton', datos);
                return resultado;
            } catch (error) {
                console.error('Error calculando Newton:', error);
                throw error;
            }
        },
        
        async calcularPeso(datos) {
            try {
                const resultado = await window.ApiService.post('/calculadora/peso', datos);
                return resultado;
            } catch (error) {
                console.error('Error calculando peso:', error);
                throw error;
            }
        }
    };

    // Exportar globalmente
    window.CalculadoraService = CalculadoraService;
})();
