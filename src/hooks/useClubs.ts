import { useState, useCallback } from "react";
import { Club } from "@/types";

export function useClubs() {
  const [clubs, setClubs] = useState<Club[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchClubs = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/clubs");
      const data: Club[] = await res.json();
      setClubs(data);
    } catch (error) {
      console.error("Erreur fetch clubs:", error);
    } finally {
      setLoading(false);
    }
  }, []);

  const updateClub = useCallback(
    async (
      id: number,
      data: {
        nom?: string;
        ville?: string;
        coach?: string;
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
    fetchClubs,
    updateClub,
  };
}
