"use client";

import { useEffect, useState, useMemo } from "react";
import { useParams } from "next/navigation";
import { useMatches } from "@/hooks/useMatches";
import Link from "next/link";
import { Match } from "@/types/match";
import { TournoiDetail } from "@/types";
import {
  isInterclub, isManuel, isMixte, isDemi, isFinale, isPoule,
  isInterclubOrMixte,
  getMatchColor, getMatchLabel, getMatchLabelFull,
  extractWinners,
} from "@/lib/match-helpers";

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

  const winners = useMemo(() => extractWinners(initialMatches), [initialMatches]);

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
          .winners-section {
            margin-top: 8px !important;
            page-break-inside: avoid;
          }
          .winners-section h2 {
            font-size: 11px !important;
            color: #333 !important;
            margin-bottom: 4px !important;
            padding-bottom: 3px !important;
            border-color: #999 !important;
            border-bottom-width: 1px !important;
          }
          .winners-section > div {
            display: block !important;
            grid-template-columns: unset !important;
          }
          .winners-section .winner-row {
            display: flex !important;
            padding: 2px 6px !important;
            font-size: 9px !important;
            border-left-width: 3px !important;
            background: white !important;
            border-bottom: 0.5px solid #ccc !important;
            gap: 6px !important;
          }
          .winners-section .winner-row span[style*="font-size: 18px"] {
            font-size: 9px !important;
          }
          .winners-section .winner-row span[style*="font-size: 10px"] {
            font-size: 7px !important;
          }
          .winners-section .winner-row span[style*="font-size: 12px"] {
            font-size: 8px !important;
          }
          .winners-section .winner-row span[style*="font-size: 11px"] {
            font-size: 8px !important;
          }
          .winners-section .winner-row div[style*="font-size: 11px"] {
            font-size: 8px !important;
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
            <p style={{ color: "var(--text-secondary)", fontSize: 14 }}>
              Glisse-dépose pour réorganiser • Imprime pour la feuille officielle
            </p>
          </div>
          <div className="feuille-controls" style={{ display: "flex", gap: 12, alignItems: "center" }}>
            <Link href={`/tournois/${tournoiId}/affrontements`} className="btn btn-ghost">
              ← Retour
            </Link>
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <label style={{ fontSize: 14 }}>Espacement min :</label>
              <input
                type="number"
                min="0"
                max="20"
                value={minSpacing}
                onChange={(e) => setMinSpacing(parseInt(e.target.value) || 0)}
                style={{ width: 70 }}
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
          <h1 style={{ fontSize: 32, marginBottom: 8, color: "var(--accent)" }}>
            {tournoi.nom}
          </h1>
          <p style={{ fontSize: 18, color: "var(--text-secondary)" }}>
            {new Date(tournoi.date).toLocaleDateString("fr-FR", {
              weekday: "long",
              year: "numeric",
              month: "long",
              day: "numeric",
            })}
          </p>
          <p style={{ fontSize: 16, color: "var(--text-secondary)", marginTop: 8 }}>
            {matches.filter(m => !('separator' in m)).length} combat{matches.filter(m => !('separator' in m)).length > 1 ? "s" : ""}
          </p>
        </div>

        {/* Légende des couleurs */}
        <div className="no-print feuille-legend" style={{ marginTop: 24, marginBottom: 16 }}>
          {[
            { color: "var(--pool-green)", label: "Poule" },
            { color: "var(--demi)", label: "Demi-finale" },
            { color: "var(--danger)", label: "Finale" },
            { color: "var(--elim-blue)", label: "Élimination" },
            { color: "var(--interclub)", label: "Interclub" },
            { color: "var(--mixte)", label: "Interclub mixte" },
            { color: "var(--manual)", label: "Combat ajouté" },
          ].map(({ color, label }) => (
            <div key={label} className="feuille-legend-item">
              <div className="feuille-legend-dot" style={{ backgroundColor: color }} />
              <span className="feuille-legend-label">{label}</span>
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
              backgroundColor: "var(--bg-secondary)",
              borderRadius: "var(--radius) var(--radius) 0 0",
              fontWeight: "bold",
              fontSize: 14,
              color: "var(--gold)",
            }}
          >
            <div style={{ textAlign: "center" }}>N°</div>
            <div style={{ textAlign: "center" }}>Type</div>
            <div>Catégorie</div>
            <div style={{ textAlign: "center", color: "var(--blue)" }}>COIN BLEU</div>
            <div style={{ textAlign: "center" }}>VS</div>
            <div style={{ textAlign: "center", color: "var(--accent)" }}>COIN ROUGE</div>
          </div>

          {/* Lignes des matchs */}
          {matches.length === 0 ? (
            <div
              style={{
                padding: 48,
                textAlign: "center",
                color: "var(--text-secondary)",
                backgroundColor: "var(--bg-primary)",
                borderRadius: "0 0 var(--radius) var(--radius)",
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
                        backgroundColor: "var(--gold)",
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
                  backgroundColor: index % 2 === 0 ? "var(--bg-row-even)" : "var(--bg-row-odd)",
                  borderBottom: "1px solid var(--border)",
                  borderLeft: `4px solid ${matchColor}`,
                  cursor: "move",
                  transition: "background-color 0.2s",
                  fontSize: 14,
                } as React.CSSProperties}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = "var(--bg-card-hover)";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor =
                    index % 2 === 0 ? "var(--bg-row-even)" : "var(--bg-row-odd)";
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
                    color: "var(--gold)",
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
                <div className="match-row-category" style={{ minWidth: 200, fontWeight: "600", color: "var(--text-primary)" }}>
                  {match.categoriePoids} {match.sexe === "F" ? "♀" : "♂"}
                  {match.matchType === "BRACKET" && match.bracketRound && ` - ${match.bracketRound}`}
                  {match.matchType === "POOL" && match.poolName && match.poolName !== "MANUEL" && ` - Poule ${match.poolName}`}
                </div>

                {/* Boxeur 1 */}
                <div className="match-row-fighter" style={{ flex: 1, color: "var(--blue)", fontWeight: "500" }}>
                  {match.boxeur1 ? (
                    <>
                      {match.boxeur1.nom.toUpperCase()} {match.boxeur1.prenom}
                      <span className="fighter-tag" style={{ fontSize: 10, marginLeft: 3, color: match.boxeur1.typeCompetition === "INTERCLUB" ? "var(--interclub-green)" : "var(--tournoi-blue)" }}>
                        ({match.boxeur1.typeCompetition === "INTERCLUB" ? "Interclub" : "Tournoi"})
                      </span>
                      <span className="fighter-club" style={{ color: "var(--text-secondary)", fontSize: 12 }}> ({match.boxeur1.club.nom})</span>
                    </>
                  ) : (
                    <span style={{ color: "var(--text-muted)", fontStyle: "italic" }}>TBD</span>
                  )}
                </div>

                {/* VS */}
                <div className="match-row-vs" style={{ color: "var(--text-muted)", fontWeight: "bold", padding: "0 4px" }}>vs</div>

                {/* Boxeur 2 */}
                <div className="match-row-fighter" style={{ flex: 1, color: "var(--accent)", fontWeight: "500" }}>
                  {match.boxeur2 ? (
                    <>
                      {match.boxeur2.nom.toUpperCase()} {match.boxeur2.prenom}
                      <span className="fighter-tag" style={{ fontSize: 10, marginLeft: 3, color: match.boxeur2.typeCompetition === "INTERCLUB" ? "var(--interclub-green)" : "var(--tournoi-blue)" }}>
                        ({match.boxeur2.typeCompetition === "INTERCLUB" ? "Interclub" : "Tournoi"})
                      </span>
                      <span className="fighter-club" style={{ color: "var(--text-secondary)", fontSize: 12 }}> ({match.boxeur2.club.nom})</span>
                    </>
                  ) : (
                    <span style={{ color: "var(--text-muted)", fontStyle: "italic" }}>TBD</span>
                  )}
                </div>
              </div>
                );
              });
            })()
          )}
        </div>

        {/* Vainqueurs directs */}
        {winners.length > 0 && (
          <div className="winners-section" style={{ marginTop: 32 }}>
            <h2 style={{ fontSize: 20, marginBottom: 16, color: "var(--gold)", borderBottom: "2px solid var(--gold)", paddingBottom: 8 }}>
              🏆 Vainqueurs directs ({winners.length})
            </h2>
            <div>
              {winners.map((entry) => (
                <div
                  key={entry.boxeur.id}
                  className="winner-row"
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 8,
                    padding: "6px 12px",
                    backgroundColor: "var(--bg-primary)",
                    borderLeft: `4px solid ${entry.source === "interclub" ? "var(--tournoi-blue)" : "var(--gold)"}`,
                    borderBottom: "1px solid var(--border)",
                    fontSize: 14,
                  }}
                >
                  <span style={{ fontWeight: 700 }}>{entry.boxeur.nom.toUpperCase()}</span>
                  <span>{entry.boxeur.prenom}</span>
                  <span style={{ color: "var(--text-secondary)" }}>—</span>
                  <span style={{ color: "var(--gold)" }}>{entry.category}</span>
                  <span>{entry.sexe === "F" ? "♀" : "♂"}</span>
                  <span style={{ color: "var(--text-secondary)" }}>—</span>
                  <span style={{ color: "var(--text-secondary)" }}>{entry.boxeur.club.nom}</span>
                  {entry.source === "interclub" && (
                    <span style={{ fontSize: 11, color: "var(--tournoi-blue)", marginLeft: "auto" }}>Placé en interclub</span>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Footer pour impression */}
        <div style={{ marginTop: 48, paddingTop: 24, borderTop: "2px solid var(--border)", textAlign: "center", color: "var(--text-muted)", fontSize: 12 }}>
          <p>Document généré le {new Date().toLocaleDateString("fr-FR")} à {new Date().toLocaleTimeString("fr-FR")}</p>
        </div>
      </div>
    </>
  );
}
