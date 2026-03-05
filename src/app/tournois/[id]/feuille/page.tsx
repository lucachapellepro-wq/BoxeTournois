"use client";

import { Suspense, useEffect, useState, useMemo, useCallback, useRef } from "react";
import { useParams, useSearchParams } from "next/navigation";
import { useMatches } from "@/hooks/useMatches";
import Link from "next/link";
import { Match } from "@/types/match";
import { TournoiDetail } from "@/types";
import {
  isDemi, isFinale, isPoule,
  getMatchColor, getMatchLabel, getMatchLabelFull,
  getMatchTypeBadgeClass,
  extractWinners,
} from "@/lib/match-helpers";
import { useTouchDragDrop } from "@/hooks/useTouchDragDrop";

/** Feuille de tournoi imprimable : ordre des combats avec drag & drop, légende couleurs, vainqueurs */
/** Organise les matchs par rounds avec espacement (fonction pure, hors composant) */
function organizeByRounds(matchesToOrganize: Match[], spacing: number, shuffle = false): Match[] {
  const spaceMatches = (matchList: Match[]) => {
    if (matchList.length === 0) return [];

    const shuffled = [...matchList];
    if (shuffle) {
      for (let i = shuffled.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
      }
    }
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
  return (
    <Suspense fallback={<div className="feuille-container"><div className="card"><div className="loading-state"><div className="spinner" /></div></div></div>}>
      <FeuilleTournoiContent />
    </Suspense>
  );
}

function FeuilleTournoiContent() {
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
  const [printDate, setPrintDate] = useState("");

  const handleTouchReorder = useCallback((fromIndex: number, toIndex: number) => {
    setMatches((prev) => {
      const newMatches = [...prev];
      const [draggedMatch] = newMatches.splice(fromIndex, 1);
      newMatches.splice(toIndex, 0, draggedMatch);
      return newMatches;
    });
    setUserReordered(true);
  }, []);
  const touchDrag = useTouchDragDrop(handleTouchReorder);

  // Set print date client-side to avoid hydration mismatch
  useEffect(() => {
    const now = new Date();
    setPrintDate(`${now.toLocaleDateString("fr-FR")} à ${now.toLocaleTimeString("fr-FR")}`);
  }, []);

  // Auto-print quand ouvert avec ?print=true (une seule fois)
  const hasPrinted = useRef(false);
  useEffect(() => {
    if (autoPrint && matches.length > 0 && tournoi && !hasPrinted.current) {
      hasPrinted.current = true;
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
        const data = await res.json().catch(() => null);
        if (data) setTournoi(data);
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

    // Organiser les deux groupes (shuffle = true pour randomiser)
    const organizedReal = organizeByRounds(realMatches, minSpacing, true);
    const organizedTbd = organizeByRounds(tbdMatches, minSpacing, true);

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
  const realMatchCount = useMemo(() => matches.filter(m => !('separator' in m)).length, [matches]);

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
              <label htmlFor="spacing-input">Espacement min :</label>
              <input
                id="spacing-input"
                type="number"
                min="0"
                max="20"
                value={minSpacing}
                onChange={(e) => setMinSpacing(Math.max(0, parseInt(e.target.value) || 0))}
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
              timeZone: "UTC",
            })}
          </p>
          <p className="feuille-title-count">
            {realMatchCount} combat{realMatchCount > 1 ? "s" : ""}
          </p>
        </div>

        {/* Légende des couleurs */}
        <div className="no-print feuille-legend">
          {[
            { dotClass: "feuille-legend-dot-pool", label: "Poule" },
            { dotClass: "feuille-legend-dot-demi", label: "Demi-finale" },
            { dotClass: "feuille-legend-dot-finale", label: "Finale" },
            { dotClass: "feuille-legend-dot-elim", label: "Élimination" },
            { dotClass: "feuille-legend-dot-interclub", label: "Interclub" },
            { dotClass: "feuille-legend-dot-mixte", label: "Interclub mixte" },
            { dotClass: "feuille-legend-dot-manual", label: "Combat ajouté" },
          ].map(({ dotClass, label }) => (
            <div key={label} className="feuille-legend-item">
              <div className={`feuille-legend-dot ${dotClass}`} />
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
                const matchBadgeClass = getMatchTypeBadgeClass(match);

                return (
              <div
                key={match.id}
                ref={(el) => touchDrag.setRowRef(index, el)}
                className={`match-row ${index % 2 === 0 ? "match-row-even" : "match-row-odd"}${draggedIndex === index || touchDrag.touchDragIndex === index ? " match-row-dragging" : ""}${(dragOverIndex === index && draggedIndex !== index) || (touchDrag.touchOverIndex === index && touchDrag.touchDragIndex !== index) ? " match-row-drag-over" : ""}`}
                draggable
                onDragStart={() => handleDragStart(index)}
                onDragOver={(e) => handleDragOver(e, index)}
                onDragEnd={handleDragEnd}
                onDrop={(e) => handleDrop(e, index)}
                onTouchStart={(e) => touchDrag.onTouchStart(index, e)}
                onTouchMove={touchDrag.onTouchMove}
                onTouchEnd={touchDrag.onTouchEnd}
                style={{ borderLeftColor: matchColor }}
              >
                {/* Numéro */}
                <div className="match-row-number" data-label="N°">
                  {currentMatchNumber}
                </div>

                {/* Badge type */}
                <div className="match-row-type" data-label="Type">
                  <span title={matchLabelFull} className={`match-type-badge ${matchBadgeClass}`}>
                    {matchLabel}
                  </span>
                </div>

                {/* Catégorie / Sexe */}
                <div className="match-row-category" data-label="Catégorie">
                  {match.categoriePoids} {match.sexe === "F" ? "♀" : "♂"}
                  {match.matchType === "BRACKET" && match.bracketRound && ` - ${match.bracketRound}`}
                  {match.matchType === "POOL" && match.poolName && match.poolName !== "MANUEL" && ` - Poule ${match.poolName}`}
                </div>

                {/* Boxeur 1 */}
                <div className="match-row-fighter match-row-fighter-blue" data-label="Coin bleu">
                  {match.boxeur1 ? (
                    <>
                      {match.boxeur1.nom.toUpperCase()} {match.boxeur1.prenom}
                      <span className={`fighter-tag ${match.boxeur1.typeCompetition === "INTERCLUB" ? "fighter-tag-ic" : "fighter-tag-t"}`}>
                        ({match.boxeur1.typeCompetition === "INTERCLUB" ? "IC" : "T"})
                      </span>
                      <span className={`fighter-club ${match.boxeur1.club.couleur ? "fighter-club-colored" : ""}`} style={match.boxeur1.club.couleur ? { "--club-color": match.boxeur1.club.couleur } as React.CSSProperties : undefined}> ({match.boxeur1.club.nom})</span>
                    </>
                  ) : (
                    <span className="fighter-tbd">TBD</span>
                  )}
                </div>

                {/* VS */}
                <div className="match-row-vs">vs</div>

                {/* Boxeur 2 */}
                <div className="match-row-fighter match-row-fighter-red" data-label="Coin rouge">
                  {match.boxeur2 ? (
                    <>
                      {match.boxeur2.nom.toUpperCase()} {match.boxeur2.prenom}
                      <span className={`fighter-tag ${match.boxeur2.typeCompetition === "INTERCLUB" ? "fighter-tag-ic" : "fighter-tag-t"}`}>
                        ({match.boxeur2.typeCompetition === "INTERCLUB" ? "IC" : "T"})
                      </span>
                      <span className={`fighter-club ${match.boxeur2.club.couleur ? "fighter-club-colored" : ""}`} style={match.boxeur2.club.couleur ? { "--club-color": match.boxeur2.club.couleur } as React.CSSProperties : undefined}> ({match.boxeur2.club.nom})</span>
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
                  <span className="winner-row-identity">
                    <span className="winner-row-name">{entry.boxeur.nom.toUpperCase()}</span>{" "}
                    {entry.boxeur.prenom}
                  </span>
                  <span className="winner-row-details">
                    <span className="text-gold">{entry.category}</span>
                    {" "}{entry.sexe === "F" ? "♀" : "♂"}{" — "}
                    <span className="text-muted">{entry.boxeur.club.nom}</span>
                  </span>
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
          {printDate && <p>Document généré le {printDate}</p>}
        </div>
      </div>
    </>
  );
}
