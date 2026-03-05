"use client";

import { useEffect, useState, useMemo, useCallback } from "react";
import { useParams } from "next/navigation";
import { useMatches } from "@/hooks/useMatches";
import { useGlobalToast } from "@/contexts/ToastContext";
import { useBottomSheetDrag } from "@/hooks/useBottomSheetDrag";
import { useBodyScrollLock } from "@/hooks/useBodyScrollLock";
import { useEscapeKey } from "@/hooks/useEscapeKey";
import dynamic from "next/dynamic";

const BracketView = dynamic(() => import("@/components/BracketView").then(m => ({ default: m.BracketView })));
const PoolView = dynamic(() => import("@/components/PoolView").then(m => ({ default: m.PoolView })));
const BoxeursSeulsView = dynamic(() => import("@/components/BoxeursSeulsView").then(m => ({ default: m.BoxeursSeulsView })));
const MatchCardEditable = dynamic(() => import("@/components/MatchCardEditable").then(m => ({ default: m.MatchCardEditable })));
import Link from "next/link";
import { Boxeur, TournoiDetail } from "@/types";
import { Match } from "@/types/match";
import { sortByWeight, clubColorStyle } from "@/lib/ui-helpers";
import {
  isInterclub, isMixteOrManuel, isInterclubOrMixte,
  extractWinners, groupMatchesBySexe, groupWinnersBySexe,
  WinnerEntry,
} from "@/lib/match-helpers";

/** Groupement par sexe pour l'affichage F/M */
type SexeGroup<T> = { F: [string, T[]][]; M: [string, T[]][] };

/** Rendu générique des sections Femmes/Hommes avec séparation visuelle */
function renderSexeSections<T>(
  data: SexeGroup<T>,
  renderContent: (category: string, items: T[]) => React.ReactNode
) {
  return (
    <>
      {data.F.length > 0 && (
        <div className="section-gap">
          <h2 className="section-header section-header-femmes">FEMMES</h2>
          {data.F.map(([cat, items]) => renderContent(cat, items))}
        </div>
      )}
      {data.M.length > 0 && (
        <div className="section-gap-lg">
          <h2 className="section-header section-header-hommes">HOMMES</h2>
          {data.M.map(([cat, items]) => renderContent(cat, items))}
        </div>
      )}
    </>
  );
}

