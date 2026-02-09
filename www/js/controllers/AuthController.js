/**
 * AuthController.js - VERSIÓN FINAL CON UI MEJORADA
 * Login / Registro con validaciones, mensajes bonitos y loading
 */

console.log("🔐 [AuthController] Cargado");

// ===============================
// VALIDACIONES
// ===============================
function validarEmail(email) {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

function validarPassword(password) {
    if (typeof password !== "string") return false;
    if (password.length < 8) return false;
    const hasLetter = /[a-zA-Z]/.test(password);
    const hasNumber = /\d/.test(password);
    return hasLetter && hasNumber;
}

// ===============================
// UI: MENSAJES BONITOS
// ===============================
function mostrarMensaje(mensaje, tipo = 'error') {
    const container = document.getElementById("alert-container");
    if (!container) {
        alert(mensaje);
        return;
    }

    const iconos = {
        'error': '❌',
        'success': '✅',
        'info': 'ℹ️',
        'warning': '⚠️'
    };

    const colores = {
        'error': '#fee2e2',
        'success': '#d1fae5',
        'info': '#dbeafe',
        'warning': '#fef3c7'
    };

    const textColores = {
        'error': '#991b1b',
        'success': '#065f46',
        'info': '#1e40af',
        'warning': '#92400e'
    };

    container.innerHTML = `
        <div style="
            background: ${colores[tipo]};
            color: ${textColores[tipo]};
            padding: 16px 20px;
            border-radius: 12px;
            margin-bottom: 20px;
            display: flex;
            align-items: center;
            gap: 12px;
            font-size: 15px;
            font-weight: 500;
            box-shadow: 0 2px 8px rgba(0,0,0,0.1);
            animation: slideIn 0.3s ease;
        ">
            <span style="font-size: 20px;">${iconos[tipo]}</span>
            <span>${mensaje}</span>
        </div>
    `;

    setTimeout(() => {
        container.innerHTML = '';
    }, 4000);
}

// ===============================
// UI: LOADING SPINNER
// ===============================
function mostrarLoading(boton, estado = true) {
    if (estado) {
        boton.disabled = true;
        boton.dataset.textoOriginal = boton.textContent;
        boton.innerHTML = `
            <span style="display: inline-block; width: 16px; height: 16px; border: 2px solid white; border-top: 2px solid transparent; border-radius: 50%; animation: spin 0.6s linear infinite;"></span>
            <span style="margin-left: 8px;">Procesando...</span>
        `;
    } else {
        boton.disabled = false;
        boton.textContent = boton.dataset.textoOriginal || 'Enviar';
    }
}

// ===============================
// CAMBIO DE PESTAÑAS
// ===============================
window.toggleAuthView = function (mode) {
    const loginForm = document.getElementById("loginForm");
    const registerForm = document.getElementById("registerForm");
    const tabLogin = document.getElementById("tabLogin");
    const tabRegister = document.getElementById("tabRegister");

    if (!loginForm || !registerForm) return;

    if (mode === "login") {
        loginForm.classList.remove("hidden");
        registerForm.classList.add("hidden");
        tabLogin?.classList.add("active");
        tabRegister?.classList.remove("active");
    } else {
        loginForm.classList.add("hidden");
        registerForm.classList.remove("hidden");
        tabLogin?.classList.remove("active");
        tabRegister?.classList.add("active");
    }

    // Limpiar mensajes
    const container = document.getElementById("alert-container");
    if (container) container.innerHTML = '';
};

// ===============================
// FUNCIÓN DE INICIALIZACIÓN
// ===============================
function initAuth() {
    console.log("✅ [AuthController] Inicializando...");

    // Verificar dependencias
    if (typeof window.UserService === 'undefined') {
        console.error("❌ [AuthController] UserService no disponible");
        return;
    }

    if (typeof window.Storage === 'undefined') {
        console.error("❌ [AuthController] Storage no disponible");
        return;
    }

    console.log("📦 [AuthController] Dependencias verificadas");

    const loginForm = document.getElementById("loginForm");
    const registerForm = document.getElementById("registerForm");

    // ===============================
    // LOGIN
    // ===============================
    if (loginForm) {
        console.log("🔑 [AuthController] Configurando formulario de login");
        
        loginForm.addEventListener("submit", async (e) => {
            e.preventDefault();
            console.log("🔑 [Login] Formulario enviado");

            const email = document.getElementById("loginEmail")?.value.trim();
            const password = document.getElementById("loginPassword")?.value.trim();
            const submitBtn = loginForm.querySelector('button[type="submit"]');

            console.log("📧 [Login] Email:", email);

            // Validaciones con mensajes bonitos
            if (!email || !password) {
                mostrarMensaje("Por favor completa todos los campos", "warning");
                return;
            }

            if (!validarEmail(email)) {
                mostrarMensaje("El email no es válido", "error");
                return;
            }

            if (!validarPassword(password)) {
                mostrarMensaje("La contraseña debe tener al menos 8 caracteres, con letras y números", "error");
                return;
            }

            console.log("✅ [Login] Validaciones pasadas, llamando a UserService...");

            // Mostrar loading
            mostrarLoading(submitBtn, true);

            try {
                const result = await window.UserService.login(email, password);
                console.log("📥 [Login] Respuesta recibida:", result);

                if (result?.token) {
                    console.log("✅ [Login] Login exitoso, guardando datos");
                    
                    // Guardar token
                    window.Storage.set("token", result.token);
                    
                    // Guardar datos del usuario COMPLETOS
                    if (result.usuario) {
                        window.Storage.set("user_data", {
                            id: result.usuario.id,
                            nombre: result.usuario.nombre,
                            email: email,
                            nivel: result.usuario.nivel || 1,
                            xp: result.usuario.xp || 0,
                            racha: result.usuario.racha || 0,
                            vidas: result.usuario.vidas !== undefined ? result.usuario.vidas : 5,
                            energia: result.usuario.energia !== undefined ? result.usuario.energia : 5,
                            logros: result.usuario.logros || [],
                            lecciones_completadas: result.usuario.lecciones_completadas || 0,
                            lecciones_completadas_ids: Array.isArray(result.usuario.lecciones_completadas_ids) 
                                ? result.usuario.lecciones_completadas_ids 
                                : [],
                            total_aciertos: result.usuario.total_aciertos || 0,
                            total_intentos: result.usuario.total_intentos || 0,
                            precision: 0,
                            ultima_regeneracion: Date.now(),
                            ultima_leccion_fecha: result.usuario.ultima_leccion_fecha || null
                        });
                        
                        // Guardar userName por separado para fácil acceso
                        window.Storage.set("userName", result.usuario.nombre);
                    }
                    
                    window.Storage.set("isLoggedIn", true);

                    // Mensaje de éxito
                    mostrarMensaje("¡Bienvenido! Redirigiendo...", "success");
                    
                    // Esperar un momento para que se vea el mensaje
                    setTimeout(() => {
                        console.log("🚀 [Login] Redirigiendo a menu.html");
                        window.location.replace("menu.html");
                    }, 800);
                } else {
                    console.error("❌ [Login] Error:", result?.error);
                    mostrarMensaje(result?.error || "Credenciales incorrectas", "error");
                    mostrarLoading(submitBtn, false);
                }
            } catch (err) {
                console.error("❌ [Login] Excepción:", err);
                mostrarMensaje("Error de conexión. Verifica tu internet.", "error");
                mostrarLoading(submitBtn, false);
            }
        });
    } else {
        console.warn("⚠️ [AuthController] loginForm no encontrado");
    }

    // ===============================
    // REGISTRO
    // ===============================
    if (registerForm) {
        console.log("📝 [AuthController] Configurando formulario de registro");
        
        registerForm.addEventListener("submit", async (e) => {
            e.preventDefault();
            console.log("📝 [Register] Formulario enviado");

            const nombre = document.getElementById("registerName")?.value.trim();
            const email = document.getElementById("registerEmail")?.value.trim();
            const password = document.getElementById("registerPassword")?.value.trim();
            const submitBtn = registerForm.querySelector('button[type="submit"]');

            console.log("👤 [Register] Nombre:", nombre);
            console.log("📧 [Register] Email:", email);

            // Validaciones con mensajes bonitos
            if (!nombre || !email || !password) {
                mostrarMensaje("Por favor completa todos los campos", "warning");
                return;
            }

            if (nombre.length < 3) {
                mostrarMensaje("El nombre debe tener al menos 3 caracteres", "error");
                return;
            }

            if (!validarEmail(email)) {
                mostrarMensaje("El email no es válido", "error");
                return;
            }

            if (!validarPassword(password)) {
                mostrarMensaje("La contraseña debe tener al menos 8 caracteres, con letras y números", "error");
                return;
            }

            console.log("✅ [Register] Validaciones pasadas, llamando a UserService...");

            // Mostrar loading
            mostrarLoading(submitBtn, true);

            try {
                const result = await window.UserService.register(nombre, email, password);
                console.log("📥 [Register] Respuesta recibida:", result);

                if (!result?.error) {
                    console.log("✅ [Register] Registro exitoso");
                    
                    // Si el registro devuelve token directamente
                    if (result.token) {
                        window.Storage.set("token", result.token);
                        
                        if (result.usuario) {
                            window.Storage.set("user_data", {
                                id: result.usuario.id,
                                nombre: result.usuario.nombre,
                                email: email,
                                nivel: result.usuario.nivel || 1,
                                xp: result.usuario.xp || 0,
                                racha: 0,
                                vidas: result.usuario.vidas || 5,
                                energia: result.usuario.energia || 5,
                                logros: [],
                                lecciones_completadas: 0,
                                lecciones_completadas_ids: [],
                                total_aciertos: 0,
                                total_intentos: 0,
                                precision: 0,
                                ultima_regeneracion: Date.now(),
                                ultima_leccion_fecha: null
                            });
                            
                            window.Storage.set("userName", result.usuario.nombre);
                        }
                        
                        window.Storage.set("isLoggedIn", true);
                        
                        mostrarMensaje("¡Cuenta creada! Redirigiendo...", "success");
                        
                        setTimeout(() => {
                            console.log("🚀 [Register] Redirigiendo a menu.html");
                            window.location.replace("menu.html");
                        }, 800);
                    } else {
                        // Si necesita auto-login
                        console.log("✅ [Register] Haciendo auto-login...");
                        mostrarMensaje("Cuenta creada, iniciando sesión...", "success");
                        
                        setTimeout(async () => {
                            const autoLogin = await window.UserService.login(email, password);
                            
                            if (autoLogin?.token) {
                                window.Storage.set("token", autoLogin.token);
                                
                                if (autoLogin.usuario) {
                                    window.Storage.set("user_data", {
                                        id: autoLogin.usuario.id,
                                        nombre: autoLogin.usuario.nombre,
                                        email: email,
                                        nivel: autoLogin.usuario.nivel || 1,
                                        xp: autoLogin.usuario.xp || 0,
                                        racha: autoLogin.usuario.racha || 0,
                                        vidas: autoLogin.usuario.vidas !== undefined ? autoLogin.usuario.vidas : 5,
                                        energia: autoLogin.usuario.energia !== undefined ? autoLogin.usuario.energia : 5,
                                        logros: autoLogin.usuario.logros || [],
                                        lecciones_completadas: autoLogin.usuario.lecciones_completadas || 0,
                                        lecciones_completadas_ids: Array.isArray(autoLogin.usuario.lecciones_completadas_ids)
                                            ? autoLogin.usuario.lecciones_completadas_ids
                                            : [],
                                        total_aciertos: 0,
                                        total_intentos: 0,
                                        precision: 0,
                                        ultima_regeneracion: Date.now(),
                                        ultima_leccion_fecha: null
                                    });
                                    
                                    window.Storage.set("userName", autoLogin.usuario.nombre);
                                }
                                
                                window.Storage.set("isLoggedIn", true);
                                
                                window.location.replace("menu.html");
                            } else {
                                mostrarMensaje("Cuenta creada. Por favor inicia sesión.", "info");
                                mostrarLoading(submitBtn, false);
                                setTimeout(() => {
                                    window.toggleAuthView('login');
                                }, 2000);
                            }
                        }, 1000);
                    }
                } else {
                    console.error("❌ [Register] Error:", result.error);
                    mostrarMensaje(result.error, "error");
                    mostrarLoading(submitBtn, false);
                }
            } catch (err) {
                console.error("❌ [Register] Excepción:", err);
                mostrarMensaje("Error de conexión. Verifica tu internet.", "error");
                mostrarLoading(submitBtn, false);
            }
        });
    } else {
        console.warn("⚠️ [AuthController] registerForm no encontrado");
    }

    console.log("✅ [AuthController] Inicialización completada");
}

// ===============================
// INICIALIZACIÓN CON MÚLTIPLES ESTRATEGIAS
// ===============================
let deviceReadyFired = false;

document.addEventListener("deviceready", () => {
    console.log("📱 [AuthController] deviceready disparado");
    deviceReadyFired = true;
    initAuth();
}, false);

document.addEventListener("DOMContentLoaded", () => {
    console.log("🌐 [AuthController] DOMContentLoaded disparado");
    
    setTimeout(() => {
        if (!deviceReadyFired) {
            console.log("⏰ [AuthController] deviceready no disparado, inicializando de todos modos");
            initAuth();
        }
    }, 1000);
});

window.addEventListener('load', () => {
    console.log("📄 [AuthController] window.load disparado");
    
    setTimeout(() => {
        if (!deviceReadyFired && !document.getElementById("loginForm")?.dataset.initialized) {
            console.log("🔄 [AuthController] Fallback: inicializando...");
            initAuth();
        }
    }, 2000);
});

// ===============================
// ESTILOS PARA ANIMACIONES
// ===============================
const style = document.createElement('style');
style.textContent = `
    @keyframes slideIn {
        from {
            opacity: 0;
            transform: translateY(-10px);
        }
        to {
            opacity: 1;
            transform: translateY(0);
        }
    }
    
    @keyframes spin {
        to { transform: rotate(360deg); }
    }
`;
document.head.appendChild(style);

console.log("✅ [AuthController] Event listeners configurados");
