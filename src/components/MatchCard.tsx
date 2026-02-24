import { Match } from "@/types/match";
import { getGantColor, getGantLabel } from "@/lib/categories";
import { clubColorStyle } from "@/lib/ui-helpers";

/** Props de la carte de match */
interface MatchCardProps {
  match: Match;
}

/** Carte de match en lecture seule (affichage boxeur1 VS boxeur2 ou "en attente") */
export function MatchCard({ match }: MatchCardProps) {
  if (!match.boxeur1) {
    return (
      <div className="match-card match-tbd">
        <div className="match-waiting">
          <div className="match-waiting-icon">⏳</div>
          <div className="match-waiting-text">Match à déterminer</div>
        </div>
      </div>
    );
  }

  return (
    <div className="match-card">
      {match.boxeur2 ? (
        <>
          <div className="match-fighter">
            <div className="match-fighter-name">
              <strong>{match.boxeur1.nom.toUpperCase()}</strong>{" "}
              {match.boxeur1.prenom}
            </div>
            <div className="match-fighter-info">
              <span className="badge badge-club" style={clubColorStyle(match.boxeur1.club.couleur)}>{match.boxeur1.club.nom}</span>
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
              <span className="badge badge-club" style={clubColorStyle(match.boxeur2.club.couleur)}>{match.boxeur2.club.nom}</span>
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
              <span className="badge badge-club" style={clubColorStyle(match.boxeur1.club.couleur)}>{match.boxeur1.club.nom}</span>
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