/** Page affrontements : génération des matchs, vue bracket/poule/interclub, vainqueurs directs, impression */
export default function AffrontementsPage() {
  const params = useParams();
  const tournoiId = Number(params.id) || 0;
  const { matches, loading, stats, fetchMatches, generateMatches, createManualMatch, addOpponentToMatch, deleteMatch } = useMatches(tournoiId);
  const { showToast } = useGlobalToast();

  const [tournoi, setTournoi] = useState<TournoiDetail | null>(null);
  const [activeTab, setActiveTab] = useState<"BRACKET" | "POOL" | "INTERCLUB" | "WINNERS">("BRACKET");
  const [showConfirmGenerate, setShowConfirmGenerate] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [matchBuilder, setMatchBuilder] = useState<{ boxeur1: Boxeur | null }>({ boxeur1: null });
  const [showMatchModal, setShowMatchModal] = useState(false);
  const [matchSearch, setMatchSearch] = useState("");
  const [matchPoidsSearch, setMatchPoidsSearch] = useState("");
  const [addingToMatchId, setAddingToMatchId] = useState<number | null>(null);
  const [creatingMatch, setCreatingMatch] = useState(false);

  const closeModal = useCallback(() => {
    setShowMatchModal(false);
    setMatchBuilder({ boxeur1: null });
    setAddingToMatchId(null);
    setMatchSearch("");
    setMatchPoidsSearch("");
  }, []);
  const matchModalDrag = useBottomSheetDrag(closeModal);
  const confirmModalDrag = useBottomSheetDrag(() => setShowConfirmGenerate(false));
  useBodyScrollLock(showMatchModal || showConfirmGenerate);
  useEscapeKey(showMatchModal, closeModal);
  useEscapeKey(showConfirmGenerate, () => setShowConfirmGenerate(false));

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

  const handleGenerateMatches = async (regenerate: boolean = false) => {
    setGenerating(true);
    try {
      const success = await generateMatches(regenerate);
      if (success) {
        showToast(regenerate ? "Matchs régénérés ✓" : "Matchs générés ✓", "success");
        setShowConfirmGenerate(false);
      } else {
        showToast("Erreur lors de la génération", "error");
      }
    } catch {
      showToast("Erreur réseau", "error");
    } finally {
      setGenerating(false);
    }
  };


  const handleOpenMatchBuilder = (boxeur?: Boxeur) => {
    setMatchBuilder({ boxeur1: boxeur || null });
    setAddingToMatchId(null);
    setShowMatchModal(true);
    setMatchSearch("");
    setMatchPoidsSearch("");
  };

  const handleDeleteMatch = async (matchId: number) => {
    const match = matches.find((m) => m.id === matchId);
    const success = await deleteMatch(matchId);
    if (success) {
      showToast("Combat supprimé ✓", "success", {
        action: {
          label: "Annuler",
          onClick: async () => {
            if (match?.boxeur1Id && match?.boxeur2Id) {
              const restored = await createManualMatch(match.boxeur1Id, match.boxeur2Id);
              if (restored) {
                showToast("Combat recréé en manuel", "success");
              } else {
                showToast("Erreur restauration", "error");
              }
            }
          },
        },
      });
    } else {
      showToast("Erreur lors de la suppression", "error");
    }
  };

  const handleAddOpponent = (match: Match) => {
    if (!match.boxeur1) return; // TBD match — no boxeur1 to pair with
    setAddingToMatchId(match.id);
    setMatchBuilder({ boxeur1: match.boxeur1 });
    setShowMatchModal(true);
    setMatchSearch("");
    setMatchPoidsSearch("");
  };

  const handleSelectBoxeur = async (boxeur: Boxeur) => {
    if (!matchBuilder.boxeur1 && !addingToMatchId) {
      setMatchBuilder({ boxeur1: boxeur });
      setMatchSearch("");
      setMatchPoidsSearch("");
      return;
    }

    setCreatingMatch(true);
    try {
      if (addingToMatchId) {
        const success = await addOpponentToMatch(addingToMatchId, boxeur.id);
        if (success) {
          showToast("Adversaire ajouté ✓", "success");
          closeModal();
        } else {
          showToast("Erreur lors de l'ajout", "error");
        }
      } else {
        const success = await createManualMatch(matchBuilder.boxeur1!.id, boxeur.id);
        if (success) {
          showToast("Combat ajouté ✓", "success");
          closeModal();
        } else {
          showToast("Erreur lors de la création", "error");
        }
      }
    } catch {
      showToast("Erreur réseau", "error");
    } finally {
      setCreatingMatch(false);
    }
  };

  // Filtrer les matchs par type
  const bracketMatches = useMemo(
    () => matches.filter((m) => m.matchType === "BRACKET" && !isInterclub(m) && !isMixteOrManuel(m)),
    [matches]
  );
  const poolMatches = useMemo(
    () => matches.filter((m) => m.matchType === "POOL" && !isInterclub(m) && !isMixteOrManuel(m)),
    [matches]
  );
  const interclubMatches = useMemo(
    () => matches.filter((m) => isInterclubOrMixte(m)),
    [matches]
  );

  const winners = useMemo(() => extractWinners(matches), [matches]);
  const winnersBySexe = useMemo(() => groupWinnersBySexe(winners), [winners]);
  const bracketsBySexe = useMemo(() => groupMatchesBySexe(bracketMatches), [bracketMatches]);
  const poolsBySexe = useMemo(() => groupMatchesBySexe(poolMatches), [poolMatches]);
  const interclubBySexe = useMemo(() => groupMatchesBySexe(interclubMatches), [interclubMatches]);

  const boxeursSeuls = useMemo(() => {
    if (!tournoi) return [];
    const boxeursWithMatchIds = new Set<number>();
    matches.forEach((m) => {
      if (m.boxeur1Id) boxeursWithMatchIds.add(m.boxeur1Id);
      if (m.boxeur2Id) boxeursWithMatchIds.add(m.boxeur2Id);
    });
    return tournoi.boxeurs
      .map((tb) => tb.boxeur)
      .filter((b) => !boxeursWithMatchIds.has(b.id));
  }, [tournoi, matches]);

  if (!tournoi || (loading && matches.length === 0)) {
    return (
      <div className="card">
        <div className="loading-state"><div className="spinner" /></div>
      </div>
    );
  }

  return (
    <>
      {/* Header */}
      <div className="page-header">
        <div>
          <Link href={`/tournois/${tournoiId}`} className="btn btn-ghost btn-sm section-back-btn">
            ← Retour au tournoi
          </Link>
          <h1 className="page-title">
            Affrontements — {tournoi?.nom || "Tournoi"}
          </h1>
          <p className="page-subtitle">
            {tournoi && new Date(tournoi.date).toLocaleDateString("fr-FR", {
              weekday: "long",
              year: "numeric",
              month: "long",
              day: "numeric",
              timeZone: "UTC",
            })}
          </p>
        </div>
      </div>

      {/* Toolbar actions */}
      <div className="affrontements-toolbar">
        <div className="toolbar-primary">
          <button className="btn btn-primary" onClick={() => handleOpenMatchBuilder()}>
            + Combat manuel
          </button>
          {matches.length === 0 ? (
            <button
              className="btn btn-primary"
              onClick={() => handleGenerateMatches(false)}
              disabled={generating}
            >
              {generating && <div className="spinner spinner-sm" />}
              {generating ? "Génération..." : "Générer le tirage"}
            </button>
          ) : (
            <button className="btn btn-danger" onClick={() => setShowConfirmGenerate(true)}>
              Régénérer le tirage
            </button>
          )}
        </div>
        <div className="toolbar-secondary">
          <Link href={`/tournois/${tournoiId}/categories`} className="btn btn-ghost">
            📊 Catégories
          </Link>
          {matches.length > 0 && (
            <>
              <Link href={`/tournois/${tournoiId}/feuille`} className="btn btn-secondary">
                📋 Feuille
              </Link>
              <button className="btn btn-ghost" onClick={() => window.print()}>
                🖨️ Imprimer
              </button>
              <Link
                href={`/tournois/${tournoiId}/feuille?print=true`}
                className="btn btn-ghost"
                target="_blank"
                rel="noopener noreferrer"
              >
                📄 PDF
              </Link>
            </>
          )}
        </div>
      </div>

      {/* Stats */}
      {stats && matches.length > 0 && (
        <div className="stats-row section-gap">
          <div className="stat-card">
            <div className="stat-value stat-value-accent">{stats.total}</div>
            <div className="stat-label">Matchs total</div>
          </div>
          <div className="stat-card">
            <div className="stat-value stat-value-gold">{stats.byType.BRACKET}</div>
            <div className="stat-label">Tableaux</div>
          </div>
          <div className="stat-card">
            <div className="stat-value stat-value-success">{stats.byType.POOL}</div>
            <div className="stat-label">Poules</div>
          </div>
          <div className="stat-card">
            <div className="stat-value">{stats?.categories?.length ?? 0}</div>
            <div className="stat-label">Catégories</div>
          </div>
        </div>
      )}

      {/* Empty state */}
      {matches.length === 0 && (
        <div className="card section-gap">
          <div className="empty-state">
            <div className="empty-state-icon">🥊</div>
            <p>Aucun match généré pour le moment</p>
            <p className="empty-hint">
              Cliquez sur &quot;Générer le tirage&quot; pour créer les affrontements
            </p>
          </div>
        </div>
      )}

      {/* Tabs */}
      {matches.length > 0 && (
        <div className="section-gap-lg">
          <div className="tabs" role="tablist">
            <button
              id="tab-bracket"
              className={`tab ${activeTab === "BRACKET" ? "tab-active" : ""}`}
              onClick={() => setActiveTab("BRACKET")}
              role="tab"
              aria-selected={activeTab === "BRACKET"}
              aria-controls="tabpanel-bracket"
              aria-label="Voir les tableaux d'élimination directe"
            >
              Élimination directe ({bracketMatches.length})
            </button>
            <button
              id="tab-pool"
              className={`tab ${activeTab === "POOL" ? "tab-active" : ""}`}
              onClick={() => setActiveTab("POOL")}
              role="tab"
              aria-selected={activeTab === "POOL"}
              aria-controls="tabpanel-pool"
              aria-label="Voir les matchs en poules"
            >
              Poules ({poolMatches.length})
            </button>
            {interclubMatches.length > 0 && (
              <button
                id="tab-interclub"
                className={`tab ${activeTab === "INTERCLUB" ? "tab-active" : ""}`}
                onClick={() => setActiveTab("INTERCLUB")}
                role="tab"
                aria-selected={activeTab === "INTERCLUB"}
                aria-controls="tabpanel-interclub"
                aria-label="Voir les rencontres interclub"
              >
                Interclub ({interclubMatches.length})
              </button>
            )}
            {winners.length > 0 && (
              <button
                id="tab-winners"
                className={`tab ${activeTab === "WINNERS" ? "tab-active" : ""}`}
                onClick={() => setActiveTab("WINNERS")}
                role="tab"
                aria-selected={activeTab === "WINNERS"}
                aria-controls="tabpanel-winners"
                aria-label="Voir les vainqueurs directs"
              >
                Vainqueurs directs ({winners.length})
              </button>
            )}
          </div>

          {/* Brackets */}
          {activeTab === "BRACKET" && (
            <div id="tabpanel-bracket" role="tabpanel" aria-labelledby="tab-bracket">
              {bracketMatches.length === 0 ? (
                <div className="card">
                  <div className="empty-state">
                    <div className="empty-state-icon">🏆</div>
                    <p>Aucun tableau d&apos;élimination</p>
                    <p className="empty-hint">Générez le tirage pour créer les tableaux automatiquement</p>
                  </div>
                </div>
              ) : renderSexeSections(bracketsBySexe, (category, categoryMatches) => (
                <BracketView
                  key={category}
                  matches={categoryMatches}
                  category={category}
                  onAddOpponent={handleAddOpponent}
                />
              ))}
            </div>
          )}

          {/* Pools */}
          {activeTab === "POOL" && (
            <div id="tabpanel-pool" role="tabpanel" aria-labelledby="tab-pool">
              {poolMatches.length === 0 ? (
                <div className="card">
                  <div className="empty-state">
                    <div className="empty-state-icon">🔄</div>
                    <p>Aucune poule</p>
                    <p className="empty-hint">Les poules sont créées quand 3+ tireurs sont dans la même catégorie</p>
                  </div>
                </div>
              ) : renderSexeSections(poolsBySexe, (category, categoryMatches) => (
                <PoolView
                  key={category}
                  matches={categoryMatches}
                  category={category}
                  onAddOpponent={handleAddOpponent}
                />
              ))}
            </div>
          )}

          {/* Winners */}
          {activeTab === "WINNERS" && (
            <div id="tabpanel-winners" role="tabpanel" aria-labelledby="tab-winners">
              {winners.length === 0 ? (
                <div className="card">
                  <div className="empty-state">
                    <div className="empty-state-icon">🏆</div>
                    <p>Aucun vainqueur direct</p>
                    <p className="empty-hint">Les tireurs seuls dans leur catégorie apparaîtront ici</p>
                  </div>
                </div>
              ) : renderSexeSections(winnersBySexe, (category, entries: WinnerEntry[]) => (
                <div key={category} className="section-gap">
                  <h3 className="pool-category">{category}</h3>
                  <div className="winners-list">
                    {entries.map((entry) => (
                      <div key={entry.boxeur.id} className={`card winner-card ${entry.source === "interclub" ? "winner-card-interclub" : "winner-card-solo"}`}>
                        <span className="winner-card-icon">🏆</span>
                        <div className="winner-card-info">
                          <div className="winner-card-name">
                            {entry.boxeur.nom.toUpperCase()} {entry.boxeur.prenom}
                            <span className={`badge ${entry.boxeur.typeCompetition === "INTERCLUB" ? "badge-interclub" : "badge-tournoi"}`}>
                              {entry.boxeur.typeCompetition === "INTERCLUB" ? "IC" : "T"}
                            </span>
                          </div>
                          <div className="winner-card-details">
                            {entry.boxeur.club.nom} — {entry.boxeur.poids}kg — {entry.boxeur.categoriePoids}
                          </div>
                        </div>
                        <span className={`winner-card-status ${entry.source === "interclub" ? "winner-card-status-interclub" : "winner-card-status-solo"}`}>
                          {entry.source === "interclub" ? "Interclub" : "Seul en catégorie"}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Interclub */}
          {activeTab === "INTERCLUB" && (
            <div id="tabpanel-interclub" role="tabpanel" aria-labelledby="tab-interclub">
              {interclubMatches.length === 0 ? (
                <div className="card">
                  <div className="empty-state">
                    <div className="empty-state-icon">🤝</div>
                    <p>Aucune rencontre interclub</p>
                    <p className="empty-hint">Les combats interclub sont générés pour les tireurs de type IC</p>
                  </div>
                </div>
              ) : renderSexeSections(interclubBySexe, (category, categoryMatches) => (
                <div key={category} className="pool-view">
                  <h3 className="pool-category">{category}</h3>
                  <div className="pool-grid">
                    <div className="pool-card">
                      <h4 className="pool-title">
                        Rencontres interclub
                        <span className="pool-count">
                          ({categoryMatches.length} combat{categoryMatches.length > 1 ? "s" : ""})
                        </span>
                      </h4>
                      <div className="pool-matches">
                        {categoryMatches.map((match) => (
                          <MatchCardEditable
                            key={match.id}
                            match={match}
                            onAddOpponent={handleAddOpponent}
                            onDelete={match.poolName === "MANUEL" ? handleDeleteMatch : undefined}
                          />
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Print-only: all sections visible */}
      {matches.length > 0 && (
        <div className="print-only">
          <div className="print-section">
            <h2 className="section-header">Élimination directe ({bracketMatches.length})</h2>
            {renderSexeSections(bracketsBySexe, (category, categoryMatches) => (
              <BracketView key={category} matches={categoryMatches} category={category} onAddOpponent={handleAddOpponent} />
            ))}
          </div>
          {poolMatches.length > 0 && (
            <div className="print-section">
              <h2 className="section-header">Poules ({poolMatches.length})</h2>
              {renderSexeSections(poolsBySexe, (category, categoryMatches) => (
                <PoolView key={category} matches={categoryMatches} category={category} onAddOpponent={handleAddOpponent} />
              ))}
            </div>
          )}
          {interclubMatches.length > 0 && (
            <div className="print-section">
              <h2 className="section-header">Interclub ({interclubMatches.length})</h2>
              {renderSexeSections(interclubBySexe, (category, categoryMatches) => (
                <div key={category} className="pool-view">
                  <h3 className="pool-category">{category}</h3>
                  <div className="pool-grid">
                    <div className="pool-card">
                      <div className="pool-matches">
                        {categoryMatches.map((match) => (
                          <MatchCardEditable key={match.id} match={match} onAddOpponent={handleAddOpponent} />
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
          {winners.length > 0 && (
            <div className="print-section">
              <h2 className="section-header">Vainqueurs directs ({winners.length})</h2>
              {renderSexeSections(winnersBySexe, (category, entries: WinnerEntry[]) => (
                <div key={category} className="section-gap">
                  <h3 className="pool-category">{category}</h3>
                  <div className="winners-list">
                    {entries.map((entry) => (
                      <div key={entry.boxeur.id} className={`card winner-card ${entry.source === "interclub" ? "winner-card-interclub" : "winner-card-solo"}`}>
                        <span className="winner-card-icon">🏆</span>
                        <div className="winner-card-info">
                          <div className="winner-card-name">
                            {entry.boxeur.nom.toUpperCase()} {entry.boxeur.prenom}
                          </div>
                          <div className="winner-card-details">
                            {entry.boxeur.club.nom} — {entry.boxeur.poids}kg — {entry.boxeur.categoriePoids}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Boxeurs sans adversaire */}
      {boxeursSeuls.length > 0 && (
        <BoxeursSeulsView boxeurs={boxeursSeuls} onAddMatch={handleOpenMatchBuilder} />
      )}

      {/* Modal sélection adversaire */}
      {showMatchModal && (
        <div className="modal-overlay" onClick={closeModal}>
          <div
            className="modal"
            ref={matchModalDrag.modalRef}
            role="dialog"
            aria-modal="true"
            aria-labelledby="modal-match-title"
            onClick={(e) => e.stopPropagation()}
            onTouchStart={matchModalDrag.onTouchStart}
            onTouchMove={matchModalDrag.onTouchMove}
            onTouchEnd={matchModalDrag.onTouchEnd}
          >
            <div className="modal-handle" />
            <div className="modal-header">
              <h2 id="modal-match-title" className="modal-title">
                {matchBuilder.boxeur1
                  ? `Adversaire de ${matchBuilder.boxeur1.nom.toUpperCase()} ${matchBuilder.boxeur1.prenom}`
                  : "Sélectionner le 1er boxeur"}
              </h2>
              <button className="modal-close" onClick={closeModal} aria-label="Fermer">✕</button>
            </div>

            <div className="filter-group">
              <input
                type="text"
                placeholder="Rechercher par nom, prénom ou club..."
                value={matchSearch}
                onChange={(e) => setMatchSearch(e.target.value)}
                aria-label="Rechercher un boxeur"
                autoFocus
                className="filter-input-flex"
              />
              <select
                value={matchPoidsSearch}
                onChange={(e) => setMatchPoidsSearch(e.target.value)}
                aria-label="Filtrer par catégorie de poids"
                className="filter-select-auto"
              >
                <option value="">Toutes catégories</option>
                {[...new Set(tournoi?.boxeurs.map((tb) => tb.boxeur.categoriePoids) ?? [])].sort(sortByWeight).map((cat) => (
                  <option key={cat} value={cat}>{cat}</option>
                ))}
              </select>
            </div>

            <div className="modal-body">
              {tournoi?.boxeurs
                .map((tb) => tb.boxeur)
                .filter((b) => {
                  if (matchBuilder.boxeur1 && b.id === matchBuilder.boxeur1.id) return false;
                  if (matchPoidsSearch && b.categoriePoids !== matchPoidsSearch) return false;
                  if (!matchSearch) return true;
                  const s = matchSearch.toLowerCase();
                  return b.nom.toLowerCase().includes(s) || b.prenom.toLowerCase().includes(s) || b.club.nom.toLowerCase().includes(s);
                })
                .map((b) => (
                  <div key={b.id} className="boxeur-row">
                    <div className="boxeur-row-info">
                      <div className="boxeur-row-name">
                        {b.nom.toUpperCase()} {b.prenom}
                      </div>
                      <div className="club-participant-badges">
                        <span className="badge badge-club" style={clubColorStyle(b.club.couleur)}>{b.club.nom}</span>
                        <span className={`badge ${b.typeCompetition === "INTERCLUB" ? "badge-interclub" : "badge-tournoi"}`}>
                          {b.typeCompetition === "INTERCLUB" ? "IC" : "T"}
                        </span>
                        <span className="badge badge-poids">{b.categoriePoids}</span>
                        <span className="badge badge-sexe">{b.sexe === "M" ? "H" : "F"}</span>
                      </div>
                    </div>
                    <button
                      className="btn btn-primary btn-sm"
                      onClick={() => handleSelectBoxeur(b)}
                      disabled={creatingMatch}
                    >
                      {creatingMatch && matchBuilder.boxeur1 && <div className="spinner spinner-xs" />}
                      {matchBuilder.boxeur1 ? "Sélectionner" : "Choisir"}
                    </button>
                  </div>
                ))}
            </div>
          </div>
        </div>
      )}

      {/* Modal confirmation régénération */}
      {showConfirmGenerate && (
        <div className="modal-overlay" onClick={() => setShowConfirmGenerate(false)}>
          <div
            className="modal modal-sm"
            ref={confirmModalDrag.modalRef}
            role="dialog"
            aria-modal="true"
            aria-labelledby="modal-regen-title"
            onClick={(e) => e.stopPropagation()}
            onTouchStart={confirmModalDrag.onTouchStart}
            onTouchMove={confirmModalDrag.onTouchMove}
            onTouchEnd={confirmModalDrag.onTouchEnd}
          >
            <div className="modal-handle" />
            <div className="modal-header">
              <h2 id="modal-regen-title" className="modal-title">Régénérer les matchs ?</h2>
              <button className="modal-close" onClick={() => setShowConfirmGenerate(false)} aria-label="Fermer">✕</button>
            </div>
            <p className="modal-description">
              Cela supprimera tous les matchs existants et tous les résultats enregistrés. Cette action est irréversible.
            </p>
            <div className="modal-actions">
              <button className="btn btn-ghost" onClick={() => setShowConfirmGenerate(false)} disabled={generating}>
                Annuler
              </button>
              <button className="btn btn-danger" onClick={() => handleGenerateMatches(true)} disabled={generating}>
                {generating && <div className="spinner spinner-sm" />}
                {generating ? "Régénération..." : "Régénérer"}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
