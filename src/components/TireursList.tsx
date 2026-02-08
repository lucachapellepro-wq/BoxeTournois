import { Boxeur, getAnneeFromDate } from "@/types";
import { GANTS_COULEUR, getGantStyle, getGantLabel } from "@/lib/categories";

interface TireursListProps {
  boxeurs: Boxeur[];
  loading: boolean;
  onDelete: (id: number) => void;
  onOpenModal: () => void;
}

export function TireursList({ boxeurs, loading, onDelete, onOpenModal }: TireursListProps) {
  if (loading) {
    return (
      <div className="card">
        <div className="empty-state"><p>Chargement...</p></div>
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
        <table>
          <thead>
            <tr>
              <th>Nom</th>
              <th>Sexe</th>
              <th>Année</th>
              <th>Poids</th>
              <th>Gant</th>
              <th>Cat. Poids</th>
              <th>Cat. Âge</th>
              <th>Club</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {boxeurs.map((b) => (
              <tr key={b.id}>
                <td>
                  <strong>{b.nom.toUpperCase()}</strong> {b.prenom}
                </td>
                <td>
                  <span className="badge badge-sexe">
                    {b.sexe === "M" ? "H" : "F"}
                  </span>
                </td>
                <td>
                  {b.dateNaissance ? getAnneeFromDate(b.dateNaissance) : "—"}{" "}
                  {b.dateNaissance != null && (
                    <span style={{ color: "#555", fontSize: 12 }}>
                      ({new Date().getFullYear() - getAnneeFromDate(b.dateNaissance)!} ans)
                    </span>
                  )}
                </td>
                <td>{b.poids} kg</td>
                <td>
                  <span className="badge-gant" style={getGantStyle(b.gant)}>
                    <span
                      className="gant-dot"
                      style={{
                        backgroundColor: GANTS_COULEUR.find(
                          (g) => g.value === b.gant
                        )?.color,
                      }}
                    ></span>
                    {getGantLabel(b.gant)}
                  </span>
                </td>
                <td>
                  <span className="badge badge-poids">{b.categoriePoids}</span>
                </td>
                <td>
                  <span className="badge badge-age">{b.categorieAge}</span>
                </td>
                <td>
                  <span className="badge badge-club">{b.club.nom}</span>
                </td>
                <td>
                  <button
                    className="btn btn-danger btn-sm"
                    onClick={() => onDelete(b.id)}
                  >
                    ✕
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
