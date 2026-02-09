// www/js/index.js - VERSIÓN MEJORADA con Network Detection

// =====================================================
// EVENTO PRINCIPAL
// =====================================================
document.addEventListener("deviceready", onDeviceReady, false);

function onDeviceReady() {
    console.log("✅ Device ready");
    console.log("📱 Platform:", device ? device.platform : "Browser");
    
    // Configurar detección de red
    setupNetworkDetection();
    
    // Verificar sesión después de un pequeño delay
    setTimeout(checkSession, 300);
}

// =====================================================
// DETECCIÓN DE RED
// =====================================================
function setupNetworkDetection() {
    // Verificar estado inicial
    checkNetworkStatus();
    
    // Escuchar eventos de red
    document.addEventListener("offline", onOffline, false);
    document.addEventListener("online", onOnline, false);
    
    // Si hay plugin de red, verificar tipo de conexión
    if (navigator.connection) {
        console.log("🌐 Tipo de conexión:", navigator.connection.type);
    }
}

function checkNetworkStatus() {
    if (!navigator.onLine) {
        console.warn("📡 Sin conexión a internet");
        showOfflineNotification();
    }
}

function onOffline() {
    console.warn("📡 Conexión perdida");
    showOfflineNotification();
}

function onOnline() {
    console.log("📡 Conexión restaurada");
    hideOfflineNotification();
    
    // Opcional: Recargar datos cuando vuelva la conexión
    if (window.ContentService && window.ContentService.getRutaAprendizaje) {
        window.ContentService.getRutaAprendizaje();
    }
}

function showOfflineNotification() {
    // Evitar duplicados
    if (document.getElementById('offline-banner')) return;
    
    const banner = document.createElement('div');
    banner.id = 'offline-banner';
    banner.style.cssText = `
        position: fixed;
        top: 0;
        left: 0;
        right: 0;
        background: #f44336;
        color: white;
        padding: 12px;
        text-align: center;
        z-index: 99999;
        font-size: 14px;
        box-shadow: 0 2px 5px rgba(0,0,0,0.2);
        animation: slideDown 0.3s ease;
    `;
    banner.innerHTML = `
        <span style="font-size: 16px; margin-right: 8px;">⚠️</span>
        <strong>Sin conexión a internet</strong>
        <div style="font-size: 12px; margin-top: 4px; opacity: 0.9;">
            Algunas funciones pueden no estar disponibles
        </div>
    `;
    
    document.body.prepend(banner);
}

function hideOfflineNotification() {
    const banner = document.getElementById('offline-banner');
    if (banner) {
        banner.style.animation = 'slideUp 0.3s ease';
        setTimeout(() => banner.remove(), 300);
    }
}

// =====================================================
// VERIFICACIÓN DE SESIÓN
// =====================================================
function checkSession() {
    try {
        const token = localStorage.getItem('token');

        if (token && token !== "null" && token !== "undefined") {
            console.log("✅ Sesión activa encontrada");
            
            // Verificar que el token sea válido (opcional)
            validateToken(token);
            
            window.location.replace("pages/menu.html");
        } else {
            console.log("❌ No hay sesión activa");
            window.location.replace("pages/login.html");
        }
    } catch (e) {
        console.error("Error al verificar sesión:", e);
        window.location.replace("pages/login.html");
    }
}

/**
 * Validar token (opcional pero recomendado)
 */
function validateToken(token) {
    try {
        // Decodificar JWT sin verificar (solo para ver si está expirado)
        const payload = JSON.parse(atob(token.split('.')[1]));
        
        if (payload.exp) {
            const now = Date.now() / 1000;
            if (now > payload.exp) {
                console.warn("⚠️ Token expirado, limpiando sesión");
                localStorage.clear();
                window.location.replace("pages/login.html");
            }
        }
    } catch (e) {
        console.error("Error al validar token:", e);
    }
}

// =====================================================
// MANEJO DEL BOTÓN ATRÁS (Android)
// =====================================================
document.addEventListener("backbutton", onBackButton, false);

function onBackButton(e) {
    e.preventDefault();
    
    const currentPage = window.location.pathname;
    console.log("🔙 Back button presionado en:", currentPage);
    
    // En páginas principales, confirmar salida
    if (currentPage.includes('menu.html') || currentPage.includes('index.html')) {
        // Si hay plugin de dialogs, usarlo
        if (navigator.notification && navigator.notification.confirm) {
            navigator.notification.confirm(
                '¿Deseas salir de la aplicación?',
                function(buttonIndex) {
                    if (buttonIndex === 1) { // Primer botón (Sí)
                        if (navigator.app) {
                            navigator.app.exitApp();
                        }
                    }
                },
                'Salir',
                ['Sí', 'Cancelar']
            );
        } else {
            // Fallback a confirm nativo
            if (confirm('¿Deseas salir de la aplicación?')) {
                if (navigator.app) {
                    navigator.app.exitApp();
                }
            }
        }
    } else {
        // En otras páginas, volver atrás
        window.history.back();
    }
}

// =====================================================
// MANEJO DE PAUSA/RESUME (Android)
// =====================================================
document.addEventListener("pause", onPause, false);
document.addEventListener("resume", onResume, false);

function onPause() {
    console.log("⏸️ App pausada");
    // Guardar estado si es necesario
}

function onResume() {
    console.log("▶️ App resumida");
    
    // Verificar conexión al volver
    checkNetworkStatus();
    
    // Actualizar datos si han pasado más de 5 minutos
    const lastUpdate = localStorage.getItem('last_data_update');
    if (lastUpdate) {
        const minutesSinceUpdate = (Date.now() - parseInt(lastUpdate)) / 1000 / 60;
        if (minutesSinceUpdate > 5) {
            console.log("🔄 Han pasado >5 min, actualizando datos...");
            // Actualizar datos aquí
        }
    }
}

// =====================================================
// ESTILOS PARA ANIMACIONES
// =====================================================
const style = document.createElement('style');
style.textContent = `
    @keyframes slideDown {
        from { transform: translateY(-100%); }
        to { transform: translateY(0); }
    }
    @keyframes slideUp {
        from { transform: translateY(0); }
        to { transform: translateY(-100%); }
    }
`;
document.head.appendChild(style);
