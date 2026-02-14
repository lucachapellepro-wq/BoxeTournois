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
  | "club"
  | "typeCompetition";
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
        case "typeCompetition":
          aVal = a.typeCompetition;
          bVal = b.typeCompetition;
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
        <div className="loading-state"><div className="spinner" /></div>
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
                className="sortable"
                onClick={() => handleSort("nom")}
              >
                Nom{getSortIcon("nom")}
              </th>
              <th
                className="sortable"
                onClick={() => handleSort("sexe")}
              >
                Sexe{getSortIcon("sexe")}
              </th>
              <th
                className="sortable"
                onClick={() => handleSort("typeCompetition")}
              >
                Type{getSortIcon("typeCompetition")}
              </th>
              <th
                className="sortable"
                onClick={() => handleSort("annee")}
              >
                Année{getSortIcon("annee")}
              </th>
              <th
                className="sortable"
                onClick={() => handleSort("poids")}
              >
                Poids{getSortIcon("poids")}
              </th>
              <th
                className="sortable"
                onClick={() => handleSort("gant")}
              >
                Gant{getSortIcon("gant")}
              </th>
              <th
                className="sortable"
                onClick={() => handleSort("categoriePoids")}
              >
                Cat. Poids{getSortIcon("categoriePoids")}
              </th>
              <th
                className="sortable"
                onClick={() => handleSort("categorieAge")}
              >
                Cat. Âge{getSortIcon("categorieAge")}
              </th>
              <th
                className="sortable"
                onClick={() => handleSort("club")}
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
                className={hasIncompleteInfo(b) ? "row-incomplete" : ""}
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
                <td data-label="Type">
                  <span
                    className={`badge ${b.typeCompetition === "INTERCLUB" ? "badge-interclub" : "badge-tournoi"}`}
                    onClick={async () => {
                      const newType = b.typeCompetition === "TOURNOI" ? "INTERCLUB" : "TOURNOI";
                      await onUpdate(b.id, "typeCompetition", newType);
                    }}
                    title="Cliquer pour changer"
                  >
                    {b.typeCompetition === "INTERCLUB" ? "Interclub" : "Tournoi"}
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
                  <span style={{ color: "var(--text-muted)", fontSize: 12 }}>
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
                      className="info-toggle info-incomplete"
                      title="Cliquez pour marquer comme complet"
                      onClick={() => handleToggleInfoIncomplete(b)}
                    >
                      ⚠️
                    </span>
                  ) : (
                    <span
                      className="info-toggle info-complete"
                      title="Cliquez pour marquer comme incomplet"
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
