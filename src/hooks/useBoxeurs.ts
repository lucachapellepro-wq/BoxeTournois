import { useState, useCallback } from "react";
import { Boxeur } from "@/types";

export function useBoxeurs() {
  const [boxeurs, setBoxeurs] = useState<Boxeur[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchBoxeurs = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/boxeurs");
      const data: Boxeur[] = await res.json();
      setBoxeurs(data);
    } catch (error) {
      console.error("Erreur fetch boxeurs:", error);
    } finally {
      setLoading(false);
    }
  }, []);

  const deleteBoxeur = useCallback(
    async (id: number) => {
      try {
        await fetch(`/api/boxeurs/${id}`, { method: "DELETE" });
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
    fetchBoxeurs,
    deleteBoxeur,
    updateBoxeur,
  };
}
