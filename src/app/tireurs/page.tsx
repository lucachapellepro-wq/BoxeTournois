"use client";

import { useEffect, useState, useMemo } from "react";
import { useBoxeurs } from "@/hooks/useBoxeurs";
import { useClubs } from "@/hooks/useClubs";
import { useToast } from "@/hooks/useToast";
import { Stats } from "@/components/Stats";
import { TireursTable } from "@/components/TireursTable";
import { TireursRecap } from "@/components/TireursRecap";
import { ModalTireur } from "@/components/ModalTireur";
import { ModalClub } from "@/components/ModalClub";
import { Toast } from "@/components/Toast";
import { Boxeur } from "@/types";

export default function TireursPage() {
  const { boxeurs, loading, fetchBoxeurs, deleteBoxeur, updateBoxeur } =
    useBoxeurs();
  const { clubs, fetchClubs } = useClubs();
  const { toast, showToast } = useToast();

  const [showModal, setShowModal] = useState(false);
  const [showClubModal, setShowClubModal] = useState(false);
  const [activeTab, setActiveTab] = useState<"liste" | "recap">("liste");
  const [saving, setSaving] = useState(false);

  const [form, setForm] = useState({
    nom: "",
    prenom: "",
    anneeNaissance: "",
    sexe: "M",
    poids: "",
    gant: "bleu",
    clubId: "",
  });

  const [clubForm, setClubForm] = useState({
    nom: "",
    ville: "",
    coach: "",
  });

  useEffect(() => {
    fetchBoxeurs();
    fetchClubs();
  }, [fetchBoxeurs, fetchClubs]);

  const handleSubmit = async () => {
    if (
      !form.nom ||
      !form.prenom ||
      !form.anneeNaissance ||
      !form.poids ||
      !form.clubId
    ) {
      showToast("Remplis tous les champs !", "error");
      return;
    }
    setSaving(true);
    try {
      const res = await fetch("/api/boxeurs", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      if (res.ok) {
        showToast("Tireur inscrit ✓", "success");
        setForm({
          nom: "",
          prenom: "",
          anneeNaissance: "",
          sexe: "M",
          poids: "",
          gant: "bleu",
          clubId: "",
        });
        setShowModal(false);
        fetchBoxeurs();
      } else {
        const err = await res.json();
        showToast(err.error || "Erreur", "error");
      }
    } catch {
      showToast("Erreur réseau", "error");
    }
    setSaving(false);
  };

  const handleAddClub = async () => {
    if (!clubForm.nom || !clubForm.ville) {
      showToast("Nom et ville obligatoires", "error");
      return;
    }
    const res = await fetch("/api/clubs", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(clubForm),
    });
    if (res.ok) {
      showToast("Club ajouté ✓", "success");
      setClubForm({ nom: "", ville: "", coach: "" });
      setShowClubModal(false);
      fetchClubs();
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm("Supprimer ce tireur ?")) return;
    const success = await deleteBoxeur(id);
    if (success) {
      showToast("Tireur supprimé", "success");
    } else {
      showToast("Erreur suppression", "error");
    }
  };

  const handleUpdate = async (
    id: number,
    field: string,
    value: string | number
  ) => {
    const success = await updateBoxeur(id, { [field]: value });
    if (success) {
      showToast("Modifié ✓", "success");
    } else {
      showToast("Erreur modification", "error");
    }
  };

  // Stats par catégorie d'âge
  const statsByAge = useMemo(() => {
    const map: Record<string, number> = {};
    boxeurs.forEach((b) => {
      map[b.categorieAge || "?"] = (map[b.categorieAge || "?"] || 0) + 1;
    });
    return Object.entries(map).sort((a, b) => b[1] - a[1]);
  }, [boxeurs]);

  // Groupement par catégorie pour le récap
  const groupedByCategory = useMemo(() => {
    const map: Record<string, Boxeur[]> = {};
    boxeurs.forEach((b) => {
      const key = `${b.categorieAge} — ${b.categoriePoids}`;
      if (!map[key]) map[key] = [];
      map[key].push(b);
    });
    return Object.entries(map).sort((a, b) => a[0].localeCompare(b[0]));
  }, [boxeurs]);

  return (
    <>
      <Stats boxeurs={boxeurs} clubs={clubs} statsByAge={statsByAge} />

      <div className="page-header">
        <div>
          <h1 className="page-title">👥 Gestion des Tireurs</h1>
          <p className="page-subtitle">
            Liste complète avec édition directe dans le tableau
          </p>
        </div>
        <div style={{ display: "flex", gap: "8px" }}>
          <button
            className="btn btn-ghost btn-sm"
            onClick={() => setShowClubModal(true)}
          >
            + Club
          </button>
          <button className="btn btn-primary" onClick={() => setShowModal(true)}>
            + Nouveau tireur
          </button>
        </div>
      </div>

      <div className="tabs">
        <button
          className={`tab ${activeTab === "liste" ? "active" : ""}`}
          onClick={() => setActiveTab("liste")}
        >
          Liste éditable
        </button>
        <button
          className={`tab ${activeTab === "recap" ? "active" : ""}`}
          onClick={() => setActiveTab("recap")}
        >
          Récapitulatif par catégorie
        </button>
      </div>

      {activeTab === "liste" && (
        <TireursTable
          boxeurs={boxeurs}
          loading={loading}
          onDelete={handleDelete}
          onUpdate={handleUpdate}
          onOpenModal={() => setShowModal(true)}
        />
      )}

      {activeTab === "recap" && (
        <TireursRecap groupedByCategory={groupedByCategory} />
      )}

      <ModalTireur
        show={showModal}
        form={form}
        clubs={clubs}
        saving={saving}
        onClose={() => setShowModal(false)}
        onSubmit={handleSubmit}
        onChange={setForm}
        onOpenClubModal={() => {
          setShowModal(false);
          setShowClubModal(true);
        }}
      />

      <ModalClub
        show={showClubModal}
        form={clubForm}
        onClose={() => setShowClubModal(false)}
        onSubmit={handleAddClub}
        onChange={setClubForm}
      />

      {toast.visible && <Toast message={toast.message} type={toast.type} />}
    </>
  );
}
