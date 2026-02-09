// calculators-menu.js

function goBack() {
    window.location.href = 'menu.html';
}

function openCalculator(type) {
    const calculatorPages = {
        'unified': 'calculator-unified.html',
        'kinematics': 'calculator-kinematics.html',
        'energy': 'calculator-energy.html',
        'momentum': 'calculator-momentum.html'
    };

    const page = calculatorPages[type];
    if (page) {
        window.location.href = page;
    }
}
