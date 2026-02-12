import { Match } from "@/types/match";
import { MatchCardEditable } from "./MatchCardEditable";
import { useMemo } from "react";

interface PoolViewProps {
  matches: Match[];
  category: string;
  onAddOpponent?: (match: Match) => void;
}

export function PoolView({ matches, category, onAddOpponent }: PoolViewProps) {
  // Grouper par poolName
  const matchesByPool = useMemo(() => {
    const pools = new Map<string, Match[]>();

    matches.forEach((match) => {
      if (match.poolName) {
        if (!pools.has(match.poolName)) {
          pools.set(match.poolName, []);
        }
        pools.get(match.poolName)!.push(match);
      }
    });

    // Trier : poules (A, B, C) d'abord, puis DEMI, puis FINALE, puis INTERCLUB
    const order = (name: string) => {
      if (name === "FINALE") return 3;
      if (name.startsWith("DEMI")) return 2;
      if (name === "INTERCLUB") return 1;
      return 0; // Poules A, B, C...
    };
    return Array.from(pools.entries()).sort(([a], [b]) => {
      const diff = order(a) - order(b);
      if (diff !== 0) return diff;
      return a.localeCompare(b);
    });
  }, [matches]);

  const getPoolLabel = (poolName: string): string => {
    if (poolName === "FINALE") return "Finale";
    if (poolName.startsWith("DEMI")) return `Demi-finale ${poolName.replace("DEMI ", "")}`;
    if (poolName === "INTERCLUB") return "Interclub";
    if (poolName === "MIXTE") return "Interclub mixte";
    if (poolName === "MANUEL") return "Combat ajouté";
    return `Poule ${poolName}`;
  };

  return (
    <div className="pool-view">
      <h3 className="pool-category">{category}</h3>

      <div className="pool-grid">
        {matchesByPool.map(([poolName, poolMatches]) => (
          <div key={poolName} className="pool-card">
            <h4 className="pool-title">
              {getPoolLabel(poolName)}
              <span className="pool-count">
                ({poolMatches.length} match{poolMatches.length > 1 ? "s" : ""})
              </span>
            </h4>

            <div className="pool-matches">
              {poolMatches.map((match) => (
                <MatchCardEditable
                  key={match.id}
                  match={match}
                  onAddOpponent={onAddOpponent}
                />
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
