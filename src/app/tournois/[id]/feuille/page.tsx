"use client";

import { useEffect, useState, useMemo, useCallback } from "react";
import { useParams, useSearchParams } from "next/navigation";
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

/** Feuille de tournoi imprimable : ordre des combats avec drag & drop, légende couleurs, vainqueurs */
/** Organise les matchs par rounds avec espacement (fonction pure, hors composant) */
function organizeByRounds(matchesToOrganize: Match[], spacing: number): Match[] {
  const spaceMatches = (matchList: Match[]) => {
    if (matchList.length === 0) return [];

    const shuffled = [...matchList].sort(() => Math.random() - 0.5);
    const result: Match[] = [];
    const remaining = [...shuffled];

    while (remaining.length > 0) {
      let placed = false;

      for (let i = 0; i < remaining.length; i++) {
        const match = remaining[i];
        const boxeurIds = [match.boxeur1Id, match.boxeur2Id].filter(id => id !== null);

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

      if (!placed && remaining.length > 0) {
        result.push(remaining.shift()!);
      }
    }

    return result;
  };

  const byCategorySexe = new Map<string, Match[]>();
  matchesToOrganize.forEach(match => {
    const key = `${match.sexe}|${match.categorieAge}|${match.categoriePoids}|${match.gant}`;
    if (!byCategorySexe.has(key)) {
      byCategorySexe.set(key, []);
    }
    byCategorySexe.get(key)!.push(match);
  });

  const allOrganized: Match[] = [];
  byCategorySexe.forEach(matches => {
    const demis = matches.filter(isDemi);
    const finales = matches.filter(isFinale);
    const poules = matches.filter(isPoule);
    const autres = matches.filter(m => !isDemi(m) && !isFinale(m) && !isPoule(m));
    allOrganized.push(...autres, ...poules, ...demis, ...finales);
  });

  return spaceMatches(allOrganized);
}

export default function FeuilleTournoiPage() {
  const params = useParams();
  const searchParams = useSearchParams();
  const autoPrint = searchParams.get("print") === "true";
  const tournoiId = Number(params.id) || 0;
  const { matches: initialMatches, fetchMatches } = useMatches(tournoiId);

  const [tournoi, setTournoi] = useState<TournoiDetail | null>(null);
  const [matches, setMatches] = useState<(Match | { separator: true })[]>([]);
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null);
  const [minSpacing, setMinSpacing] = useState<number>(2);
  const [userReordered, setUserReordered] = useState(false);

  // Auto-print quand ouvert avec ?print=true (pour export PDF via "Enregistrer en PDF")
  useEffect(() => {
    if (autoPrint && matches.length > 0 && tournoi) {
      const timer = setTimeout(() => window.print(), 500);
      return () => clearTimeout(timer);
    }
  }, [autoPrint, matches.length, tournoi]);

  useEffect(() => {
    // Ne pas ré-organiser si l'utilisateur a déplacé des matchs manuellement
    if (userReordered) return;

    const realMatches = initialMatches.filter(
      (m) => m.boxeur1 || m.boxeur2
    );
    const tbdMatches = initialMatches.filter(
      (m) => !m.boxeur1 && !m.boxeur2
    );

    const organizedReal = organizeByRounds(realMatches, minSpacing);
    const organizedTbd = organizeByRounds(tbdMatches, minSpacing);

    const combined: (Match | { separator: true })[] = [];
    combined.push(...organizedReal);

    if (realMatches.length > 0 && tbdMatches.length > 0) {
      combined.push({ separator: true });
    }

    combined.push(...organizedTbd);
    setMatches(combined);
  }, [initialMatches, minSpacing, userReordered]);

  const fetchTournoi = useCallback(async () => {
    try {
      const res = await fetch(`/api/tournois/${tournoiId}`);
      if (res.ok) {
        const data = await res.json();
        setTournoi(data);
      }
    } catch (error) {
      console.error("Erreur fetch tournoi:", error);
    }
  }, [tournoiId]);

  useEffect(() => {
    fetchTournoi();
    fetchMatches();
  }, [fetchTournoi, fetchMatches]);

  const handleDragStart = (index: number) => {
    setDraggedIndex(index);
  };

  const handleDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault();
    setDragOverIndex(index);
  };

  const handleDragEnd = () => {
    setDraggedIndex(null);
    setDragOverIndex(null);
  };

  const handleDrop = (e: React.DragEvent, dropIndex: number) => {
    e.preventDefault();
    if (draggedIndex === null || draggedIndex === dropIndex) return;

    const newMatches = [...matches];
    const [draggedMatch] = newMatches.splice(draggedIndex, 1);
    newMatches.splice(dropIndex, 0, draggedMatch);

    setMatches(newMatches);
    setUserReordered(true);
    setDraggedIndex(null);
    setDragOverIndex(null);
  };

  const handleRandomize = () => {
    // Séparer vrais matchs et matchs provisoires (pas les séparateurs)
    const allMatches = matches.filter((m): m is Match => !('separator' in m));
    const realMatches = allMatches.filter(m => m.boxeur1 || m.boxeur2);
    const tbdMatches = allMatches.filter(m => !m.boxeur1 && !m.boxeur2);

    // Organiser les deux groupes
    const organizedReal = organizeByRounds(realMatches, minSpacing);
    const organizedTbd = organizeByRounds(tbdMatches, minSpacing);

    // Combiner avec séparateur
    const combined: (Match | { separator: true })[] = [];
    combined.push(...organizedReal);

    if (realMatches.length > 0 && tbdMatches.length > 0) {
      combined.push({ separator: true });
    }

    combined.push(...organizedTbd);
    setMatches(combined);
    setUserReordered(false);
  };

  const handlePrint = () => {
    window.print();
  };

  const winners = useMemo(() => extractWinners(initialMatches), [initialMatches]);

  if (!tournoi) {
    return (
      <div className="feuille-container">
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
          .match-type-badge {
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
            margin-top: 6px !important;
            page-break-inside: avoid;
          }
          .winners-section h2 {
            font-size: 10px !important;
            color: #333 !important;
            margin-bottom: 2px !important;
            padding-bottom: 2px !important;
            border-color: #999 !important;
            border-bottom-width: 1px !important;
          }
          .winners-section > div {
            display: block !important;
          }
          .winners-section .winner-row {
            display: inline !important;
            padding: 0 !important;
            font-size: 8px !important;
            border-left: none !important;
            border-bottom: none !important;
            background: transparent !important;
            gap: 0 !important;
          }
          .winners-section .winner-row::after {
            content: "  •  ";
            color: #999;
          }
          .winners-section .winner-row:last-child::after {
            content: "";
          }
          .winner-row-name {
            font-size: 8px !important;
            font-weight: 600 !important;
          }
          .winner-row-label {
            font-size: 7px !important;
          }
          .text-muted, .text-gold {
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

      <div className="feuille-container">
        {/* Header - No print */}
        <div className="no-print feuille-header">
          <div>
            <h1 className="feuille-header-title">
              📋 Feuille de tournoi
            </h1>
            <p className="feuille-header-subtitle">
              Glisse-dépose pour réorganiser • Imprime pour la feuille officielle
            </p>
          </div>
          <div className="feuille-controls">
            <Link href={`/tournois/${tournoiId}/affrontements`} className="btn btn-ghost">
              ← Retour
            </Link>
            <div className="feuille-spacing-control">
              <label>Espacement min :</label>
              <input
                type="number"
                min="0"
                max="20"
                value={minSpacing}
                onChange={(e) => setMinSpacing(parseInt(e.target.value) || 0)}
                className="feuille-spacing-input"
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
        <div className="feuille-title">
          <h1>{tournoi.nom}</h1>
          <p className="feuille-title-date">
            {new Date(tournoi.date).toLocaleDateString("fr-FR", {
              weekday: "long",
              year: "numeric",
              month: "long",
              day: "numeric",
            })}
          </p>
          <p className="feuille-title-count">
            {matches.filter(m => !('separator' in m)).length} combat{matches.filter(m => !('separator' in m)).length > 1 ? "s" : ""}
          </p>
        </div>

        {/* Légende des couleurs */}
        <div className="no-print feuille-legend">
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
        <div className="feuille-table">
          {/* Header du tableau */}
          <div className="feuille-table-header">
            <div className="text-center">N°</div>
            <div className="text-center">Type</div>
            <div>Catégorie</div>
            <div className="text-center text-blue">COIN BLEU</div>
            <div className="text-center">VS</div>
            <div className="text-center text-red">COIN ROUGE</div>
          </div>

          {/* Lignes des matchs */}
          {matches.length === 0 ? (
            <div className="feuille-empty">
              Aucun match à afficher
            </div>
          ) : (
            (() => {
              let matchNumber = 0;
              return matches.map((item, index) => {
                // Si c'est un séparateur
                if ('separator' in item) {
                  return (
                    <div key={`separator-${index}`} className="feuille-separator" />
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
                className={`match-row ${index % 2 === 0 ? "match-row-even" : "match-row-odd"}${draggedIndex === index ? " match-row-dragging" : ""}${dragOverIndex === index && draggedIndex !== index ? " match-row-drag-over" : ""}`}
                draggable
                onDragStart={() => handleDragStart(index)}
                onDragOver={(e) => handleDragOver(e, index)}
                onDragEnd={handleDragEnd}
                onDrop={(e) => handleDrop(e, index)}
                style={{ borderLeftColor: matchColor }}
              >
                {/* Numéro */}
                <div className="match-row-number">
                  {currentMatchNumber}
                </div>

                {/* Badge type */}
                <div className="match-row-type">
                  <span title={matchLabelFull} className="match-type-badge" style={{
                    backgroundColor: `${matchColor}20`,
                    color: matchColor,
                    borderColor: `${matchColor}40`,
                  }}>
                    {matchLabel}
                  </span>
                </div>

                {/* Catégorie / Sexe */}
                <div className="match-row-category">
                  {match.categoriePoids} {match.sexe === "F" ? "♀" : "♂"}
                  {match.matchType === "BRACKET" && match.bracketRound && ` - ${match.bracketRound}`}
                  {match.matchType === "POOL" && match.poolName && match.poolName !== "MANUEL" && ` - Poule ${match.poolName}`}
                </div>

                {/* Boxeur 1 */}
                <div className="match-row-fighter match-row-fighter-blue">
                  {match.boxeur1 ? (
                    <>
                      {match.boxeur1.nom.toUpperCase()} {match.boxeur1.prenom}
                      <span className={`fighter-tag ${match.boxeur1.typeCompetition === "INTERCLUB" ? "fighter-tag-ic" : "fighter-tag-t"}`}>
                        ({match.boxeur1.typeCompetition === "INTERCLUB" ? "IC" : "T"})
                      </span>
                      <span className="fighter-club" style={match.boxeur1.club.couleur ? { color: match.boxeur1.club.couleur } : undefined}> ({match.boxeur1.club.nom})</span>
                    </>
                  ) : (
                    <span className="fighter-tbd">TBD</span>
                  )}
                </div>

                {/* VS */}
                <div className="match-row-vs">vs</div>

                {/* Boxeur 2 */}
                <div className="match-row-fighter match-row-fighter-red">
                  {match.boxeur2 ? (
                    <>
                      {match.boxeur2.nom.toUpperCase()} {match.boxeur2.prenom}
                      <span className={`fighter-tag ${match.boxeur2.typeCompetition === "INTERCLUB" ? "fighter-tag-ic" : "fighter-tag-t"}`}>
                        ({match.boxeur2.typeCompetition === "INTERCLUB" ? "IC" : "T"})
                      </span>
                      <span className="fighter-club" style={match.boxeur2.club.couleur ? { color: match.boxeur2.club.couleur } : undefined}> ({match.boxeur2.club.nom})</span>
                    </>
                  ) : (
                    <span className="fighter-tbd">TBD</span>
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
          <div className="winners-section">
            <h2>
              🏆 Vainqueurs directs ({winners.length})
            </h2>
            <div>
              {winners.map((entry) => (
                <div
                  key={entry.boxeur.id}
                  className={`winner-row ${entry.source === "interclub" ? "winner-row-ic" : "winner-row-solo"}`}
                >
                  <span className="winner-row-name">{entry.boxeur.nom.toUpperCase()}</span>
                  <span>{entry.boxeur.prenom}</span>
                  <span className="text-muted">—</span>
                  <span className="text-gold">{entry.category}</span>
                  <span>{entry.sexe === "F" ? "♀" : "♂"}</span>
                  <span className="text-muted">—</span>
                  <span className="text-muted">{entry.boxeur.club.nom}</span>
                  {entry.source === "interclub" && (
                    <span className="winner-row-label">Placé en interclub</span>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Footer pour impression */}
        <div className="feuille-footer">
          <p>Document généré le {new Date().toLocaleDateString("fr-FR")} à {new Date().toLocaleTimeString("fr-FR")}</p>
        </div>
      </div>
    </>
  );
}
