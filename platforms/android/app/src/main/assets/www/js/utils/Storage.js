window.Storage = {
    set: function(key, value) {
        try {
            localStorage.setItem(key, JSON.stringify(value));
        } catch (e) {
            console.error("Error guardando en LocalStorage del celular", e);
            // Si falla el almacenamiento, al menos el usuario puede seguir navegando
        }
    },
    get: function(key) {
        const data = localStorage.getItem(key);
        if (!data) return null;
        try {
            const parsed = JSON.parse(data);
            // Limpia comillas si es un string (evita el "erick")
            return typeof parsed === 'string' ? parsed.replace(/['"]+/g, '') : parsed;
        } catch (e) {
            return data.replace(/['"]+/g, '');
        }
    },
    remove: function(key) {
        localStorage.removeItem(key);
    },
    clear: function() {
        localStorage.clear();
    }
};