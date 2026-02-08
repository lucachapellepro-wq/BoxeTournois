import { Boxeur, getAnneeFromDate } from "@/types";
import { GANTS_COULEUR, getGantStyle, getGantLabel } from "@/lib/categories";

interface TireursRecapProps {
  groupedByCategory: [string, Boxeur[]][];
}

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
                      {b.dateNaissance != null
                        ? `${getAnneeFromDate(b.dateNaissance)} (${new Date().getFullYear() - getAnneeFromDate(b.dateNaissance)!} ans)`
                        : "—"}
                    </span>
                  </div>
                  <div className="recap-row">
                    <span className="recap-row-label">Poids</span>
                    <span className="recap-row-value">{b.poids} kg</span>
                  </div>
                  <div className="recap-row">
                    <span className="recap-row-label">Gant</span>
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
                  </div>
                  <div className="recap-row">
                    <span className="recap-row-label">Club</span>
                    <span className="badge badge-club">{b.club.nom}</span>
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
