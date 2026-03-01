import { Boxeur, getAnneeFromDate } from "@/types";
import { getGantStyle, getGantLabel } from "@/lib/categories";
import { clubColorStyle } from "@/lib/ui-helpers";

/** Props du récapitulatif tireurs */
interface TireursRecapProps {
  groupedByCategory: [string, Boxeur[]][];
}

/** Récapitulatif des tireurs groupés par catégorie, en cartes détaillées */
export function TireursRecap({ groupedByCategory }: TireursRecapProps) {
  if (groupedByCategory.length === 0) {
    return (
      <div className="card">
        <div className="empty-state">
          <div className="empty-state-icon">📋</div>
          <p>Inscris des tireurs pour voir le récapitulatif</p>
        </div>
      </div>
    );
  }

  return (
    <div>
      {groupedByCategory.map(([category, tireurs]) => (
        <div className="recap-section" key={category}>
          <h2>
            {category} ({tireurs.length} tireur{tireurs.length > 1 ? "s" : ""})
          </h2>
          <div className="recap-grid">
            {tireurs.map((b) => (
              <div className="recap-card" key={b.id}>
                <div className="recap-card-name">
                  {b.nom.toUpperCase()} {b.prenom}
                </div>
                <div className="recap-card-info">
                  <div className="recap-row">
                    <span className="recap-row-label">Sexe</span>
                    <span className="recap-row-value">
                      {b.sexe === "M" ? "Homme" : "Femme"}
                    </span>
                  </div>
                  <div className="recap-row">
                    <span className="recap-row-label">Année</span>
                    <span className="recap-row-value">
                      {(() => {
                        const annee = b.dateNaissance != null ? getAnneeFromDate(b.dateNaissance) : null;
                        return annee != null ? `${annee} (${new Date().getUTCFullYear() - annee} ans)` : "—";
                      })()}
                    </span>
                  </div>
                  <div className="recap-row">
                    <span className="recap-row-label">Poids</span>
                    <span className="recap-row-value">{b.poids} kg</span>
                  </div>
                  <div className="recap-row">
                    <span className="recap-row-label">Gant</span>
                    <span className="badge-gant" style={getGantStyle(b.gant)}>
                      {getGantLabel(b.gant)}
                    </span>
                  </div>
                  <div className="recap-row">
                    <span className="recap-row-label">Club</span>
                    <span className="badge badge-club" style={clubColorStyle(b.club.couleur)}>{b.club.nom}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
