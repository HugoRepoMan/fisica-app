# Frontend: Sync for completarLeccion

Este pequeño PR de ejemplo añade utilidades para sincronizar la finalización de una lección con el backend.

Incluye:
- `src/completeLesson.js`: función que envía la petición `POST /api/progreso/completar` con los campos requeridos.
- `src/useCompleteLesson.js`: hook React de ejemplo que usa la función y actualiza estado UI.

Cómo probar:
1. Asegúrate de tener `userToken` válido.
2. Importa `completeLesson` o `useCompleteLesson` en tu app y llama con los parámetros.

Ejemplo mínimo:
```js
import { completeLesson } from './src/completeLesson';

await completeLesson({ puntaje: 8, total_preguntas: 10, moduloId: 2, xp: 28, energia: 3, energia_costo: 1 }, userToken);
```
