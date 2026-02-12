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

    // Grouper par catégorie/sexe pour respecter l'ordre des rounds
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
      const isDemi = (m: Match) => m.bracketRound === "DEMI" || (m.poolName?.startsWith("DEMI") ?? false);
      const isFinale = (m: Match) => m.bracketRound === "FINAL" || m.poolName === "FINALE";
      const isPoule = (m: Match) => m.matchType === "POOL" && !isDemi(m) && !isFinale(m) && m.poolName !== "MANUEL";

      const demis = matches.filter(isDemi);
      const finales = matches.filter(isFinale);
      const poules = matches.filter(isPoule);
      const autres = matches.filter(m => !isDemi(m) && !isFinale(m) && !isPoule(m));

      // Ajouter dans l'ordre : autres → poules → demis → finales
      allOrganized.push(...autres, ...poules, ...demis, ...finales);
    });

    // Mélanger tout en respectant les contraintes d'espacement
    return spaceMatches(allOrganized);
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

  const isMatchInterclub = (match: Match): boolean => {
    return match.boxeur1?.typeCompetition === "INTERCLUB" || match.boxeur2?.typeCompetition === "INTERCLUB";
  };

  const isMixte = (match: Match): boolean => {
    return match.poolName === "MANUEL" || match.poolName === "MIXTE" || !!match.boxeur2Manual;
  };

  const getMatchColor = (match: Match): string => {
    if (isMixte(match)) return "#1abc9c"; // Turquoise - Interclub mixte
    if (isMatchInterclub(match)) return "#f39c12"; // Jaune doré - Interclub
    if (match.bracketRound === "FINAL" || match.poolName === "FINALE") return "#e74c3c"; // Rouge - Finales
    if (match.bracketRound === "DEMI" || match.poolName?.startsWith("DEMI")) return "#8e44ad"; // Violet - Demis
    if (match.matchType === "POOL") return "#27ae60"; // Vert - Poules
    return "#2980b9"; // Bleu - Élimination
  };

  const getMatchLabel = (match: Match): string => {
    if (isMixte(match)) return "Mixte";
    if (isMatchInterclub(match)) return "Interclub";
    if (match.bracketRound === "FINAL" || match.poolName === "FINALE") return "Finale";
    if (match.bracketRound === "DEMI" || match.poolName?.startsWith("DEMI")) return "Demi";
    if (match.matchType === "POOL") return "Poule";
    return "Élim.";
  };

  const getMatchLabelFull = (match: Match): string => {
    if (isMixte(match)) return "Interclub mixte";
    if (isMatchInterclub(match)) return "Interclub";
    if (match.bracketRound === "FINAL" || match.poolName === "FINALE") return "Finale";
    if (match.bracketRound === "DEMI" || match.poolName?.startsWith("DEMI")) return "Demi-finale";
    if (match.matchType === "POOL") return "Poule";
    return "Élimination directe";
  };

  if (!tournoi) {
    return (
      <div className="container" style={{ paddingTop: 40 }}>
        <div className="card">
          <div className="loading-state"><div className="spinner" /></div>
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
            background: white !important;
            color: black !important;
            -webkit-print-color-adjust: exact;
            print-color-adjust: exact;
          }
          .feuille-container {
            max-width: 100% !important;
            padding: 5mm 8mm !important;
          }
          .feuille-table-header {
            display: grid !important;
            grid-template-columns: 25px 45px 130px 1fr 25px 1fr !important;
            gap: 4px !important;
            padding: 2px 6px !important;
            font-size: 9px !important;
            color: #666 !important;
            border-bottom: 1px solid #999 !important;
            background: white !important;
          }
          .match-row {
            display: grid !important;
            grid-template-columns: 25px 45px 130px 1fr 25px 1fr !important;
            gap: 4px !important;
            padding: 2px 6px !important;
            font-size: 10px !important;
            line-height: 1.3 !important;
            background-color: white !important;
            border-bottom: 0.5px solid #ccc !important;
            border-left-width: 3px !important;
            cursor: default !important;
            page-break-inside: avoid;
          }
          .match-row-number {
            font-size: 11px !important;
            min-width: auto !important;
            color: #333 !important;
          }
          .match-row-category {
            min-width: auto !important;
            font-size: 9px !important;
            color: #333 !important;
            white-space: nowrap !important;
            overflow: hidden !important;
            text-overflow: ellipsis !important;
          }
          .match-row-fighter {
            font-size: 10px !important;
            white-space: nowrap !important;
            overflow: hidden !important;
            text-overflow: ellipsis !important;
            flex: unset !important;
          }
          .match-row-type span {
            background-color: transparent !important;
            border: none !important;
            padding: 0 !important;
            font-size: 8px !important;
            font-weight: 600 !important;
          }
          .match-row-type {
            min-width: auto !important;
          }
          .match-row-vs {
            font-size: 9px !important;
            padding: 0 !important;
            text-align: center !important;
            color: #999 !important;
          }
          .fighter-tag {
            font-size: 8px !important;
            margin-left: 1px !important;
          }
          .fighter-club {
            font-size: 8px !important;
            color: #666 !important;
          }
          .feuille-title h1 {
            font-size: 18px !important;
            color: #333 !important;
            margin-bottom: 2px !important;
          }
          .feuille-title p {
            font-size: 11px !important;
            color: #666 !important;
            margin-top: 2px !important;
          }
          .feuille-title {
            margin-bottom: 10px !important;
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
                  width: 70,
                  padding: "8px 12px",
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
        <div className="feuille-title" style={{ marginBottom: 32, textAlign: "center" }}>
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

        {/* Légende des couleurs */}
        <div className="no-print" style={{ display: "flex", gap: 20, marginTop: 24, marginBottom: 16, flexWrap: "wrap" }}>
          {[
            { color: "#27ae60", label: "Poule" },
            { color: "#8e44ad", label: "Demi-finale" },
            { color: "#e74c3c", label: "Finale" },
            { color: "#2980b9", label: "Élimination" },
            { color: "#f39c12", label: "Interclub" },
            { color: "#1abc9c", label: "Interclub mixte" },
          ].map(({ color, label }) => (
            <div key={label} style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <div style={{ width: 14, height: 14, borderRadius: 3, backgroundColor: color }} />
              <span style={{ fontSize: 13, color: "#aaa" }}>{label}</span>
            </div>
          ))}
        </div>

        {/* Tableau des matchs */}
        <div style={{ marginTop: 8 }}>
          {/* Header du tableau */}
          <div
            className="feuille-table-header"
            style={{
              display: "grid",
              gridTemplateColumns: "60px 70px 200px 1fr 80px 1fr",
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
            <div style={{ textAlign: "center" }}>Type</div>
            <div>Catégorie</div>
            <div style={{ textAlign: "center", color: "#3498db" }}>COIN BLEU</div>
            <div style={{ textAlign: "center" }}>VS</div>
            <div style={{ textAlign: "center", color: "#e63946" }}>COIN ROUGE</div>
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

                const matchColor = getMatchColor(match);
                const matchLabel = getMatchLabel(match);
                const matchLabelFull = getMatchLabelFull(match);

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
                  borderLeft: `4px solid ${matchColor}`,
                  cursor: "move",
                  transition: "background-color 0.2s",
                  fontSize: 14,
                } as React.CSSProperties}
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

                {/* Badge type */}
                <div className="match-row-type" style={{ minWidth: 60, textAlign: "center" }}>
                  <span title={matchLabelFull} style={{
                    display: "inline-block",
                    padding: "2px 8px",
                    borderRadius: 4,
                    fontSize: 11,
                    fontWeight: 700,
                    backgroundColor: `${matchColor}20`,
                    color: matchColor,
                    border: `1px solid ${matchColor}40`,
                    cursor: "default",
                  }}>
                    {matchLabel}
                  </span>
                </div>

                {/* Catégorie / Sexe */}
                <div className="match-row-category" style={{ minWidth: 200, fontWeight: "600", color: "#fff" }}>
                  {match.categoriePoids} {match.sexe === "F" ? "♀" : "♂"}
                  {match.matchType === "BRACKET" && match.bracketRound && ` - ${match.bracketRound}`}
                  {match.matchType === "POOL" && match.poolName && match.poolName !== "MANUEL" && ` - Poule ${match.poolName}`}
                </div>

                {/* Boxeur 1 */}
                <div className="match-row-fighter" style={{ flex: 1, color: "#3498db", fontWeight: "500" }}>
                  {match.boxeur1 ? (
                    <>
                      {match.boxeur1.nom.toUpperCase()} {match.boxeur1.prenom}
                      <span className="fighter-tag" style={{ fontSize: 10, marginLeft: 3, color: match.boxeur1.typeCompetition === "INTERCLUB" ? "#22C55E" : "#3B82F6" }}>
                        ({match.boxeur1.typeCompetition === "INTERCLUB" ? "I" : "T"})
                      </span>
                      <span className="fighter-club" style={{ color: "#888", fontSize: 12 }}> ({match.boxeur1.club.nom})</span>
                    </>
                  ) : (
                    <span style={{ color: "#666", fontStyle: "italic" }}>TBD</span>
                  )}
                </div>

                {/* VS */}
                <div className="match-row-vs" style={{ color: "#666", fontWeight: "bold", padding: "0 4px" }}>vs</div>

                {/* Boxeur 2 */}
                <div className="match-row-fighter" style={{ flex: 1, color: "#e63946", fontWeight: "500" }}>
                  {match.boxeur2 ? (
                    <>
                      {match.boxeur2.nom.toUpperCase()} {match.boxeur2.prenom}
                      <span className="fighter-tag" style={{ fontSize: 10, marginLeft: 3, color: match.boxeur2.typeCompetition === "INTERCLUB" ? "#22C55E" : "#3B82F6" }}>
                        ({match.boxeur2.typeCompetition === "INTERCLUB" ? "I" : "T"})
                      </span>
                      <span className="fighter-club" style={{ color: "#888", fontSize: 12 }}> ({match.boxeur2.club.nom})</span>
                    </>
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
