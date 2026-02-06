import { Boxeur } from "@/types";
import { GANTS_COULEUR } from "@/lib/categories";

interface BoxeursSeulsViewProps {
  boxeurs: Boxeur[];
}

export function BoxeursSeulsView({ boxeurs }: BoxeursSeulsViewProps) {
  const getGantColor = (gant: string) => {
    return GANTS_COULEUR.find((g) => g.value === gant)?.color || "#666";
  };

  const getGantLabel = (gant: string) => {
    return GANTS_COULEUR.find((g) => g.value === gant)?.label || gant;
  };

  if (boxeurs.length === 0) return null;

  // Grouper par sexe puis catégorie
  const boxeursBySexe = boxeurs.reduce((acc, boxeur) => {
    const sexe = boxeur.sexe;
    if (!acc[sexe]) acc[sexe] = {};

    const key = `${boxeur.categorieAge} - ${boxeur.categoriePoids}`;
    if (!acc[sexe][key]) acc[sexe][key] = [];
    acc[sexe][key].push(boxeur);
    return acc;
  }, {} as Record<string, Record<string, Boxeur[]>>);

  const femmes = boxeursBySexe["F"] || {};
  const hommes = boxeursBySexe["M"] || {};

  return (
    <div style={{ marginTop: 48, paddingTop: 32, borderTop: "2px solid #2a2a2a" }}>
      <h3 style={{ fontSize: 24, marginBottom: 24, color: "#f39c12" }}>
        ⏳ Tireurs en attente d'adversaire
      </h3>
      <p style={{ color: "#888", marginBottom: 24, fontSize: 14 }}>
        Ces tireurs n'ont pas d'adversaire dans leur catégorie pour le moment.
      </p>

      {/* Femmes */}
      {Object.keys(femmes).length > 0 && (
        <div style={{ marginBottom: 48 }}>
          <h3
            style={{
              fontSize: 22,
              marginBottom: 20,
              color: "#e63946",
              borderBottom: "2px solid #e63946",
              paddingBottom: 8,
            }}
          >
            👩 FEMMES
          </h3>
          {Object.entries(femmes).map(([category, categoryBoxeurs]) => (
            <div key={category} style={{ marginBottom: 32 }}>
              <h4 style={{ fontSize: 18, marginBottom: 16, color: "#d4a337", paddingLeft: 16 }}>
                {category} ({categoryBoxeurs.length} tireur{categoryBoxeurs.length > 1 ? "s" : ""})
              </h4>

          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))", gap: 12 }}>
            {categoryBoxeurs.map((boxeur) => (
              <div
                key={boxeur.id}
                className="match-card match-tbd"
                style={{ flexDirection: "column", alignItems: "flex-start", gap: 8 }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: 8, width: "100%" }}>
                  <div style={{ fontSize: 24 }}>⏳</div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 16, fontWeight: "bold" }}>
                      {boxeur.nom.toUpperCase()} {boxeur.prenom}
                    </div>
                    <div style={{ fontSize: 13, color: "#888", marginTop: 4 }}>
                      {boxeur.club.nom}
                    </div>
                  </div>
                </div>

                <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                  <span className="badge badge-sexe">{boxeur.sexe}</span>
                  <span className="badge badge-poids">{boxeur.categoriePoids}</span>
                  <span className="badge badge-age">{boxeur.categorieAge}</span>
                  <span
                    className="badge-gant"
                    style={{
                      borderColor: getGantColor(boxeur.gant),
                      backgroundColor: `${getGantColor(boxeur.gant)}20`,
                      color: getGantColor(boxeur.gant),
                    }}
                  >
                    <span
                      className="gant-dot"
                      style={{ backgroundColor: getGantColor(boxeur.gant) }}
                    ></span>
                    {getGantLabel(boxeur.gant)}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      ))}
        </div>
      )}

      {/* Hommes */}
      {Object.keys(hommes).length > 0 && (
        <div>
          <h3
            style={{
              fontSize: 22,
              marginBottom: 20,
              color: "#3498db",
              borderBottom: "2px solid #3498db",
              paddingBottom: 8,
            }}
          >
            👨 HOMMES
          </h3>
          {Object.entries(hommes).map(([category, categoryBoxeurs]) => (
            <div key={category} style={{ marginBottom: 32 }}>
              <h4 style={{ fontSize: 18, marginBottom: 16, color: "#d4a337", paddingLeft: 16 }}>
                {category} ({categoryBoxeurs.length} tireur{categoryBoxeurs.length > 1 ? "s" : ""})
              </h4>

              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))", gap: 12 }}>
                {categoryBoxeurs.map((boxeur) => (
                  <div
                    key={boxeur.id}
                    className="match-card match-tbd"
                    style={{ flexDirection: "column", alignItems: "flex-start", gap: 8 }}
                  >
                    <div style={{ display: "flex", alignItems: "center", gap: 8, width: "100%" }}>
                      <div style={{ fontSize: 24 }}>⏳</div>
                      <div style={{ flex: 1 }}>
                        <div style={{ fontSize: 16, fontWeight: "bold" }}>
                          {boxeur.nom.toUpperCase()} {boxeur.prenom}
                        </div>
                        <div style={{ fontSize: 13, color: "#888", marginTop: 4 }}>
                          {boxeur.club.nom}
                        </div>
                      </div>
                    </div>

                    <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                      <span className="badge badge-sexe">{boxeur.sexe}</span>
                      <span className="badge badge-poids">{boxeur.categoriePoids}</span>
                      <span className="badge badge-age">{boxeur.categorieAge}</span>
                      <span
                        className="badge-gant"
                        style={{
                          borderColor: getGantColor(boxeur.gant),
                          backgroundColor: `${getGantColor(boxeur.gant)}20`,
                          color: getGantColor(boxeur.gant),
                        }}
                      >
                        <span
                          className="gant-dot"
                          style={{ backgroundColor: getGantColor(boxeur.gant) }}
                        ></span>
                        {getGantLabel(boxeur.gant)}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
