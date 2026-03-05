import { Boxeur, getAnneeFromDate } from "@/types";
import { getGantStyle, getGantLabel } from "@/lib/categories";
import { clubColorStyle, getCurrentYear } from "@/lib/ui-helpers";
import { useSwipeRow } from "./SwipeRow";

/** Props de la liste de tireurs (lecture seule) */
interface TireursListProps {
  boxeurs: Boxeur[];
  loading: boolean;
  onDelete: (id: number) => void;
  onOpenModal: () => void;
}

/** Liste tabulaire des tireurs d'un tournoi (sans édition inline) */
export function TireursList({ boxeurs, loading, onDelete, onOpenModal }: TireursListProps) {
  if (loading) {
    return (
      <div className="card">
        <div className="loading-state"><div className="spinner" /></div>
      </div>
    );
  }

  if (boxeurs.length === 0) {
    return (
      <div className="card">
        <div className="empty-state">
          <div className="empty-state-icon">🥊</div>
          <p>Aucun tireur inscrit pour le moment</p>
          <button className="btn btn-primary" onClick={onOpenModal}>
            Inscrire le premier tireur
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="card">
      <div className="table-wrapper">
        <table aria-label="Liste des tireurs du tournoi">
          <thead>
            <tr>
              <th scope="col">Nom</th>
              <th scope="col">Sexe</th>
              <th scope="col">Année</th>
              <th scope="col">Poids</th>
              <th scope="col">Gant</th>
              <th scope="col">Cat. Poids</th>
              <th scope="col">Cat. Âge</th>
              <th scope="col">Club</th>
              <th scope="col" aria-label="Actions"></th>
            </tr>
          </thead>
          <tbody>
            {boxeurs.map((b) => (
              <TireurListRow key={b.id} b={b} onDelete={() => onDelete(b.id)} />
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

/** Ligne tireur avec swipe-to-delete sur mobile */
function TireurListRow({ b, onDelete }: { b: Boxeur; onDelete: () => void }) {
  const { rowRef, revealed, touchHandlers, handleDelete, reset } = useSwipeRow(onDelete);

  return (
    <tr ref={rowRef} className="swipe-tr" {...touchHandlers}>
      <td data-label="Nom">
        <strong>{b.nom.toUpperCase()}</strong> {b.prenom}
      </td>
      <td data-label="Sexe">
        <span className="badge badge-sexe">
          {b.sexe === "M" ? "H" : "F"}
        </span>
      </td>
      <td data-label="Année">
        {(() => {
          const annee = b.dateNaissance != null ? getAnneeFromDate(b.dateNaissance) : null;
          return annee != null
            ? <>{annee} <span className="age-hint">({getCurrentYear() - annee} ans)</span></>
            : "—";
        })()}
      </td>
      <td data-label="Poids">{b.poids} kg</td>
      <td data-label="Gant">
        <span className="badge-gant" style={getGantStyle(b.gant)}>
          {getGantLabel(b.gant)}
        </span>
      </td>
      <td data-label="Cat. Poids">
        <span className="badge badge-poids">{b.categoriePoids}</span>
      </td>
      <td data-label="Cat. Âge">
        <span className="badge badge-age">{b.categorieAge}</span>
      </td>
      <td data-label="Club">
        <span className="badge badge-club" style={clubColorStyle(b.club.couleur)}>{b.club.nom}</span>
      </td>
      <td data-label="">
        <button
          className="btn btn-danger btn-sm"
          onClick={onDelete}
          aria-label={`Retirer ${b.nom} ${b.prenom} du tournoi`}
        >
          ✕
        </button>
        {revealed && (
          <div className="swipe-delete-action">
            <button onClick={handleDelete} aria-label="Supprimer">
              🗑️ Supprimer
            </button>
            <button onClick={reset} className="swipe-cancel" aria-label="Annuler">
              ✕
            </button>
          </div>
        )}
      </td>
    </tr>
  );
}
