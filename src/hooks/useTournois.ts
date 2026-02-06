import { useState, useCallback } from "react";

export interface Tournoi {
  id: number;
  nom: string;
  date: string;
  _count?: {
    boxeurs: number;
  };
}

export function useTournois() {
  const [tournois, setTournois] = useState<Tournoi[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchTournois = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/tournois");
      if (res.ok) {
        const data = await res.json();
        setTournois(data);
      }
    } catch (error) {
      console.error("Erreur fetch tournois:", error);
    } finally {
      setLoading(false);
    }
  }, []);

  const createTournoi = useCallback(
    async (data: { nom: string; date: string }) => {
      try {
        const res = await fetch("/api/tournois", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(data),
        });
        if (res.ok) {
          await fetchTournois();
          return true;
        }
        return false;
      } catch (error) {
        console.error("Erreur création tournoi:", error);
        return false;
      }
    },
    [fetchTournois]
  );

  const updateTournoi = useCallback(
    async (id: number, data: { nom?: string; date?: string }) => {
      try {
        const res = await fetch(`/api/tournois/${id}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(data),
        });
        if (res.ok) {
          await fetchTournois();
          return true;
        }
        return false;
      } catch (error) {
        console.error("Erreur update tournoi:", error);
        return false;
      }
    },
    [fetchTournois]
  );

  const deleteTournoi = useCallback(
    async (id: number) => {
      try {
        const res = await fetch(`/api/tournois/${id}`, {
          method: "DELETE",
        });
        if (res.ok) {
          await fetchTournois();
          return true;
        }
        return false;
      } catch (error) {
        console.error("Erreur delete tournoi:", error);
        return false;
      }
    },
    [fetchTournois]
  );

  return {
    tournois,
    loading,
    fetchTournois,
    createTournoi,
    updateTournoi,
    deleteTournoi,
  };
}
