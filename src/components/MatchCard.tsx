import { Match } from "@/lib/matching";
import { GANTS_COULEUR } from "@/lib/categories";

interface MatchCardProps {
  match: Match;
}

export function MatchCard({ match }: MatchCardProps) {
  const getGantColor = (gant: string) => {
    return GANTS_COULEUR.find((g) => g.value === gant)?.color || "#666";
  };

  const getGantLabel = (gant: string) => {
    return GANTS_COULEUR.find((g) => g.value === gant)?.label || gant;
  };

  return (
    <div className="match-card">
      {match.status === "paired" && match.boxeur2 ? (
        <>
          <div className="match-fighter">
            <div className="match-fighter-name">
              <strong>{match.boxeur1.nom.toUpperCase()}</strong>{" "}
              {match.boxeur1.prenom}
            </div>
            <div className="match-fighter-info">
              <span className="badge badge-club">{match.boxeur1.club.nom}</span>
              <span
                className="badge-gant"
                style={{
                  borderColor: getGantColor(match.boxeur1.gant),
                  backgroundColor: `${getGantColor(match.boxeur1.gant)}20`,
                  color: getGantColor(match.boxeur1.gant),
                }}
              >
                <span
                  className="gant-dot"
                  style={{ backgroundColor: getGantColor(match.boxeur1.gant) }}
                ></span>
                {getGantLabel(match.boxeur1.gant)}
              </span>
            </div>
          </div>

          <div className="match-vs">VS</div>

          <div className="match-fighter">
            <div className="match-fighter-name">
              <strong>{match.boxeur2.nom.toUpperCase()}</strong>{" "}
              {match.boxeur2.prenom}
            </div>
            <div className="match-fighter-info">
              <span className="badge badge-club">{match.boxeur2.club.nom}</span>
              <span
                className="badge-gant"
                style={{
                  borderColor: getGantColor(match.boxeur2.gant),
                  backgroundColor: `${getGantColor(match.boxeur2.gant)}20`,
                  color: getGantColor(match.boxeur2.gant),
                }}
              >
                <span
                  className="gant-dot"
                  style={{ backgroundColor: getGantColor(match.boxeur2.gant) }}
                ></span>
                {getGantLabel(match.boxeur2.gant)}
              </span>
            </div>
          </div>
        </>
      ) : (
        <>
          <div className="match-fighter">
            <div className="match-fighter-name">
              <strong>{match.boxeur1.nom.toUpperCase()}</strong>{" "}
              {match.boxeur1.prenom}
            </div>
            <div className="match-fighter-info">
              <span className="badge badge-club">{match.boxeur1.club.nom}</span>
              <span
                className="badge-gant"
                style={{
                  borderColor: getGantColor(match.boxeur1.gant),
                  backgroundColor: `${getGantColor(match.boxeur1.gant)}20`,
                  color: getGantColor(match.boxeur1.gant),
                }}
              >
                <span
                  className="gant-dot"
                  style={{ backgroundColor: getGantColor(match.boxeur1.gant) }}
                ></span>
                {getGantLabel(match.boxeur1.gant)}
              </span>
            </div>
          </div>

          <div className="match-waiting">
            <div className="match-waiting-icon">⏳</div>
            <div className="match-waiting-text">En attente d'adversaire</div>
          </div>
        </>
      )}
    </div>
  );
}
