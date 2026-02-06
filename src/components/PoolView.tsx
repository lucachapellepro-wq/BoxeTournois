import { Match } from "@/types/match";
import { MatchCardEditable } from "./MatchCardEditable";
import { useMemo } from "react";

interface PoolViewProps {
  matches: Match[];
  category: string;
}

export function PoolView({ matches, category }: PoolViewProps) {
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

    // Trier les poules par nom (A, B, C...)
    return Array.from(pools.entries()).sort(([a], [b]) => a.localeCompare(b));
  }, [matches]);

  return (
    <div className="pool-view">
      <h3 className="pool-category">{category}</h3>

      <div className="pool-grid">
        {matchesByPool.map(([poolName, poolMatches]) => (
          <div key={poolName} className="pool-card">
            <h4 className="pool-title">
              Poule {poolName}
              <span className="pool-count">
                ({poolMatches.length} match{poolMatches.length > 1 ? "s" : ""})
              </span>
            </h4>

            <div className="pool-matches">
              {poolMatches.map((match) => (
                <MatchCardEditable
                  key={match.id}
                  match={match}
                />
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
