import { Match } from "@/types/match";
import { MatchCard } from "./MatchCard";
import { useMemo } from "react";
import { sortByWeight } from "@/lib/ui-helpers";

/** Props du composant TournamentBrackets */
interface TournamentBracketsProps {
  matches: Match[];
}

/** Vue globale des matchs groupés par catégorie (lecture seule) */
export function TournamentBrackets({ matches }: TournamentBracketsProps) {
  // Grouper les matchs par catégorie
  const groupedMatches = useMemo(() => {
    const groups = new Map<string, Match[]>();

    matches.forEach((match) => {
      if (!groups.has(match.categoryDisplay)) {
        groups.set(match.categoryDisplay, []);
      }
      groups.get(match.categoryDisplay)!.push(match);
    });

    // Convertir en array et trier par nom de catégorie
    return Array.from(groups.entries()).sort(([a], [b]) => sortByWeight(a, b));
  }, [matches]);

  if (matches.length === 0) {
    return (
      <div className="card">
        <div className="empty-state">
          <div className="empty-state-icon">🥊</div>
          <p>Aucun match généré pour le moment</p>
          <p className="empty-hint">
            Inscris des tireurs pour générer les tirages
          </p>
        </div>
      </div>
    );
  }

  return (
    <div>
      {groupedMatches.map(([category, categoryMatches]) => (
        <div className="tournament-category" key={category}>
          <h2>
            {category}{" "}
            <span style={{ color: "var(--text-muted)", fontSize: 16, fontWeight: "normal" }}>
              ({categoryMatches.length} match
              {categoryMatches.length > 1 ? "s" : ""})
            </span>
          </h2>
          <div className="matches-grid">
            {categoryMatches.map((match) => (
              <MatchCard key={match.id} match={match} />
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
