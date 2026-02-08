"use client";

import { useEffect, useState } from "react";
import { useTournois } from "@/hooks/useTournois";
import { useToast } from "@/hooks/useToast";
import { ModalTournoi } from "@/components/ModalTournoi";
import { Toast } from "@/components/Toast";
import { formatDate } from "@/lib/ui-helpers";
import { Tournoi } from "@/types";
import Link from "next/link";

export default function TournoiPage() {
  const { tournois, loading, fetchTournois, createTournoi, updateTournoi, deleteTournoi } = useTournois();
  const { toast, showToast } = useToast();

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

  const handleOpenEdit = (tournoi: Tournoi) => {
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

  const handleDelete = async (id: number, nom: string) => {
    if (!confirm(`Supprimer le tournoi "${nom}" ?`)) return;

    const success = await deleteTournoi(id);
    if (success) {
      showToast("Tournoi supprimé", "success");
    } else {
      showToast("Erreur suppression", "error");
    }
  };

  return (
    <>
      <div className="page-header">
        <div>
          <h1 className="page-title">🏆 Gestion des Tournois</h1>
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
          <p style={{ textAlign: "center", padding: "40px", color: "#888" }}>
            Chargement...
          </p>
        </div>
      ) : tournois.length === 0 ? (
        <div className="card">
          <div className="empty-state">
            <div className="empty-state-icon">🏆</div>
            <p>Aucun tournoi enregistré</p>
            <button className="btn btn-primary" onClick={handleOpenCreate}>
              + Créer le premier tournoi
            </button>
          </div>
        </div>
      ) : (
        <div className="card">
          <div className="table-wrapper">
            <table>
              <thead>
                <tr>
                  <th>Nom du tournoi</th>
                  <th>Date</th>
                  <th>Tireurs inscrits</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {tournois.map((t) => (
                  <tr key={t.id}>
                    <td>
                      <Link href={`/tournois/${t.id}`} style={{ textDecoration: "none", color: "inherit" }}>
                        <strong style={{ cursor: "pointer", color: "#2563eb" }}>{t.nom}</strong>
                      </Link>
                    </td>
                    <td>{formatDate(t.date)}</td>
                    <td>
                      <span className="badge badge-category">
                        {t._count?.boxeurs || 0} tireurs
                      </span>
                    </td>
                    <td>
                      <div style={{ display: "flex", gap: "8px" }}>
                        <button
                          className="btn btn-sm btn-ghost"
                          onClick={() => handleOpenEdit(t)}
                          title="Modifier"
                        >
                          ✏️ Modifier
                        </button>
                        <button
                          className="btn-icon btn-danger"
                          onClick={() => handleDelete(t.id, t.nom)}
                          title="Supprimer"
                        >
                          🗑️
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
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

      {toast.visible && <Toast message={toast.message} type={toast.type} />}
    </>
  );
}
