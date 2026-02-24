import { useState, useCallback } from "react";
import { Match, MatchResult, MatchStats } from "@/types/match";

/** Hook de gestion des matchs d'un tournoi : CRUD, génération auto, stats par catégorie */
export function useMatches(tournoiId: number) {
  const [matches, setMatches] = useState<Match[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [stats, setStats] = useState<MatchStats | null>(null);

  const fetchMatches = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/tournois/${tournoiId}/matches?stats=true`);
      if (res.ok) {
        const json = await res.json();
        const matchList: Match[] = json.matches ?? [];
        const serverStats = json.stats ?? { total: 0, byType: { BRACKET: 0, POOL: 0 }, byStatus: { PENDING: 0, COMPLETED: 0, FORFEIT: 0 } };
        setMatches(matchList);

        // Compléter avec les catégories groupées (pas dispo côté serveur)
        const categoriesMap = new Map<string, { type: string; boxeurIds: Set<number>; count: number }>();
        for (const m of matchList) {
          const key = m.categoryDisplay;
          let cat = categoriesMap.get(key);
          if (!cat) {
            cat = { type: m.matchType, boxeurIds: new Set(), count: 0 };
            categoriesMap.set(key, cat);
          }
          cat.count++;
          if (m.boxeur1Id != null) cat.boxeurIds.add(m.boxeur1Id);
          if (m.boxeur2Id != null) cat.boxeurIds.add(m.boxeur2Id);
        }

        const categories = Array.from(categoriesMap.entries()).map(
          ([name, cat]) => ({
            name,
            type: cat.type,
            boxeurs: cat.boxeurIds.size,
            matches: cat.count,
          })
        );

        setStats({
          total: serverStats.total,
          byType: serverStats.byType,
          byStatus: serverStats.byStatus,
          categories,
        });
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : "Erreur réseau";
      setError(message);
      console.error("Erreur fetch matchs:", err);
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

  const addOpponentToMatch = useCallback(
    async (matchId: number, boxeur2Id: number) => {
      try {
        const res = await fetch(
          `/api/tournois/${tournoiId}/matches/${matchId}`,
          {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ boxeur2Id }),
          }
        );

        if (res.ok) {
          await fetchMatches();
          return true;
        }
        return false;
      } catch (error) {
        console.error("Erreur ajout adversaire:", error);
        return false;
      }
    },
    [tournoiId, fetchMatches]
  );

  const deleteMatch = useCallback(
    async (matchId: number) => {
      try {
        const res = await fetch(
          `/api/tournois/${tournoiId}/matches/${matchId}`,
          { method: "DELETE" }
        );

        if (res.ok) {
          await fetchMatches();
          return true;
        }
        return false;
      } catch (error) {
        console.error("Erreur suppression match:", error);
        return false;
      }
    },
    [tournoiId, fetchMatches]
  );

  const deleteAllMatches = useCallback(async () => {
    try {
      const res = await fetch(`/api/tournois/${tournoiId}/matches?force=true`, {
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
    error,
    stats,
    fetchMatches,
    generateMatches,
    createManualMatch,
    addOpponentToMatch,
    updateMatchResult,
    deleteMatch,
    deleteAllMatches,
  };
}
