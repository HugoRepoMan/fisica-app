# 📱 FÍSICA APP - FRONTEND v2.0

Aplicación móvil educativa de Física estilo Duolingo con sistema de vidas, energía, XP y logros.

## ✅ CORRECCIONES IMPLEMENTADAS

- ✅ api.js corregido (CONFIG → window.CONFIG)
- ✅ constants.js con detección correcta de Cordova
- ✅ ContentService sin axios
- ✅ UserService con URLs centralizadas
- ✅ Sistema de caché offline
- ✅ Detección de conexión de red
- ✅ Manejo del botón atrás de Android
- ✅ Regeneración automática de vidas

## 🚀 INSTALACIÓN RÁPIDA

```bash
# 1. Extraer el ZIP
unzip fisica-app-frontend-v2.0.zip
cd fisica-app-frontend

# 2. Instalar dependencias
npm install

# 3. Instalar plugins de Cordova
cordova plugin add cordova-plugin-whitelist
cordova plugin add cordova-plugin-device
cordova-plugin add cordova-plugin-network-information
cordova plugin add cordova-plugin-dialogs

# 4. Compilar APK
cordova build android

# 5. Instalar en dispositivo
cordova run android
```

## 📊 ESTRUCTURA

```
fisica-app-frontend/
├── config.xml              # Configuración Cordova
├── package.json
├── www/
│   ├── index.html
│   ├── css/
│   ├── js/
│   │   ├── config/
│   │   │   └── constants.js         # URLs y configuración
│   │   ├── controllers/
│   │   │   ├── AuthController.js
│   │   │   ├── LearningPathController.js
│   │   │   ├── MenuController.js
│   │   │   └── ProfileController.js
│   │   ├── services/
│   │   │   ├── api.js              # CORREGIDO ✅
│   │   │   ├── UserService.js      # CORREGIDO ✅
│   │   │   ├── ContentService.js   # CORREGIDO ✅
│   │   │   └── apiCalculadora.js
│   │   ├── utils/
│   │   │   ├── Storage.js
│   │   │   └── Cache.js            # NUEVO ✅
│   │   └── index.js                # MEJORADO ✅
│   └── pages/
│       ├── login.html
│       ├── register.html
│       ├── menu.html
│       ├── learning-path.html
│       ├── profile.html
│       └── calculators/
└── res/
    ├── icon/
    └── screen/
```

## 🎯 FUNCIONALIDADES

- ✅ Sistema de autenticación (Login/Registro)
- ✅ Perfil de usuario con estadísticas
- ✅ Sistema de vidas (regeneración automática cada 30 min)
- ✅ Sistema de energía
- ✅ XP y niveles
- ✅ Rachas de días consecutivos
- ✅ Ruta de aprendizaje con módulos
- ✅ Lecciones interactivas
- ✅ Calculadoras de física (Newton, Fricción, Peso)
- ✅ Sistema de logros
- ✅ Modo offline con caché
- ✅ Detección de conexión

## ⚙️ CONFIGURACIÓN

La URL del backend se configura automáticamente:

- **Producción (APK):** `https://fisica-backend-pro.onrender.com/api`
- **Desarrollo (localhost):** `http://localhost:3000/api`

Para cambiar la URL, edita `www/js/config/constants.js`

## 🧪 TESTING

### Probar en navegador:
```bash
cordova run browser
# O abrir directamente: www/pages/login.html
```

### Probar en Android:
```bash
# Debug APK
cordova build android
cordova run android

# Ver logs
adb logcat | grep -E "Console|Cordova"
```

## 📝 CREDENCIALES DE PRUEBA

```
Email: d@h.com
Password: 123456
```

## 🔧 TROUBLESHOOTING

### Error: "CONFIG is not defined"
✅ Ya está corregido en esta versión

### No carga los módulos
- Verificar que el backend esté corriendo
- Verificar conexión a internet
- Ver logs en Chrome DevTools (F12)

### APK no compila
```bash
cordova platform remove android
cordova platform add android
cordova build android
```

## 📱 COMPILAR RELEASE APK

```bash
# 1. Generar keystore (solo primera vez)
keytool -genkey -v -keystore fisica-app.keystore -alias fisica -keyalg RSA -keysize 2048 -validity 10000

# 2. Crear build.json
cat > build.json << 'EOF'
{
    "android": {
        "release": {
            "keystore": "fisica-app.keystore",
            "storePassword": "tu-password",
            "alias": "fisica",
            "password": "tu-password"
        }
    }
}
EOF

# 3. Compilar
cordova build android --release

# APK estará en: platforms/android/app/build/outputs/apk/release/
```

## 🌐 BACKEND

Esta app se conecta al backend en:
`https://fisica-backend-pro.onrender.com`

Repositorio del backend: (agregar URL)

## 👥 AUTORES

- **Erick Maigua** - Team ESPE
- Email: ejmiagua1@espe.edu.ec

## 📄 LICENCIA

MIT License

---

**Versión:** 2.0.0  
**Última actualización:** Febrero 2026
