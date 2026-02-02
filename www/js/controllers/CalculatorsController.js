// Asegúrate de que este archivo esté en: www/js/controllers/calculadoras.js
function goBack() {
    window.history.back();
}

function openCalculator(type) {
    console.log("Navegando a:", type);
    switch (type) {
        case 'newton':
            window.location.href = 'newton.html';
            break;
        case 'friction':
            // Esta ruta debe coincidir con el nombre de tu archivo HTML de fricción
            window.location.href = 'friction-calculator.html';
            break;
        case 'weight':
            window.location.href = 'weight.html';
            break;
        default:
            console.error('Calculadora no reconocida:', type);
    }
}

// Inicializar iconos de Lucide
document.addEventListener("DOMContentLoaded", () => {
    if (window.lucide) {
        window.lucide.createIcons();
    }
});