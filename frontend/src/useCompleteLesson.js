import { useState, useCallback } from 'react';
import { completeLesson } from './completeLesson';

export function useCompleteLesson({ baseUrl = '' } = {}) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const run = useCallback(async ({ payload, token }) => {
    setLoading(true);
    setError(null);
    try {
      const resumen = await completeLesson(payload, token, baseUrl);
      setLoading(false);
      return resumen;
    } catch (err) {
      setError(err.message || err.toString());
      setLoading(false);
      throw err;
    }
  }, [baseUrl]);

  return { run, loading, error };
}
