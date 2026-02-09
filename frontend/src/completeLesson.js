// util: enviar datos de completar lección al backend
export async function completeLesson(payload, token, baseUrl = '') {
  // payload: { puntaje, total_preguntas, moduloId, xp, racha, ultima_leccion_fecha, energia, energia_costo }
  const res = await fetch(baseUrl + '/api/progreso/completar', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-auth-token': token
    },
    body: JSON.stringify(payload)
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || err.msg || 'Error al completar lección');
  }

  const data = await res.json();
  return data.resumen || data;
}
