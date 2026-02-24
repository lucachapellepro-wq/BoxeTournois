"use client";

import { useEffect, useState } from "react";
import { useTournois } from "@/hooks/useTournois";
import { useGlobalToast } from "@/contexts/ToastContext";
import { ModalTournoi } from "@/components/ModalTournoi";
import { formatDate } from "@/lib/ui-helpers";
import { Tournoi } from "@/types";
import Link from "next/link";

/** Page d'accueil : liste des tournois avec création, édition et suppression */
export default function TournoiPage() {
  const { tournois, loading, fetchTournois, createTournoi, updateTournoi, deleteTournoi } = useTournois();
  const { showToast } = useGlobalToast();

  const [showModal, setShowModal] = useState(false);
  const [saving, setSaving] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);

  const [form, setForm] = useState({
    nom: "",
    date: "",
  });

  useEffect(() => {
    fetchTournois();
  }, [fetchTournois]);

  const handleOpenCreate = () => {
    setForm({ nom: "", date: "" });
    setEditingId(null);
    setShowModal(true);
  };

  const handleOpenEdit = (e: React.MouseEvent, tournoi: Tournoi) => {
    e.preventDefault();
    e.stopPropagation();
    setForm({
      nom: tournoi.nom,
      date: new Date(tournoi.date).toISOString().split("T")[0],
    });
    setEditingId(tournoi.id);
    setShowModal(true);
  };

  const handleSubmit = async () => {
    if (!form.nom || !form.date) {
      showToast("Nom et date obligatoires", "error");
      return;
    }

    setSaving(true);
    try {
      const success = editingId
        ? await updateTournoi(editingId, form)
        : await createTournoi(form);

      if (success) {
        showToast(
          editingId ? "Tournoi modifié ✓" : "Tournoi créé ✓",
          "success"
        );
        setShowModal(false);
        setForm({ nom: "", date: "" });
        setEditingId(null);
      } else {
        showToast("Erreur lors de la sauvegarde", "error");
      }
    } catch {
      showToast("Erreur réseau", "error");
    }
    setSaving(false);
  };

  const handleDelete = async (e: React.MouseEvent, id: number, nom: string) => {
    e.preventDefault();
    e.stopPropagation();
    if (!confirm(`Supprimer le tournoi "${nom}" ?`)) return;

    const success = await deleteTournoi(id);
    if (success) {
      showToast("Tournoi supprimé", "success");
    } else {
      showToast("Erreur suppression", "error");
    }
  };

  const isUpcoming = (date: string) => {
    const d = new Date(date); d.setUTCHours(23, 59, 59, 999);
    return d >= new Date();
  };

  return (
    <>
      <div className="page-header">
        <div>
          <h1 className="page-title">Gestion des Tournois</h1>
          <p className="page-subtitle">
            Créez et gérez vos tournois de savate boxe française
          </p>
        </div>
        <button className="btn btn-primary" onClick={handleOpenCreate}>
          + Nouveau tournoi
        </button>
      </div>

      {loading ? (
        <div className="card">
          <div className="loading-state"><div className="spinner" /></div>
        </div>
      ) : tournois.length === 0 ? (
        <div className="card">
          <div className="empty-state">
            <div className="empty-state-icon">🏆</div>
            <p>Aucun tournoi enregistré</p>
            <p className="empty-hint">Commencez par créer votre premier tournoi</p>
            <button className="btn btn-primary" onClick={handleOpenCreate}>
              + Créer le premier tournoi
            </button>
          </div>
        </div>
      ) : (
        <div className="tournoi-grid">
          {tournois.map((t) => {
            const upcoming = isUpcoming(t.date);
            const count = t._count?.boxeurs || 0;
            return (
              <Link
                key={t.id}
                href={`/tournois/${t.id}`}
                className={`card card-clickable tournoi-card ${upcoming ? "tournoi-card-upcoming" : ""}`}
              >
                <div className="tournoi-card-header">
                  <div className="tournoi-card-date">
                    <span className="tournoi-card-day">
                      {new Date(t.date).getDate()}
                    </span>
                    <span className="tournoi-card-month">
                      {new Date(t.date).toLocaleDateString("fr-FR", { month: "short" }).toUpperCase()}
                    </span>
                    <span className="tournoi-card-year">
                      {new Date(t.date).getUTCFullYear()}
                    </span>
                  </div>
                  <div className="tournoi-card-info">
                    <h3 className="tournoi-card-name">{t.nom}</h3>
                    <p className="tournoi-card-meta">
                      {formatDate(t.date)}
                      {upcoming && <span className="badge badge-upcoming">A venir</span>}
                    </p>
                  </div>
                </div>

                <div className="tournoi-card-stats">
                  <div className="tournoi-card-stat">
                    <span className="tournoi-card-stat-value">{count}</span>
                    <span className="tournoi-card-stat-label">
                      {count === 1 ? "tireur" : "tireurs"}
                    </span>
                  </div>
                </div>

                <div className="tournoi-card-actions">
                  <button
                    className="btn btn-sm btn-ghost"
                    onClick={(e) => handleOpenEdit(e, t)}
                  >
                    ✏️ Modifier
                  </button>
                  <button
                    className="btn-icon btn-danger"
                    onClick={(e) => handleDelete(e, t.id, t.nom)}
                    title="Supprimer"
                  >
                    🗑️
                  </button>
                </div>
              </Link>
            );
          })}
        </div>
      )}

      <ModalTournoi
        show={showModal}
        form={form}
        isEditing={editingId !== null}
        saving={saving}
        onClose={() => {
          setShowModal(false);
          setForm({ nom: "", date: "" });
          setEditingId(null);
        }}
        onSubmit={handleSubmit}
        onChange={setForm}
      />
    </>
  );
}
