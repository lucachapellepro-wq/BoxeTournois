import { useState, useMemo } from "react";
import { Boxeur, SortValue, getAnneeFromDate } from "@/types";
import { GANTS_COULEUR, getGantStyle } from "@/lib/categories";
import { EditableCell } from "./EditableCell";

type SortColumn =
  | "nom"
  | "sexe"
  | "annee"
  | "poids"
  | "gant"
  | "categoriePoids"
  | "categorieAge"
  | "club";
type SortDirection = "asc" | "desc";

interface TireursTableProps {
  boxeurs: Boxeur[];
  loading: boolean;
  onDelete: (id: number) => void;
  onUpdate: (
    id: number,
    field: string,
    value: string | number | boolean,
  ) => Promise<void>;
  onOpenModal: () => void;
}

export function TireursTable({
  boxeurs,
  loading,
  onDelete,
  onUpdate,
  onOpenModal,
}: TireursTableProps) {
  const [sortColumn, setSortColumn] = useState<SortColumn | null>(null);
  const [sortDirection, setSortDirection] = useState<SortDirection>("asc");

  const handleSort = (column: SortColumn) => {
    if (sortColumn === column) {
      // Toggle direction if clicking same column
      setSortDirection(sortDirection === "asc" ? "desc" : "asc");
    } else {
      // New column, default to ascending
      setSortColumn(column);
      setSortDirection("asc");
    }
  };

  const sortedBoxeurs = useMemo(() => {
    if (!sortColumn) return boxeurs;

    return [...boxeurs].sort((a, b) => {
      let aVal: SortValue;
      let bVal: SortValue;

      switch (sortColumn) {
        case "nom":
          aVal = a.nom.toLowerCase();
          bVal = b.nom.toLowerCase();
          break;
        case "sexe":
          aVal = a.sexe;
          bVal = b.sexe;
          break;
        case "annee":
          aVal = getAnneeFromDate(a.dateNaissance) || 0;
          bVal = getAnneeFromDate(b.dateNaissance) || 0;
          break;
        case "poids":
          aVal = a.poids;
          bVal = b.poids;
          break;
        case "gant":
          aVal = a.gant;
          bVal = b.gant;
          break;
        case "categoriePoids":
          aVal = a.categoriePoids;
          bVal = b.categoriePoids;
          break;
        case "categorieAge":
          aVal = a.categorieAge;
          bVal = b.categorieAge;
          break;
        case "club":
          aVal = a.club.nom.toLowerCase();
          bVal = b.club.nom.toLowerCase();
          break;
      }

      if (aVal < bVal) return sortDirection === "asc" ? -1 : 1;
      if (aVal > bVal) return sortDirection === "asc" ? 1 : -1;
      return 0;
    });
  }, [boxeurs, sortColumn, sortDirection]);

  const getSortIcon = (column: SortColumn) => {
    if (sortColumn !== column) return " ⇅";
    return sortDirection === "asc" ? " ↑" : " ↓";
  };

  const hasIncompleteInfo = (boxeur: Boxeur): boolean => {
    // Vérifier d'abord le flag manuel
    if (boxeur.infoIncomplete) return true;

    // Vérifier si le nom ou prénom est trop court
    if (boxeur.nom.length < 2 || boxeur.prenom.length < 2) return true;
    // Vérifier si le poids semble incorrect (trop bas ou trop élevé)
    if (boxeur.poids < 30 || boxeur.poids > 150) return true;
    return false;
  };

  const handleToggleInfoIncomplete = async (boxeur: Boxeur) => {
    const newValue = !boxeur.infoIncomplete;
    await onUpdate(boxeur.id, "infoIncomplete", newValue);
  };

  if (loading) {
    return (
      <div className="card">
        <p style={{ textAlign: "center", padding: "40px", color: "#888" }}>
          Chargement...
        </p>
      </div>
    );
  }

  if (boxeurs.length === 0) {
    return (
      <div className="card">
        <div className="empty-state">
          <div className="empty-state-icon">🥊</div>
          <p>Aucun tireur inscrit</p>
          <button className="btn btn-primary" onClick={onOpenModal}>
            + Inscrire le premier tireur
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
              <th
                onClick={() => handleSort("nom")}
                style={{ cursor: "pointer" }}
              >
                Nom{getSortIcon("nom")}
              </th>
              <th
                onClick={() => handleSort("sexe")}
                style={{ cursor: "pointer" }}
              >
                Sexe{getSortIcon("sexe")}
              </th>
              <th
                onClick={() => handleSort("annee")}
                style={{ cursor: "pointer" }}
              >
                Année{getSortIcon("annee")}
              </th>
              <th
                onClick={() => handleSort("poids")}
                style={{ cursor: "pointer" }}
              >
                Poids{getSortIcon("poids")}
              </th>
              <th
                onClick={() => handleSort("gant")}
                style={{ cursor: "pointer" }}
              >
                Gant{getSortIcon("gant")}
              </th>
              <th
                onClick={() => handleSort("categoriePoids")}
                style={{ cursor: "pointer" }}
              >
                Cat. Poids{getSortIcon("categoriePoids")}
              </th>
              <th
                onClick={() => handleSort("categorieAge")}
                style={{ cursor: "pointer" }}
              >
                Cat. Âge{getSortIcon("categorieAge")}
              </th>
              <th
                onClick={() => handleSort("club")}
                style={{ cursor: "pointer" }}
              >
                Club{getSortIcon("club")}
              </th>
              <th style={{ textAlign: "center" }} title="Information complète">
                ℹ️
              </th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {sortedBoxeurs.map((b) => (
              <tr
                key={b.id}
                style={{
                  borderLeft: hasIncompleteInfo(b) ? "5px solid #ffc107" : undefined,
                }}
              >
                <td data-label="Nom">
                  <EditableCell
                    value={`${b.nom.toUpperCase()} ${b.prenom}`}
                    type="text"
                    onSave={async (newValue) => {
                      const parts = String(newValue).split(" ");
                      if (parts.length >= 2) {
                        const nom = parts[0];
                        const prenom = parts.slice(1).join(" ");
                        await onUpdate(b.id, "nom", nom);
                        await onUpdate(b.id, "prenom", prenom);
                      }
                    }}
                  />
                </td>
                <td data-label="Sexe">
                  <span className="badge badge-sexe">
                    {b.sexe === "M" ? "H" : "F"}
                  </span>
                </td>
                <td data-label="Année">
                  <EditableCell
                    value={getAnneeFromDate(b.dateNaissance)}
                    type="number"
                    onSave={async (newValue) => {
                      await onUpdate(b.id, "anneeNaissance", String(newValue));
                    }}
                  />{" "}
                  <span style={{ color: "#555", fontSize: 12 }}>
                    (
                    {new Date().getFullYear() -
                      getAnneeFromDate(b.dateNaissance)!}{" "}
                    ans)
                  </span>
                </td>
                <td data-label="Poids">
                  <EditableCell
                    value={b.poids}
                    type="number"
                    onSave={async (newValue) => {
                      await onUpdate(b.id, "poids", String(newValue));
                    }}
                  />{" "}
                  kg
                </td>
                <td data-label="Gant">
                  <span className="badge-gant" style={getGantStyle(b.gant)}>
                    <EditableCell
                      value={b.gant}
                      type="select"
                      options={GANTS_COULEUR}
                      onSave={async (newValue) => {
                        await onUpdate(b.id, "gant", String(newValue));
                      }}
                    />
                  </span>
                </td>
                <td data-label="Cat. Poids">
                  <span className="badge badge-category">
                    {b.categoriePoids}
                  </span>
                </td>
                <td data-label="Cat. Âge" className="mobile-hide">
                  <span className="badge badge-category">{b.categorieAge}</span>
                </td>
                <td data-label="Club">
                  <span className="badge badge-club">{b.club.nom}</span>
                </td>
                <td data-label="Info" className="mobile-hide" style={{ textAlign: "center" }}>
                  {hasIncompleteInfo(b) ? (
                    <span
                      title="Cliquez pour marquer comme complet"
                      style={{ fontSize: "20px", cursor: "pointer" }}
                      onClick={() => handleToggleInfoIncomplete(b)}
                    >
                      ⚠️
                    </span>
                  ) : (
                    <span
                      title="Cliquez pour marquer comme incomplet"
                      style={{
                        fontSize: "16px",
                        color: "#28a745",
                        cursor: "pointer",
                      }}
                      onClick={() => handleToggleInfoIncomplete(b)}
                    >
                      ✓
                    </span>
                  )}
                </td>
                <td data-label="">
                  <button
                    className="btn-icon btn-danger"
                    onClick={() => onDelete(b.id)}
                    title="Supprimer"
                  >
                    🗑️
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
