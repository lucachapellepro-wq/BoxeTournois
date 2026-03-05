import { useState, useCallback } from "react";

/** Résultat retourné par useFetch */
interface UseFetchReturn<T> {
  data: T;
  loading: boolean;
  error: string | null;
  fetchData: () => Promise<void>;
}

/** Hook générique pour fetch GET avec gestion loading/error */
export function useFetch<T>(url: string, initialData: T): UseFetchReturn<T> {
  const [data, setData] = useState<T>(initialData);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(url);
      if (!res.ok) throw new Error(`Erreur ${res.status}`);
      const json: T = await res.json();
      setData(json);
    } catch (err) {
      const message = err instanceof Error ? err.message : "Erreur réseau";
      setError(message);
    } finally {
      setLoading(false);
    }
  }, [url]);

  return { data, loading, error, fetchData };
}
