import { useCallback } from "react";
import { Club } from "@/types";
import { useFetch } from "./useFetch";

/** Hook CRUD pour la gestion des clubs (fetch, update avec couleur) */
export function useClubs() {
  const { data: clubs, loading, error, fetchData: fetchClubs } = useFetch<Club[]>("/api/clubs", []);

  const updateClub = useCallback(
    async (
      id: number,
      data: {
        nom?: string;
        ville?: string;
        coach?: string | null;
        couleur?: string | null;
      }
    ) => {
      try {
        const res = await fetch(`/api/clubs/${id}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(data),
        });
        if (!res.ok) throw new Error("Update failed");
        await fetchClubs();
        return true;
      } catch (error) {
        console.error("Erreur mise à jour club:", error);
        return false;
      }
    },
    [fetchClubs]
  );

  return {
    clubs,
    loading,
    error,
    fetchClubs,
    updateClub,
  };
}
