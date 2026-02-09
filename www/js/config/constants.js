// www/js/config/constants.js

(function () {
    const isCordova = typeof window.cordova !== 'undefined' || 
                      document.URL.indexOf('http://') === -1 && 
                      document.URL.indexOf('https://') === -1;
    
    const isRealLocalhost = window.location.hostname === 'localhost' || 
                            window.location.hostname === '127.0.0.1';
    
    const isDevelopment = isRealLocalhost && !isCordova;

    const API_URL = isDevelopment
        ? 'http://localhost:3000/api'
        : 'https://fisica-backend-pro.onrender.com/api';

    console.log('🌍 Entorno:', isDevelopment ? 'DESARROLLO' : 'PRODUCCIÓN');
    console.log('📱 Es Cordova:', isCordova);
    console.log('🔗 API URL:', API_URL);

    window.CONFIG = {
        API_URL,
        ROUTES: {
            LOGIN: "login.html",
            REGISTER: "register.html",
            HOME: "menu.html"
        },
        STORAGE_KEYS: {
            TOKEN: 'token',
            USER_DATA: 'user_data',
            USER_NAME: 'userName'
        },
        GAME_CONFIG: {
            MAX_VIDAS: 5,
            MAX_ENERGIA: 5,
            XP_POR_NIVEL: 100
        },
        FETCH_CONFIG: {
            TIMEOUT: 15000,
            HEADERS: {
                'Content-Type': 'application/json'
            }
        }
    };
})();
