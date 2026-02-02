function goBack() {
    window.history.back();
}

function openCalculator(type) {
    console.log("Abriendo:", type);
    switch (type) {
        case 'newton':
            window.location.href = 'newton.html';
            break;
        case 'friction':
            // Verifica que este nombre sea igual al de tu archivo HTML
            window.location.href = 'calculator-friction.html';
            break;
        case 'weight':
            window.location.href = 'weight.html';
            break;
        default:
            console.error('Calculadora no encontrada:', type);
    }
}