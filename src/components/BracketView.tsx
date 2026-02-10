import { Match } from "@/types/match";
import { MatchCardEditable } from "./MatchCardEditable";
import { useMemo } from "react";

interface BracketViewProps {
  matches: Match[];
  category: string;
  onAddOpponent?: (match: Match) => void;
}

export function BracketView({ matches, category, onAddOpponent }: BracketViewProps) {
  // Grouper par bracketRound
  const matchesByRound = useMemo(() => {
    const rounds = new Map<string, Match[]>();

    matches.forEach((match) => {
      if (match.bracketRound) {
        if (!rounds.has(match.bracketRound)) {
          rounds.set(match.bracketRound, []);
        }
        rounds.get(match.bracketRound)!.push(match);
      }
    });

    // Trier chaque round par position
    rounds.forEach((roundMatches) => {
      roundMatches.sort((a, b) => (a.bracketPosition || 0) - (b.bracketPosition || 0));
    });

    return rounds;
  }, [matches]);

  // Ordre d'affichage : HUITIEME → QUART → DEMI → FINAL
  const roundOrder = ["HUITIEME", "QUART", "DEMI", "FINAL"];
  const roundLabels: Record<string, string> = {
    HUITIEME: "Huitièmes de finale",
    QUART: "Quarts de finale",
    DEMI: "Demi-finales",
    FINAL: "Finale",
  };

  const orderedRounds = roundOrder
    .filter((round) => matchesByRound.has(round))
    .map((round) => ({
      name: round,
      label: roundLabels[round],
      matches: matchesByRound.get(round)!,
    }));

  return (
    <div className="bracket-view">
      <h3 className="bracket-category">{category}</h3>

      {orderedRounds.map((round) => (
        <div key={round.name} className="bracket-round">
          <h4 className="bracket-round-title">{round.label}</h4>
          <div className="bracket-round-matches">
            {round.matches.map((match) => (
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
  );
}
