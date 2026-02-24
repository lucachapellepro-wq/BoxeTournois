import { useCallback } from "react";
import { Tournoi } from "@/types";
import { useFetch } from "./useFetch";

/** Hook CRUD complet pour les tournois (fetch, create, update, delete) */
export function useTournois() {
  const { data: tournois, loading, error, fetchData: fetchTournois } = useFetch<Tournoi[]>("/api/tournois", []);

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
    error,
    fetchTournois,
    createTournoi,
    updateTournoi,
    deleteTournoi,
  };
}
