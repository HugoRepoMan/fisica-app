// www/js/services/api.js - CORREGIDO

window.ApiService = {

    async request(method, endpoint, body = null) {
        const token = window.Storage ? window.Storage.get(window.CONFIG.STORAGE_KEYS.TOKEN) : localStorage.getItem(window.CONFIG.STORAGE_KEYS.TOKEN);

        const controller = new AbortController();
        setTimeout(() => controller.abort(), window.CONFIG.FETCH_CONFIG.TIMEOUT);

        try {
            const res = await fetch(`${window.CONFIG.API_URL}${endpoint}`, {
                method,
                headers: {
                    ...window.CONFIG.FETCH_CONFIG.HEADERS,
                    ...(token ? { 'x-auth-token': token } : {})
                },
                body: body ? JSON.stringify(body) : null,
                signal: controller.signal
            });

            // 🚨 RATE LIMIT
            if (res.status === 429) {
                alert("⚠️ Demasiadas solicitudes. Espera 15 minutos.");
                return null;
            }

            // 🚨 TOKEN EXPIRADO
            if (res.status === 401) {
                localStorage.clear();
                window.location.replace(window.CONFIG.ROUTES.LOGIN);
                return null;
            }

            if (!res.ok) {
                const error = await res.text();
                throw new Error(error);
            }

            return await res.json();

        } catch (err) {
            console.error("❌ API ERROR:", err.message);
            return null;
        }
    },

    get(endpoint) {
        return this.request('GET', endpoint);
    },

    post(endpoint, data) {
        return this.request('POST', endpoint, data);
    }
};
