import { useCallback } from "react";
import { Boxeur } from "@/types";
import { useFetch } from "./useFetch";

/** Hook CRUD pour la gestion des boxeurs (fetch, update, delete) */
export function useBoxeurs() {
  const { data: boxeurs, loading, error, fetchData: fetchBoxeurs } = useFetch<Boxeur[]>("/api/boxeurs", []);

  const deleteBoxeur = useCallback(
    async (id: number) => {
      try {
        const res = await fetch(`/api/boxeurs/${id}`, { method: "DELETE" });
        if (!res.ok) {
          const err = await res.json();
          throw new Error(err.error || "Erreur suppression");
        }
        await fetchBoxeurs();
        return true;
      } catch (error) {
        console.error("Erreur suppression boxeur:", error);
        return false;
      }
    },
    [fetchBoxeurs],
  );

  const updateBoxeur = useCallback(
    async (
      id: number,
      data: {
        nom?: string;
        prenom?: string;
        anneeNaissance?: string;
        poids?: string;
        gant?: string;
        typeCompetition?: string;
        infoIncomplete?: boolean;
      },
    ) => {
      try {
        const res = await fetch(`/api/boxeurs/${id}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(data),
        });
        if (!res.ok) throw new Error("Update failed");
        await fetchBoxeurs();
        return true;
      } catch (error) {
        console.error("Erreur mise à jour boxeur:", error);
        return false;
      }
    },
    [fetchBoxeurs],
  );

  return {
    boxeurs,
    loading,
    error,
    fetchBoxeurs,
    deleteBoxeur,
    updateBoxeur,
  };
}
