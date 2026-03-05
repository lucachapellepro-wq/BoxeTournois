import { Match } from "@/types/match";
import { getGantStyle, getGantLabel } from "@/lib/categories";
import { clubColorStyle } from "@/lib/ui-helpers";
import { isManuel, isMixte, isInterclub } from "@/lib/match-helpers";

/** Props de la carte de match éditable */
interface MatchCardEditableProps {
  match: Match;
  onAddOpponent?: (match: Match) => void;
  onDelete?: (matchId: number) => void;
}

/** Badge indiquant le type de compétition (Tournoi/Interclub) */
const TypeBadge = ({ type }: { type: string }) => (
  <span className={`badge badge-type-sm ${type === "INTERCLUB" ? "badge-interclub" : "badge-tournoi"}`}>
    {type === "INTERCLUB" ? "Interclub" : "Tournoi"}
  </span>
);

/** Carte de match interactive : ajout d'adversaire, suppression, badge vainqueur, styles par type */
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
      <div className="match-card match-solo">
        {onAddOpponent && (
          <button
            className="btn-add-opponent"
            onClick={() => onAddOpponent(match)}
            title="Ajouter un adversaire"
            aria-label="Ajouter un adversaire"
          >
            +
          </button>
        )}
        {match.boxeur1 && (
          <div className="match-fighter">
            <div className="match-fighter-name">
              <span className="match-fighter-name-text">
                <strong>{match.boxeur1.nom.toUpperCase()}</strong> {match.boxeur1.prenom}
              </span>
              <TypeBadge type={match.boxeur1.typeCompetition} />
            </div>
            <div className="match-fighter-info">
              <span className="badge badge-club" style={clubColorStyle(match.boxeur1.club.couleur)}>{match.boxeur1.club.nom}</span>
              <span className="badge badge-sexe">{match.boxeur1.sexe === "M" ? "H" : "F"}</span>
              <span className="badge">{match.boxeur1.poids}kg</span>
              <span className="badge-gant" style={getGantStyle(match.boxeur1.gant)}>
                {getGantLabel(match.boxeur1.gant)}
              </span>
            </div>
          </div>
        )}
      </div>
    );
  }

  // Match normal avec 2 boxeurs (boxeur1 et boxeur2 sont garantis non-null ici)
  if (!match.boxeur1) return null;
  const isManualMatch = isManuel(match);
  const isMixteMatch = isMixte(match);
  const isInterclubMatch = isInterclub(match);
  const isTournoi = !isManualMatch && !isMixteMatch && !isInterclubMatch;
  const isBoxeur1Winner = match.winnerId === match.boxeur1Id;
  const isBoxeur2Winner = match.winnerId === match.boxeur2Id;

  const cardClass = [
    "match-card",
    match.status === "COMPLETED" ? "match-completed" : "",
    isMixteMatch ? "match-type-mixte-card" :
    isManualMatch ? "match-type-manual-card" :
    isTournoi ? "match-type-tournoi-card" :
    "match-type-interclub-card",
  ].filter(Boolean).join(" ");

  return (
    <div className={cardClass}>
      {isMixteMatch && (
        <div className="match-card-label-row">
          <span className="match-type-label match-type-mixte">
            Interclub mixte
          </span>
        </div>
      )}
      {isManualMatch && (
        <div className="match-card-label-row">
          <span className="match-type-label match-type-manual">
            Combat ajouté
          </span>
        </div>
      )}
      {isManualMatch && onDelete && (
        <div className="match-card-delete-row">
          <button
            className="btn-delete-match"
            onClick={() => onDelete(match.id)}
            title="Supprimer ce combat"
            aria-label="Supprimer ce combat"
          >
            ✕
          </button>
        </div>
      )}
      {/* Boxeur 1 */}
      <div className={`match-fighter ${isBoxeur1Winner ? "match-winner" : ""} ${
        (isMixteMatch || isInterclubMatch) && match.boxeur1?.typeCompetition === "TOURNOI"
          ? "match-fighter-tournoi-type" : ""
      }`}>
        <div className="match-fighter-name">
          <span className="match-fighter-name-text">
            <strong>{match.boxeur1.nom.toUpperCase()}</strong> {match.boxeur1.prenom}
          </span>
          <TypeBadge type={match.boxeur1.typeCompetition} />
          {isBoxeur1Winner && <span className="winner-badge">🏆</span>}
        </div>
        <div className="match-fighter-info">
          <span className="badge badge-club" style={clubColorStyle(match.boxeur1.club.couleur)}>{match.boxeur1.club.nom}</span>
          <span className="badge badge-sexe">{match.boxeur1.sexe === "M" ? "H" : "F"}</span>
          <span className="badge">{match.boxeur1.poids}kg</span>
          <span className="badge-gant" style={getGantStyle(match.boxeur1.gant)}>
            {getGantLabel(match.boxeur1.gant)}
          </span>
        </div>
      </div>

      <div className="match-vs">VS</div>

      {/* Boxeur 2 */}
      <div className={`match-fighter ${isBoxeur2Winner ? "match-winner" : ""} ${match.boxeur2Manual ? "match-fighter-added" : ""} ${
        (isMixteMatch || isInterclubMatch) && match.boxeur2?.typeCompetition === "TOURNOI"
          ? "match-fighter-tournoi-type" : ""
      }`}>
        <div className="match-fighter-name">
          <span className="match-fighter-name-text">
            <strong>{match.boxeur2.nom.toUpperCase()}</strong> {match.boxeur2.prenom}
          </span>
          <TypeBadge type={match.boxeur2.typeCompetition} />
          {isBoxeur2Winner && <span className="winner-badge">🏆</span>}
        </div>
        <div className="match-fighter-info">
          <span className="badge badge-club" style={clubColorStyle(match.boxeur2.club.couleur)}>{match.boxeur2.club.nom}</span>
          <span className="badge badge-sexe">{match.boxeur2.sexe === "M" ? "H" : "F"}</span>
          <span className="badge">{match.boxeur2.poids}kg</span>
          <span className="badge-gant" style={getGantStyle(match.boxeur2.gant)}>
            {getGantLabel(match.boxeur2.gant)}
          </span>
        </div>
      </div>

    </div>
  );
}
