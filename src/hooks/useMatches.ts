import { useState, useCallback } from "react";
import { Match, MatchResult, MatchStats } from "@/types/match";

export function useMatches(tournoiId: number) {
  const [matches, setMatches] = useState<Match[]>([]);
  const [loading, setLoading] = useState(false);
  const [stats, setStats] = useState<MatchStats | null>(null);

  const fetchMatches = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/tournois/${tournoiId}/matches`);
      if (res.ok) {
        const data: Match[] = await res.json();
        setMatches(data);

        // Calculer les stats
        const statsByType = {
          BRACKET: data.filter((m) => m.matchType === "BRACKET").length,
          POOL: data.filter((m) => m.matchType === "POOL").length,
        };

        const statsByStatus = {
          PENDING: data.filter((m) => m.status === "PENDING").length,
          COMPLETED: data.filter((m) => m.status === "COMPLETED").length,
          FORFEIT: data.filter((m) => m.status === "FORFEIT").length,
        };

        // Grouper par catégorie
        const categoriesMap = new Map<string, Match[]>();
        data.forEach((m) => {
          const key = m.categoryDisplay;
          if (!categoriesMap.has(key)) {
            categoriesMap.set(key, []);
          }
          categoriesMap.get(key)!.push(m);
        });

        const categories = Array.from(categoriesMap.entries()).map(
          ([name, categoryMatches]) => ({
            name,
            type: categoryMatches[0].matchType,
            boxeurs: new Set([
              ...categoryMatches.map((m) => m.boxeur1Id),
              ...categoryMatches
                .map((m) => m.boxeur2Id)
                .filter((id) => id !== null),
            ]).size,
            matches: categoryMatches.length,
          })
        );

        setStats({
          total: data.length,
          byType: statsByType,
          byStatus: statsByStatus,
          categories,
        });
      }
    } catch (error) {
      console.error("Erreur fetch matchs:", error);
    } finally {
      setLoading(false);
    }
  }, [tournoiId]);

  const generateMatches = useCallback(
    async (regenerate: boolean = false) => {
      setLoading(true);
      try {
        const res = await fetch(`/api/tournois/${tournoiId}/matches/generate`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ regenerate }),
        });

        if (res.ok) {
          await fetchMatches();
          return true;
        } else {
          const error = await res.json();
          console.error("Erreur génération:", error);
          return false;
        }
      } catch (error) {
        console.error("Erreur génération matchs:", error);
        return false;
      } finally {
        setLoading(false);
      }
    },
    [tournoiId, fetchMatches]
  );

  const updateMatchResult = useCallback(
    async (matchId: number, result: MatchResult) => {
      try {
        const res = await fetch(
          `/api/tournois/${tournoiId}/matches/${matchId}`,
          {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(result),
          }
        );

        if (res.ok) {
          await fetchMatches();
          return true;
        }
        return false;
      } catch (error) {
        console.error("Erreur mise à jour match:", error);
        return false;
      }
    },
    [tournoiId, fetchMatches]
  );

  const createManualMatch = useCallback(
    async (boxeur1Id: number, boxeur2Id: number) => {
      try {
        const res = await fetch(`/api/tournois/${tournoiId}/matches/manual`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ boxeur1Id, boxeur2Id }),
        });

        if (res.ok) {
          await fetchMatches();
          return true;
        }
        return false;
      } catch (error) {
        console.error("Erreur création match manuel:", error);
        return false;
      }
    },
    [tournoiId, fetchMatches]
  );

  const deleteAllMatches = useCallback(async () => {
    try {
      const res = await fetch(`/api/tournois/${tournoiId}/matches`, {
        method: "DELETE",
      });

      if (res.ok) {
        await fetchMatches();
        return true;
      }
      return false;
    } catch (error) {
      console.error("Erreur suppression matchs:", error);
      return false;
    }
  }, [tournoiId, fetchMatches]);

  return {
    matches,
    loading,
    stats,
    fetchMatches,
    generateMatches,
    createManualMatch,
    updateMatchResult,
    deleteAllMatches,
  };
}
