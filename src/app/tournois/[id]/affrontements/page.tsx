"use client";

import { useEffect, useState, useMemo } from "react";
import { useParams } from "next/navigation";
import { useMatches } from "@/hooks/useMatches";
import { useToast } from "@/hooks/useToast";
import { Toast } from "@/components/Toast";
import { BracketView } from "@/components/BracketView";
import { PoolView } from "@/components/PoolView";
import { BoxeursSeulsView } from "@/components/BoxeursSeulsView";
import { MatchCardEditable } from "@/components/MatchCardEditable";
import Link from "next/link";
import { Boxeur, TournoiDetail } from "@/types";
import { Match } from "@/types/match";
import { sortByWeight } from "@/lib/ui-helpers";
import {
  isInterclub, isMixteOrManuel, isInterclubOrMixte,
  extractWinners, groupMatchesBySexe, groupWinnersBySexe,
  WinnerEntry,
} from "@/lib/match-helpers";

type SexeGroup<T> = { F: [string, T[]][]; M: [string, T[]][] };

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

export default function AffrontementsPage() {
  const params = useParams();
  const tournoiId = parseInt(params.id as string);
  const { matches, loading, stats, fetchMatches, generateMatches, createManualMatch, addOpponentToMatch, deleteMatch } = useMatches(tournoiId);
  const { toast, showToast } = useToast();

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

  useEffect(() => {
    fetchTournoi();
    fetchMatches();
  }, [fetchMatches]);

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

  const closeModal = () => {
    setShowMatchModal(false);
    setMatchBuilder({ boxeur1: null });
    setAddingToMatchId(null);
    setMatchSearch("");
    setMatchPoidsSearch("");
  };

  const handleOpenMatchBuilder = (boxeur?: Boxeur) => {
    setMatchBuilder({ boxeur1: boxeur || null });
    setAddingToMatchId(null);
    setShowMatchModal(true);
    setMatchSearch("");
    setMatchPoidsSearch("");
  };

  const handleDeleteMatch = async (matchId: number) => {
    const success = await deleteMatch(matchId);
    if (success) {
      showToast("Combat supprimé ✓", "success");
    } else {
      showToast("Erreur lors de la suppression", "error");
    }
  };

  const handleAddOpponent = (match: Match) => {
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
          <h1 className="page-title">
            Affrontements — {tournoi?.nom || "Tournoi"}
          </h1>
          <p className="page-subtitle">
            {tournoi && new Date(tournoi.date).toLocaleDateString("fr-FR", {
              weekday: "long",
              year: "numeric",
              month: "long",
              day: "numeric",
            })}
          </p>
        </div>
        <div className="page-header-actions">
          <Link href={`/tournois/${tournoiId}`} className="btn btn-ghost">
            ← Retour
          </Link>
          <Link href={`/tournois/${tournoiId}/categories`} className="btn btn-ghost">
            📊 Catégories
          </Link>
          {matches.length > 0 && (
            <Link href={`/tournois/${tournoiId}/feuille`} className="btn btn-secondary">
              📋 Feuille
            </Link>
          )}
          <button className="btn btn-primary" onClick={() => handleOpenMatchBuilder()}>
            + Combat manuel
          </button>
          {matches.length === 0 ? (
            <button
              className="btn btn-primary"
              onClick={() => handleGenerateMatches(false)}
              disabled={generating}
            >
              {generating && <div className="spinner" style={{ width: 16, height: 16, borderWidth: 2 }} />}
              {generating ? "Génération..." : "Générer le tirage"}
            </button>
          ) : (
            <button className="btn btn-danger" onClick={() => setShowConfirmGenerate(true)}>
              Régénérer
            </button>
          )}
        </div>
      </div>

      {/* Stats */}
      {stats && matches.length > 0 && (
        <div className="stats-row section-gap">
          <div className="stat-card">
            <div className="stat-value" style={{ color: "var(--accent)" }}>{stats.total}</div>
            <div className="stat-label">Matchs total</div>
          </div>
          <div className="stat-card">
            <div className="stat-value" style={{ color: "var(--gold)" }}>{stats.byType.BRACKET}</div>
            <div className="stat-label">Tableaux</div>
          </div>
          <div className="stat-card">
            <div className="stat-value" style={{ color: "var(--success)" }}>{stats.byType.POOL}</div>
            <div className="stat-label">Poules</div>
          </div>
          <div className="stat-card">
            <div className="stat-value">{stats.categories.length}</div>
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
          <div className="tabs">
            <button
              className={`tab ${activeTab === "BRACKET" ? "tab-active" : ""}`}
              onClick={() => setActiveTab("BRACKET")}
            >
              Élimination directe ({bracketMatches.length})
            </button>
            <button
              className={`tab ${activeTab === "POOL" ? "tab-active" : ""}`}
              onClick={() => setActiveTab("POOL")}
            >
              Poules ({poolMatches.length})
            </button>
            {interclubMatches.length > 0 && (
              <button
                className={`tab ${activeTab === "INTERCLUB" ? "tab-active" : ""}`}
                onClick={() => setActiveTab("INTERCLUB")}
              >
                Interclub ({interclubMatches.length})
              </button>
            )}
            {winners.length > 0 && (
              <button
                className={`tab ${activeTab === "WINNERS" ? "tab-active" : ""}`}
                onClick={() => setActiveTab("WINNERS")}
              >
                Vainqueurs directs ({winners.length})
              </button>
            )}
          </div>

          {/* Brackets */}
          {activeTab === "BRACKET" && (
            bracketMatches.length === 0 ? (
              <div className="card">
                <div className="empty-state">
                  <div className="empty-state-icon">🏆</div>
                  <p>Aucun tableau d&apos;élimination</p>
                </div>
              </div>
            ) : renderSexeSections(bracketsBySexe, (category, categoryMatches) => (
              <BracketView
                key={category}
                matches={categoryMatches}
                category={category}
                onAddOpponent={handleAddOpponent}
              />
            ))
          )}

          {/* Pools */}
          {activeTab === "POOL" && (
            poolMatches.length === 0 ? (
              <div className="card">
                <div className="empty-state">
                  <div className="empty-state-icon">🔄</div>
                  <p>Aucune poule</p>
                </div>
              </div>
            ) : renderSexeSections(poolsBySexe, (category, categoryMatches) => (
              <PoolView
                key={category}
                matches={categoryMatches}
                category={category}
                onAddOpponent={handleAddOpponent}
              />
            ))
          )}

          {/* Winners */}
          {activeTab === "WINNERS" && (
            winners.length === 0 ? (
              <div className="card">
                <div className="empty-state">
                  <div className="empty-state-icon">🏆</div>
                  <p>Aucun vainqueur direct</p>
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
                      <span className="winner-card-status" style={{ color: entry.source === "interclub" ? "var(--tournoi-blue)" : "var(--gold)" }}>
                        {entry.source === "interclub" ? "Interclub" : "Seul en catégorie"}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            ))
          )}

          {/* Interclub */}
          {activeTab === "INTERCLUB" && (
            interclubMatches.length === 0 ? (
              <div className="card">
                <div className="empty-state">
                  <div className="empty-state-icon">🤝</div>
                  <p>Aucune rencontre interclub</p>
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
            ))
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
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2 className="modal-title">
                {matchBuilder.boxeur1
                  ? `Adversaire de ${matchBuilder.boxeur1.nom.toUpperCase()} ${matchBuilder.boxeur1.prenom}`
                  : "Sélectionner le 1er boxeur"}
              </h2>
              <button className="modal-close" onClick={closeModal}>×</button>
            </div>

            <div className="filter-group">
              <input
                type="text"
                placeholder="Rechercher par nom, prénom ou club..."
                value={matchSearch}
                onChange={(e) => setMatchSearch(e.target.value)}
                autoFocus
                className="filter-input-flex"
              />
              <select
                value={matchPoidsSearch}
                onChange={(e) => setMatchPoidsSearch(e.target.value)}
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
                        <span className="badge badge-club">{b.club.nom}</span>
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
                      {creatingMatch && matchBuilder.boxeur1 && <div className="spinner" style={{ width: 14, height: 14, borderWidth: 2 }} />}
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
          <div className="modal modal-sm" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2 className="modal-title">Régénérer les matchs ?</h2>
              <button className="modal-close" onClick={() => setShowConfirmGenerate(false)}>×</button>
            </div>
            <p className="modal-description">
              Cela supprimera tous les matchs existants et tous les résultats enregistrés. Cette action est irréversible.
            </p>
            <div className="modal-actions">
              <button className="btn btn-ghost" onClick={() => setShowConfirmGenerate(false)} disabled={generating}>
                Annuler
              </button>
              <button className="btn btn-danger" onClick={() => handleGenerateMatches(true)} disabled={generating}>
                {generating && <div className="spinner" style={{ width: 16, height: 16, borderWidth: 2 }} />}
                {generating ? "Régénération..." : "Régénérer"}
              </button>
            </div>
          </div>
        </div>
      )}

      {toast.visible && <Toast message={toast.message} type={toast.type} />}
    </>
  );
}
