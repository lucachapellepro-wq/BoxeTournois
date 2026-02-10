"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { useMatches } from "@/hooks/useMatches";
import { calculateAge } from "@/lib/ui-helpers";
import Link from "next/link";
import { Match } from "@/types/match";
import { TournoiDetail } from "@/types";

export default function FeuilleTournoiPage() {
  const params = useParams();
  const tournoiId = parseInt(params.id as string);
  const { matches: initialMatches, fetchMatches } = useMatches(tournoiId);

  const [tournoi, setTournoi] = useState<TournoiDetail | null>(null);
  const [matches, setMatches] = useState<(Match | { separator: true })[]>([]);
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);
  const [minSpacing, setMinSpacing] = useState<number>(2);

  useEffect(() => {
    fetchTournoi();
    fetchMatches();
  }, [fetchMatches]);

  useEffect(() => {
    // Séparer vrais matchs et matchs provisoires (TBD)
    const realMatches = initialMatches.filter(
      (m) => m.boxeur1 || m.boxeur2
    );
    const tbdMatches = initialMatches.filter(
      (m) => !m.boxeur1 && !m.boxeur2
    );

    // Organiser les deux groupes
    const organizedReal = organizeByRounds(realMatches, minSpacing, false);
    const organizedTbd = organizeByRounds(tbdMatches, minSpacing, true);

    // Combiner avec séparateur si il y a les deux
    const combined: (Match | { separator: true })[] = [];
    combined.push(...organizedReal);

    if (realMatches.length > 0 && tbdMatches.length > 0) {
      combined.push({ separator: true });
    }

    combined.push(...organizedTbd);
    setMatches(combined);
  }, [initialMatches, minSpacing]);

  const organizeByRounds = (matchesToOrganize: Match[], spacing: number, isProvisional: boolean) => {
    // Fonction pour espacer les matchs d'une même personne
    const spaceMatches = (matches: Match[]) => {
      if (matches.length === 0) return [];

      // Mélanger d'abord aléatoirement
      const shuffled = [...matches].sort(() => Math.random() - 0.5);
      const result: Match[] = [];
      const remaining = [...shuffled];

      while (remaining.length > 0) {
        let placed = false;

        for (let i = 0; i < remaining.length; i++) {
          const match = remaining[i];
          const boxeurIds = [match.boxeur1Id, match.boxeur2Id].filter(id => id !== null);

          // Vérifier si on peut placer ce match (aucun boxeur dans les X derniers matchs)
          const canPlace = boxeurIds.every(boxeurId => {
            const recentMatches = result.slice(-spacing);
            return !recentMatches.some(m =>
              m.boxeur1Id === boxeurId || m.boxeur2Id === boxeurId
            );
          });

          if (canPlace || result.length === 0) {
            result.push(match);
            remaining.splice(i, 1);
            placed = true;
            break;
          }
        }

        // Si aucun match ne peut être placé, prendre le premier disponible
        if (!placed && remaining.length > 0) {
          result.push(remaining.shift()!);
        }
      }

      return result;
    };

    // Si ce sont des matchs provisoires, respecter l'ordre par catégorie/sexe
    if (isProvisional) {
      // Grouper par catégorie/sexe
      const byCategorySexe = new Map<string, Match[]>();
      matchesToOrganize.forEach(match => {
        const key = `${match.sexe}|${match.categorieAge}|${match.categoriePoids}|${match.gant}`;
        if (!byCategorySexe.has(key)) {
          byCategorySexe.set(key, []);
        }
        byCategorySexe.get(key)!.push(match);
      });

      // Pour chaque groupe, organiser par ordre de round
      const allOrganized: Match[] = [];
      byCategorySexe.forEach(matches => {
        // Séparer par round
        const demis = matches.filter(m => m.matchType === "BRACKET" && m.bracketRound === "DEMI");
        const finales = matches.filter(m => m.matchType === "BRACKET" && m.bracketRound === "FINAL");
        const poules = matches.filter(m => m.matchType === "POOL");
        const autres = matches.filter(m =>
          m.matchType !== "POOL" &&
          (!m.bracketRound || (m.bracketRound !== "DEMI" && m.bracketRound !== "FINAL"))
        );

        // Ajouter dans l'ordre : autres → demis/poules → finales
        allOrganized.push(...autres, ...demis, ...poules, ...finales);
      });

      // Mélanger tout en respectant les contraintes
      return spaceMatches(allOrganized);
    }

    // Sinon, tout mélanger simplement
    return spaceMatches(matchesToOrganize);
  };

  const fetchTournoi = async () => {
    try {
      const res = await fetch(`/api/tournois/${tournoiId}`);
      if (res.ok) {
        const data = await res.json();
        setTournoi(data);
      }
    } catch (error) {
      console.error("Erreur fetch tournoi:", error);
    }
  };

  const handleDragStart = (index: number) => {
    setDraggedIndex(index);
  };

  const handleDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault();
  };

  const handleDrop = (e: React.DragEvent, dropIndex: number) => {
    e.preventDefault();
    if (draggedIndex === null || draggedIndex === dropIndex) return;

    const newMatches = [...matches];
    const [draggedMatch] = newMatches.splice(draggedIndex, 1);
    newMatches.splice(dropIndex, 0, draggedMatch);

    setMatches(newMatches);
    setDraggedIndex(null);
  };

  const handleRandomize = () => {
    // Séparer vrais matchs et matchs provisoires (pas les séparateurs)
    const allMatches = matches.filter((m): m is Match => !('separator' in m));
    const realMatches = allMatches.filter(m => m.boxeur1 || m.boxeur2);
    const tbdMatches = allMatches.filter(m => !m.boxeur1 && !m.boxeur2);

    // Organiser les deux groupes
    const organizedReal = organizeByRounds(realMatches, minSpacing, false);
    const organizedTbd = organizeByRounds(tbdMatches, minSpacing, true);

    // Combiner avec séparateur
    const combined: (Match | { separator: true })[] = [];
    combined.push(...organizedReal);

    if (realMatches.length > 0 && tbdMatches.length > 0) {
      combined.push({ separator: true });
    }

    combined.push(...organizedTbd);
    setMatches(combined);
  };

  const handlePrint = () => {
    window.print();
  };

  if (!tournoi) {
    return (
      <div className="container" style={{ paddingTop: 40 }}>
        <div className="card">
          <p style={{ textAlign: "center", padding: 40, color: "#888" }}>
            Chargement...
          </p>
        </div>
      </div>
    );
  }

  return (
    <>
      <style jsx>{`
        @media print {
          .no-print {
            display: none !important;
          }
          body {
            background: white;
          }
          .feuille-container {
            max-width: 100% !important;
            padding: 20px !important;
          }
          .match-row {
            page-break-inside: avoid;
          }
        }
      `}</style>

      <div className="feuille-container" style={{ padding: "40px 20px", maxWidth: 1200, margin: "0 auto" }}>
        {/* Header - No print */}
        <div className="no-print feuille-header" style={{ marginBottom: 32, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div>
            <h1 style={{ fontSize: 28, marginBottom: 8 }}>
              📋 Feuille de tournoi
            </h1>
            <p style={{ color: "#888", fontSize: 14 }}>
              Glisse-dépose pour réorganiser • Imprime pour la feuille officielle
            </p>
          </div>
          <div className="feuille-controls" style={{ display: "flex", gap: 12, alignItems: "center" }}>
            <Link href={`/tournois/${tournoiId}/affrontements`} className="btn btn-ghost">
              ← Retour
            </Link>
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <label style={{ fontSize: 14, color: "#888" }}>Espacement min :</label>
              <input
                type="number"
                min="0"
                max="20"
                value={minSpacing}
                onChange={(e) => setMinSpacing(parseInt(e.target.value) || 0)}
                style={{
                  width: 60,
                  padding: "6px 12px",
                  backgroundColor: "#1a1a1a",
                  border: "1px solid #2a2a2a",
                  borderRadius: 6,
                  color: "#fff",
                  fontSize: 14,
                }}
              />
            </div>
            <button className="btn btn-secondary" onClick={handleRandomize}>
              🎲 Randomiser
            </button>
            <button className="btn btn-primary" onClick={handlePrint}>
              🖨️ Imprimer
            </button>
          </div>
        </div>

        {/* Titre pour impression */}
        <div style={{ marginBottom: 32, textAlign: "center" }}>
          <h1 style={{ fontSize: 32, marginBottom: 8, color: "#e63946" }}>
            {tournoi.nom}
          </h1>
          <p style={{ fontSize: 18, color: "#888" }}>
            {new Date(tournoi.date).toLocaleDateString("fr-FR", {
              weekday: "long",
              year: "numeric",
              month: "long",
              day: "numeric",
            })}
          </p>
          <p style={{ fontSize: 16, color: "#888", marginTop: 8 }}>
            {matches.filter(m => !('separator' in m)).length} combat{matches.filter(m => !('separator' in m)).length > 1 ? "s" : ""}
          </p>
        </div>

        {/* Tableau des matchs */}
        <div style={{ marginTop: 32 }}>
          {/* Header du tableau */}
          <div
            className="feuille-table-header"
            style={{
              display: "grid",
              gridTemplateColumns: "60px 200px 1fr 80px 1fr",
              gap: 16,
              padding: "16px 12px",
              backgroundColor: "#1a1a1a",
              borderRadius: "8px 8px 0 0",
              fontWeight: "bold",
              fontSize: 14,
              color: "#d4a337",
            }}
          >
            <div style={{ textAlign: "center" }}>N°</div>
            <div>Catégorie</div>
            <div style={{ textAlign: "center", color: "#3498db" }}>🔵 COIN BLEU</div>
            <div style={{ textAlign: "center" }}>VS</div>
            <div style={{ textAlign: "center", color: "#e63946" }}>🔴 COIN ROUGE</div>
          </div>

          {/* Lignes des matchs */}
          {matches.length === 0 ? (
            <div
              style={{
                padding: 48,
                textAlign: "center",
                color: "#888",
                backgroundColor: "#0a0a0a",
                borderRadius: "0 0 8px 8px",
              }}
            >
              Aucun match à afficher
            </div>
          ) : (
            (() => {
              let matchNumber = 0;
              return matches.map((item, index) => {
                // Si c'est un séparateur
                if ('separator' in item) {
                  return (
                    <div
                      key={`separator-${index}`}
                      style={{
                        height: 2,
                        backgroundColor: "#d4a337",
                        margin: "16px 0",
                      }}
                    />
                  );
                }

                // Sinon c'est un match
                const match = item as Match;
                matchNumber++;
                const currentMatchNumber = matchNumber;

                return (
              <div
                key={match.id}
                className="match-row"
                draggable
                onDragStart={() => handleDragStart(index)}
                onDragOver={(e) => handleDragOver(e, index)}
                onDrop={(e) => handleDrop(e, index)}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 16,
                  padding: "8px 12px",
                  backgroundColor: index % 2 === 0 ? "#0a0a0a" : "#000",
                  borderBottom: "1px solid #1a1a1a",
                  cursor: "move",
                  transition: "background-color 0.2s",
                  fontSize: 14,
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = "#1a1a1a";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor =
                    index % 2 === 0 ? "#0a0a0a" : "#000";
                }}
              >
                {/* Numéro */}
                <div
                  className="match-row-number"
                  style={{
                    minWidth: 40,
                    textAlign: "center",
                    fontSize: 20,
                    fontWeight: "bold",
                    color: "#d4a337",
                  }}
                >
                  {currentMatchNumber}
                </div>

                {/* Catégorie / Sexe */}
                <div className="match-row-category" style={{ minWidth: 200, fontWeight: "600", color: "#fff" }}>
                  {match.categoriePoids} {match.sexe === "F" ? "♀" : "♂"}
                  {match.matchType === "BRACKET" && match.bracketRound && ` - ${match.bracketRound}`}
                  {match.matchType === "POOL" && match.poolName && ` - Poule ${match.poolName}`}
                </div>

                {/* Boxeur 1 */}
                <div className="match-row-fighter" style={{ flex: 1, color: "#3498db", fontWeight: "500" }}>
                  {match.boxeur1 ? (
                    `${match.boxeur1.nom.toUpperCase()} ${match.boxeur1.prenom} (${match.boxeur1.club.nom})`
                  ) : (
                    <span style={{ color: "#666", fontStyle: "italic" }}>TBD</span>
                  )}
                </div>

                {/* VS */}
                <div className="match-row-vs" style={{ color: "#666", fontWeight: "bold", padding: "0 4px" }}>vs</div>

                {/* Boxeur 2 */}
                <div className="match-row-fighter" style={{ flex: 1, color: "#e63946", fontWeight: "500" }}>
                  {match.boxeur2 ? (
                    `${match.boxeur2.nom.toUpperCase()} ${match.boxeur2.prenom} (${match.boxeur2.club.nom})`
                  ) : (
                    <span style={{ color: "#666", fontStyle: "italic" }}>TBD</span>
                  )}
                </div>
              </div>
                );
              });
            })()
          )}
        </div>

        {/* Footer pour impression */}
        <div style={{ marginTop: 48, paddingTop: 24, borderTop: "2px solid #2a2a2a", textAlign: "center", color: "#666", fontSize: 12 }}>
          <p>Document généré le {new Date().toLocaleDateString("fr-FR")} à {new Date().toLocaleTimeString("fr-FR")}</p>
        </div>
      </div>
    </>
  );
}
