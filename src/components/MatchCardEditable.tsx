import { Match } from "@/types/match";
import { getGantColor, getGantLabel } from "@/lib/categories";

interface MatchCardEditableProps {
  match: Match;
  onAddOpponent?: (match: Match) => void;
  onDelete?: (matchId: number) => void;
}

const TypeBadge = ({ type }: { type: string }) => (
  <span className="badge" style={{
    fontSize: 9, padding: "1px 4px", marginLeft: 4,
    backgroundColor: type === "INTERCLUB" ? "#22C55E20" : "#3B82F620",
    color: type === "INTERCLUB" ? "#22C55E" : "#3B82F6",
  }}>
    {type === "INTERCLUB" ? "Interclub" : "Tournoi"}
  </span>
);

export function MatchCardEditable({ match, onAddOpponent, onDelete }: MatchCardEditableProps) {
  // Si les deux boxeurs sont null (match de prévu complet - finale, demi, etc.)
  if (!match.boxeur1 && !match.boxeur2) {
    return (
      <div className="match-card match-tbd">
        <div className="match-waiting">
          <div className="match-waiting-icon">⏳</div>
          <div className="match-waiting-text">Match de prévu</div>
        </div>
      </div>
    );
  }

  // Si boxeur2 est null (boxeur seul, pas d'adversaire)
  if (!match.boxeur2) {
    return (
      <div className="match-card match-solo" style={{ position: "relative" }}>
        {onAddOpponent && (
          <button
            className="btn-add-opponent"
            onClick={() => onAddOpponent(match)}
            title="Ajouter un adversaire"
          >
            +
          </button>
        )}
        {match.boxeur1 && (
          <div className="match-fighter">
            <div className="match-fighter-name">
              <strong>{match.boxeur1.nom.toUpperCase()}</strong> {match.boxeur1.prenom}
              <TypeBadge type={match.boxeur1.typeCompetition} />
            </div>
            <div className="match-fighter-info">
              <span className="badge badge-club">{match.boxeur1.club.nom}</span>
              <span className="badge badge-sexe">{match.boxeur1.sexe}</span>
              <span className="badge">{match.boxeur1.poids}kg</span>
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
        )}
      </div>
    );
  }

  // Match normal avec 2 boxeurs
  const isManual = match.poolName === "MANUEL" || !!match.boxeur2Manual;
  const isMixte = match.poolName === "MIXTE";
  const isInterclub = match.boxeur1?.typeCompetition === "INTERCLUB" || match.boxeur2?.typeCompetition === "INTERCLUB";
  const isTournoi = !isManual && !isMixte && !isInterclub;
  const isBoxeur1Winner = match.winnerId === match.boxeur1Id;
  const isBoxeur2Winner = match.winnerId === match.boxeur2Id;

  const cardClass = [
    "match-card",
    match.status === "COMPLETED" ? "match-completed" : "",
  ].filter(Boolean).join(" ");

  return (
    <div className={cardClass} style={
      isMixte ? { borderColor: "#1abc9c", borderWidth: 2, background: "rgba(26, 188, 156, 0.08)" }
      : isManual ? { borderColor: "#e67e22", borderWidth: 2, background: "rgba(230, 126, 34, 0.08)" }
      : isTournoi ? { borderColor: "#e63946", borderWidth: 2, background: "rgba(230, 57, 70, 0.05)" }
      : { borderColor: "#f39c12", borderWidth: 2, background: "rgba(243, 156, 18, 0.08)" }
    }>
      {isMixte && (
        <div style={{ marginBottom: 4 }}>
          <span style={{
            fontSize: 10, fontWeight: 700, padding: "2px 8px", borderRadius: 4,
            backgroundColor: "#1abc9c20", color: "#1abc9c", border: "1px solid #1abc9c40",
            textTransform: "uppercase", letterSpacing: 0.5,
          }}>
            Interclub mixte
          </span>
        </div>
      )}
      {isManual && (
        <div style={{ marginBottom: 4 }}>
          <span style={{
            fontSize: 10, fontWeight: 700, padding: "2px 8px", borderRadius: 4,
            backgroundColor: "#e67e2220", color: "#e67e22", border: "1px solid #e67e2240",
            textTransform: "uppercase", letterSpacing: 0.5,
          }}>
            Combat ajouté
          </span>
        </div>
      )}
      {isManual && onDelete && (
        <div style={{ display: "flex", justifyContent: "flex-end", marginBottom: 4 }}>
          <button
            className="btn-delete-match"
            onClick={() => onDelete(match.id)}
            title="Supprimer ce combat"
          >
            ✕
          </button>
        </div>
      )}
      {/* Boxeur 1 */}
      <div className={`match-fighter ${isBoxeur1Winner ? "match-winner" : ""}`} style={
        (isMixte || isInterclub) && match.boxeur1?.typeCompetition === "TOURNOI"
          ? { border: "2px solid #3B82F6", borderRadius: 8, padding: 6, background: "rgba(59, 130, 246, 0.06)" }
          : undefined
      }>
        <div className="match-fighter-name">
          <strong>{match.boxeur1.nom.toUpperCase()}</strong> {match.boxeur1.prenom}
          <TypeBadge type={match.boxeur1.typeCompetition} />
          {isBoxeur1Winner && <span className="winner-badge">🏆</span>}
        </div>
        <div className="match-fighter-info">
          <span className="badge badge-club">{match.boxeur1.club.nom}</span>
          <span className="badge badge-sexe">{match.boxeur1.sexe}</span>
          <span className="badge">{match.boxeur1.poids}kg</span>
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

      {/* Boxeur 2 */}
      <div className={`match-fighter ${isBoxeur2Winner ? "match-winner" : ""} ${match.boxeur2Manual ? "match-fighter-added" : ""}`} style={
        (isMixte || isInterclub) && match.boxeur2?.typeCompetition === "TOURNOI"
          ? { border: "2px solid #3B82F6", borderRadius: 8, padding: 6, background: "rgba(59, 130, 246, 0.06)" }
          : undefined
      }>
        <div className="match-fighter-name">
          <strong>{match.boxeur2.nom.toUpperCase()}</strong> {match.boxeur2.prenom}
          <TypeBadge type={match.boxeur2.typeCompetition} />
          {isBoxeur2Winner && <span className="winner-badge">🏆</span>}
        </div>
        <div className="match-fighter-info">
          <span className="badge badge-club">{match.boxeur2.club.nom}</span>
          <span className="badge badge-sexe">{match.boxeur2.sexe}</span>
          <span className="badge">{match.boxeur2.poids}kg</span>
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

    </div>
  );
}
