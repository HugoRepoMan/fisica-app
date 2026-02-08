# 🔥 Implementación de Racha (Streak) en Frontend

## Resumen de Cambios Backend

Se agregó la lógica de **racha/streak** automáticamente en el servidor. La racha ahora se calcula y almacena en la BD cuando el usuario completa una lección.

### Cambios Realizados:

1. **Nueva columna en BD**: `fecha_ultima_leccion` (DATE) - rastrea la última fecha en que se completó una lección
2. **Lógica de cálculo de racha** en `POST /api/progreso/completar`:
   - Si es la **primera lección**: racha = 1
   - Si **completó hoy**: racha se mantiene (no duplica si hace varias lecciones en el mismo día)
   - Si **completó ayer y hoy**: racha += 1 (consecutivo)
   - Si **pasaron 2+ días** sin lecciones: racha se resetea a 1

---

## ¿Qué Debe Hacer el Frontend?

**Nada especial.** La racha se actualiza automáticamente en el backend. Sin embargo, aquí está lo que el frontend **recibe** y **puede mostrar**:

### 1. Respuesta de Completar Lección

```http
POST /api/progreso/completar
Content-Type: application/json
x-auth-token: <TOKEN>

{
  "puntaje": 8,
  "total_preguntas": 10,
  "xp": 28
}
```

**Respuesta (200 OK):**

```json
{
  "msg": "¡Lección completada!",
  "resumen": {
    "xp_ganada": 28,
    "nuevo_total_xp": 150,
    "nueva_energia": 3,
    "subio_nivel": false,
    "nuevo_nivel": 1,
    "lecciones_completadas": 15,
    "racha": 7
  }
}
```

### 2. Obtener Perfil del Usuario

```http
GET /api/usuario/perfil
x-auth-token: <TOKEN>
```

**Respuesta (200 OK):**

```json
{
  "id": 42,
  "nombre": "Juan",
  "email": "juan@example.com",
  "nivel": 2,
  "xp": 450,
  "vidas": 4,
  "energia": 5,
  "racha": 7,
  "logros": [1, 5, 8]
}
```

---

## Información para Mostrar en la UI

### Elementos Recomendados:

**1. Indicador de Racha en la Pantalla Principal:**
```
🔥 Racha: 7 días
```

**2. Feedback al Completar Lección:**
```
✅ ¡Lección completada!
+28 XP
🔥 Racha: 7 días consecutivos
```

**3. Tarjeta de Perfil:**
```
┌─────────────────┐
│ Usuario: Juan   │
│ Nivel 2         │
│ XP: 450/600     │
│ 🔥 Racha: 7     │
└─────────────────┘
```

---

## Logro: "Racha de Fuego" 🔥

Ya existe en la BD un logro llamado **"Racha de Fuego"** que se otorga cuando el usuario mantiene una racha de **7 días consecutivos**.

**Detalles del logro:**
- **ID**: 4 (o verificar en la BD)
- **Título**: "Racha de Fuego"
- **Descripción**: "Mantén una racha de 7 días consecutivos"
- **Ícono**: 🔥
- **Tipo**: constancia

### Para Detectar y Mostrar el Desbloqueo:

Cuando `racha === 7` (o mayor), puedes:
1. Mostrar un modal: "🔥 ¡Dessbloqueaste 'Racha de Fuego'!"
2. Verificar en el endpoint `/api/usuario/logros` si el logro 4 está en `desbloqueado: true`

```http
GET /api/usuario/logros
x-auth-token: <TOKEN>
```

```json
{
  "id": 4,
  "titulo": "Racha de Fuego",
  "descripcion": "Mantén una racha de 7 días consecutivos",
  "icono": "🔥",
  "desbloqueado": true
}
```

---

## Ejemplos de Implementación

### React / JavaScript:

```javascript
// Después de completar lección
const handleCompletarLeccion = async (puntaje, totalPreguntas, xp) => {
  const res = await fetch('/api/progreso/completar', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-auth-token': userToken
    },
    body: JSON.stringify({ puntaje, total_preguntas: totalPreguntas, xp })
  });

  const data = await res.json();
  
  // Mostrar racha actualizada
  console.log(`🔥 Racha actual: ${data.resumen.racha}`);
  
  // Mostrar feedback especial si racha alcanza 7
  if (data.resumen.racha === 7) {
    showModal("🔥 ¡Dessbloqueaste Racha de Fuego!");
  }
};

// En el perfil del usuario
const handleObtenerPerfil = async () => {
  const res = await fetch('/api/usuario/perfil', {
    headers: { 'x-auth-token': userToken }
  });

  const usuario = await res.json();
  
  // Mostrar racha en la UI
  document.querySelector('.racha-display').textContent = `🔥 ${usuario.racha}`;
};
```

---

## Notas Importantes

1. **La racha NO se incrementa por lecciones múltiples en el mismo día.**
   - Si el usuario completa 5 lecciones hoy, la racha sigue siendo la misma.
   - Solo se incrementa si completa una lección en un día diferente (y consecutivo).

2. **La racha se resetea después de 1 día sin lecciones.**
   - Ejemplo: Si completó el lunes y no hace nada hasta el miércoles, la racha se resetea a 1.

3. **El backend convierte automáticamente la fecha actual a `YYYY-MM-DD`.**
   - No importa la zona horaria del cliente; el servidor usa la fecha inteligentemente.

4. **Validación de Logros**:
   - El logro "Racha de Fuego" se otorga automáticamente cuando `racha >= 7` (aún no implementado, pero está lista la tabla).
   - Sugerencia: agregar trigger en DB o lógica en `progressController` para otorgar logro automáticamente.

---

## Próximos Pasos (Opcional)

Si lo deseas, se puede:
1. **Agregar animaciones** cuando racha alcanza hitos (3, 7, 14, 30 días)
2. **Mostrar contador regresivo** de días para perder la racha ("Completa una lección en 24h para mantener tu racha")
3. **Crear un ranking de rachas** en la pantalla de ranking
4. **Enviar notificaciones** cuando está cerca de perder la racha

---

## Comandos Útiles para Testear

**Verificar racha en BD:**
```sql
SELECT id, nombre, racha, fecha_ultima_leccion FROM usuarios WHERE id = 42;
```

**Resetear racha (si necesitas testear):**
```sql
UPDATE usuarios SET racha = 0, fecha_ultima_leccion = NULL WHERE id = 42;
```

---

## Soporte

Si tienes dudas sobre cómo implementar la racha en el frontend, consulta:
- Respuesta de `POST /api/progreso/completar` (campo `racha`)
- Respuesta de `GET /api/usuario/perfil` (campo `racha`)
- Respuesta de `GET /api/usuario/logros` para el estado del logro "Racha de Fuego"
