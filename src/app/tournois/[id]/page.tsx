"use client";

import { useEffect, useState, useCallback, useMemo } from "react";
import { useParams, useRouter } from "next/navigation";
import { useBoxeurs } from "@/hooks/useBoxeurs";
import { useGlobalToast } from "@/contexts/ToastContext";
import { Boxeur, TournoiDetail } from "@/types";
import { formatDate, clubColorStyle } from "@/lib/ui-helpers";
import { getGantColor, getGantLabel } from "@/lib/categories";
import { useBottomSheetDrag } from "@/hooks/useBottomSheetDrag";
import { useBodyScrollLock } from "@/hooks/useBodyScrollLock";
import { useEscapeKey } from "@/hooks/useEscapeKey";
import { ConfirmModal } from "@/components/ConfirmModal";
import Link from "next/link";

/** Page détail d'un tournoi : participants par club, ajout/retrait de boxeurs, navigation vers affrontements */
export default function TournoiDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { boxeurs: allBoxeurs, fetchBoxeurs } = useBoxeurs();
  const { showToast } = useGlobalToast();

  const [tournoi, setTournoi] = useState<TournoiDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [batchAdding, setBatchAdding] = useState(false);
  const [removeTarget, setRemoveTarget] = useState<{ id: number; nom: string } | null>(null);
  const addModalDrag = useBottomSheetDrag(() => setShowAddModal(false));
  useBodyScrollLock(showAddModal);
  useEscapeKey(showAddModal, () => setShowAddModal(false));

  const fetchTournoi = useCallback(async () => {
    try {
      const res = await fetch(`/api/tournois/${params.id}`);
      if (res.ok) {
        const data = await res.json().catch(() => null);
        if (data) setTournoi(data);
      }
    } catch (error) {
      console.error("Erreur fetch tournoi:", error);
    } finally {
      setLoading(false);
    }
  }, [params.id]);

  useEffect(() => {
    fetchTournoi();
  }, [fetchTournoi]);

  const handleAddBoxeur = async (boxeurId: number) => {
    try {
      const res = await fetch(`/api/tournois/${params.id}/boxeurs`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ boxeurId }),
      });

      if (res.ok) {
        showToast("Boxeur ajouté au tournoi ✓", "success");
        fetchTournoi();
      } else {
        showToast("Erreur lors de l'ajout", "error");
      }
    } catch {
      showToast("Erreur réseau", "error");
    }
  };

  const handleRemoveBoxeur = (boxeurId: number, nom: string) => {
    setRemoveTarget({ id: boxeurId, nom });
  };

  const confirmRemove = async () => {
    if (!removeTarget) return;
    try {
      const res = await fetch(`/api/tournois/${params.id}/boxeurs/${removeTarget.id}`, {
        method: "DELETE",
      });

      if (res.ok) {
        showToast("Boxeur retiré du tournoi", "success");
        fetchTournoi();
      } else {
        showToast("Erreur lors du retrait", "error");
      }
    } catch {
      showToast("Erreur réseau", "error");
    }
    setRemoveTarget(null);
  };

  const handleToggleType = async (boxeur: Boxeur) => {
    const newType = boxeur.typeCompetition === "TOURNOI" ? "INTERCLUB" : "TOURNOI";
    try {
      const res = await fetch(`/api/boxeurs/${boxeur.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ typeCompetition: newType }),
      });
      if (res.ok) {
        showToast(`Type changé → ${newType}`, "success");
        fetchTournoi();
      } else {
        showToast("Erreur lors du changement de type", "error");
      }
    } catch {
      showToast("Erreur réseau", "error");
    }
  };

  const enrolledBoxeursIds = useMemo(
    () => new Set(tournoi?.boxeurs.map((tb) => tb.boxeur.id) || []),
    [tournoi]
  );

  const availableBoxeurs = useMemo(
    () => allBoxeurs.filter((b) => !enrolledBoxeursIds.has(b.id)),
    [allBoxeurs, enrolledBoxeursIds]
  );

  const filteredBoxeurs = useMemo(() => {
    const searchLower = searchTerm.toLowerCase();
    return availableBoxeurs.filter((b) =>
      b.nom.toLowerCase().includes(searchLower) ||
      b.prenom.toLowerCase().includes(searchLower) ||
      b.club.nom.toLowerCase().includes(searchLower)
    );
  }, [availableBoxeurs, searchTerm]);

  const boxeursByClub = useMemo(
    () => tournoi?.boxeurs.reduce((acc, tb) => {
      const clubNom = tb.boxeur.club.nom;
      if (!acc[clubNom]) acc[clubNom] = [];
      acc[clubNom].push(tb.boxeur);
      return acc;
    }, {} as Record<string, Boxeur[]>),
    [tournoi]
  );

  if (loading) {
    return (
      <div className="card">
        <div className="loading-state"><div className="spinner" /></div>
      </div>
    );
  }

  if (!tournoi) {
    return (
      <div className="card">
        <div className="empty-state">
          <div className="empty-state-icon">❌</div>
          <p>Tournoi non trouvé</p>
          <button className="btn btn-primary" onClick={() => router.push("/")}>
            ← Retour
          </button>
        </div>
      </div>
    );
  }

  const clubEntries = Object.entries(boxeursByClub || {}).sort(
    ([, a], [, b]) => b.length - a.length
  );

  return (
    <>
      <div className="page-header">
        <div>
          <button
            className="btn btn-ghost btn-sm section-back-btn"
            onClick={() => router.push("/")}
          >
            ← Retour aux tournois
          </button>
          <h1 className="page-title">{tournoi.nom}</h1>
          <p className="page-subtitle">{formatDate(tournoi.date)}</p>
        </div>
        <div className="page-header-actions">
          <Link href={`/tournois/${params.id}/categories`} className="btn btn-secondary">
            📊 Catégories
          </Link>
          <Link href={`/tournois/${params.id}/affrontements`} className="btn btn-primary">
            🥊 Affrontements
          </Link>
          <button className="btn btn-ghost" onClick={() => { fetchBoxeurs(); setShowAddModal(true); }}>
            + Ajouter des boxeurs
          </button>
        </div>
      </div>

      {/* Stats dashboard */}
      <div className="stats-row section-gap">
        <div className="stat-card">
          <div className="stat-value stat-value-gold">
            {tournoi.boxeurs.length}
          </div>
          <div className="stat-label">Tireurs inscrits</div>
        </div>
        <div className="stat-card">
          <div className="stat-value stat-value-green">
            {Object.keys(boxeursByClub || {}).length}
          </div>
          <div className="stat-label">Clubs</div>
        </div>
        <div className="stat-card">
          <div className="stat-value stat-value-accent">
            {tournoi.boxeurs.filter(tb => tb.boxeur.sexe === "F").length}
          </div>
          <div className="stat-label">Femmes</div>
        </div>
        <div className="stat-card">
          <div className="stat-value stat-value-blue">
            {tournoi.boxeurs.filter(tb => tb.boxeur.sexe === "M").length}
          </div>
          <div className="stat-label">Hommes</div>
        </div>
        <div className="stat-card">
          <div className="stat-value stat-value-blue">
            {tournoi.boxeurs.filter(tb => tb.boxeur.typeCompetition === "TOURNOI").length}
          </div>
          <div className="stat-label">Tournoi</div>
        </div>
        <div className="stat-card">
          <div className="stat-value stat-value-green">
            {tournoi.boxeurs.filter(tb => tb.boxeur.typeCompetition === "INTERCLUB").length}
          </div>
          <div className="stat-label">Interclub</div>
        </div>
      </div>

      {/* Participants par club */}
      {tournoi.boxeurs.length === 0 ? (
        <div className="card section-gap-lg">
          <div className="empty-state">
            <div className="empty-state-icon">👥</div>
            <p>Aucun boxeur inscrit pour le moment</p>
            <p className="empty-hint">Ajoutez des boxeurs pour commencer à organiser votre tournoi</p>
            <button className="btn btn-primary" onClick={() => { fetchBoxeurs(); setShowAddModal(true); }}>
              + Ajouter des boxeurs
            </button>
          </div>
        </div>
      ) : (
        <div className="section-gap-lg">
          <h2 className="section-header">
            Participants par club ({clubEntries.length} clubs)
          </h2>
          <div className="club-cards-grid">
            {clubEntries.map(([clubNom, boxeurs]) => (
              <div key={clubNom} className={`card club-participant-card ${boxeurs[0]?.club.couleur ? "club-participant-card-colored" : ""}`} style={boxeurs[0]?.club.couleur ? { "--club-color": boxeurs[0].club.couleur } as React.CSSProperties : undefined}>
                <div className="club-participant-header">
                  <h3 className={`club-participant-name ${boxeurs[0]?.club.couleur ? "club-participant-name-colored" : ""}`}>{clubNom}</h3>
                  <span className="badge badge-count">{boxeurs.length}</span>
                </div>
                <div className="club-participant-list">
                  {boxeurs.map((b) => (
                    <div key={b.id} className="club-participant-row">
                      <div className="club-participant-info">
                        <span className="club-participant-fighter-name">
                          {b.nom.toUpperCase()} {b.prenom}
                        </span>
                        <div className="club-participant-badges">
                          <span className="badge badge-sexe">{b.sexe === "M" ? "H" : "F"}</span>
                          <span className="badge badge-poids">{b.poids}kg</span>
                          <span
                            className={`badge ${b.typeCompetition === "INTERCLUB" ? "badge-interclub" : "badge-tournoi"}`}
                            role="button"
                            tabIndex={0}
                            aria-label="Changer le type de compétition"
                            onClick={() => handleToggleType(b)}
                            onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); handleToggleType(b); } }}
                            title="Cliquer pour changer"
                          >
                            {b.typeCompetition === "INTERCLUB" ? "IC" : "T"}
                          </span>
                          <span
                            className="badge-gant badge-gant-sm"
                            style={{
                              borderColor: getGantColor(b.gant),
                              backgroundColor: `${getGantColor(b.gant)}15`,
                              color: getGantColor(b.gant),
                            }}
                          >
                            <span
                              className="gant-dot gant-dot-sm"
                              style={{ backgroundColor: getGantColor(b.gant) }}
                            ></span>
                            {getGantLabel(b.gant)}
                          </span>
                        </div>
                      </div>
                      <button
                        className="btn-icon btn-danger btn-icon-sm"
                        onClick={() => handleRemoveBoxeur(b.id, `${b.nom} ${b.prenom}`)}
                        title="Retirer"
                        aria-label={`Retirer ${b.nom} ${b.prenom} du tournoi`}
                      >
                        ✕
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      <ConfirmModal
        show={removeTarget !== null}
        title="Retirer du tournoi"
        message={`Retirer ${removeTarget?.nom} du tournoi ?`}
        confirmLabel="Retirer"
        onConfirm={confirmRemove}
        onCancel={() => setRemoveTarget(null)}
      />

      {/* Modal d'ajout de boxeurs */}
      {showAddModal && (
        <div className="modal-overlay" onClick={() => setShowAddModal(false)}>
          <div
            className="modal"
            ref={addModalDrag.modalRef}
            role="dialog"
            aria-modal="true"
            aria-labelledby="modal-add-boxeurs-title"
            onClick={(e) => e.stopPropagation()}
            onTouchStart={addModalDrag.onTouchStart}
            onTouchMove={addModalDrag.onTouchMove}
            onTouchEnd={addModalDrag.onTouchEnd}
          >
            <div className="modal-handle" />
            <div className="modal-header">
              <h2 id="modal-add-boxeurs-title" className="modal-title">Ajouter des boxeurs</h2>
              <button className="modal-close" onClick={() => setShowAddModal(false)} aria-label="Fermer">
                ✕
              </button>
            </div>

            <div className="form-group">
              <input
                type="text"
                placeholder="Rechercher par nom, prénom ou club..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                aria-label="Rechercher un boxeur par nom, prénom ou club"
                autoFocus
              />
            </div>

            {filteredBoxeurs.length > 0 && (
              <div className="add-all-wrapper">
                <button
                  className="btn btn-ghost btn-sm"
                  disabled={batchAdding}
                  onClick={async () => {
                    setBatchAdding(true);
                    try {
                      const ids = filteredBoxeurs.map((b) => b.id);
                      const res = await fetch(`/api/tournois/${params.id}/boxeurs`, {
                        method: "POST",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify({ boxeurIds: ids }),
                      });
                      if (res.ok) {
                        const data = await res.json();
                        showToast(`${data.added} tireur(s) ajouté(s)`, "success");
                        fetchTournoi();
                      }
                    } catch {
                      showToast("Erreur lors de l'ajout groupé", "error");
                    } finally {
                      setBatchAdding(false);
                    }
                  }}
                >
                  {batchAdding ? "Ajout en cours..." : `+ Tout ajouter (${filteredBoxeurs.length})`}
                </button>
              </div>
            )}

            <div className="modal-body">
              {filteredBoxeurs.length === 0 ? (
                <div className="empty-state">
                  <p>
                    {searchTerm
                      ? "Aucun boxeur trouvé"
                      : "Tous les boxeurs sont déjà inscrits"}
                  </p>
                </div>
              ) : (
                <div className="boxeur-add-list">
                  {filteredBoxeurs.map((b) => (
                    <div key={b.id} className="boxeur-row">
                      <div className="boxeur-row-info">
                        <div className="boxeur-row-name">
                          {b.nom.toUpperCase()} {b.prenom}
                        </div>
                        <div className="club-participant-badges">
                          <span className="badge badge-club" style={clubColorStyle(b.club.couleur)}>{b.club.nom}</span>
                          <span className="badge badge-sexe">{b.sexe === "M" ? "H" : "F"}</span>
                          <span className="badge badge-poids">{b.poids}kg</span>
                          <span className={`badge ${b.typeCompetition === "INTERCLUB" ? "badge-interclub" : "badge-tournoi"}`}>
                            {b.typeCompetition === "INTERCLUB" ? "IC" : "T"}
                          </span>
                        </div>
                      </div>
                      <button
                        className="btn btn-sm btn-primary"
                        onClick={() => {
                          handleAddBoxeur(b.id);
                        }}
                        aria-label={`Ajouter ${b.nom} ${b.prenom} au tournoi`}
                      >
                        + Ajouter
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="modal-footer">
              <button
                className="btn btn-ghost"
                onClick={() => {
                  setShowAddModal(false);
                  setSearchTerm("");
                }}
              >
                Fermer
              </button>
            </div>
          </div>
        </div>
      )}

    </>
  );
}
