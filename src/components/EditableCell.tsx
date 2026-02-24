import { useState, useRef, useEffect } from "react";

/** Props de la cellule éditable */
interface EditableCellProps {
  value: string | number | null;
  type: "text" | "number" | "select";
  options?: { value: string; label: string }[];
  onSave: (newValue: string | number) => Promise<void>;
}

/** Cellule de tableau éditable au clic (text, number ou select) avec sauvegarde auto au blur */
export function EditableCell({
  value,
  type,
  options,
  onSave,
}: EditableCellProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [editValue, setEditValue] = useState(String(value ?? ""));
  const [saving, setSaving] = useState(false);
  const inputRef = useRef<HTMLInputElement | HTMLSelectElement>(null);

  useEffect(() => {
    if (!isEditing) setEditValue(String(value ?? ""));
  }, [value, isEditing]);

  useEffect(() => {
    if (isEditing && inputRef.current) {
      inputRef.current.focus();
      if (type !== "select" && inputRef.current instanceof HTMLInputElement) {
        inputRef.current.select();
      }
    }
  }, [isEditing, type]);

  const handleSave = async () => {
    if (editValue === String(value ?? "")) {
      setIsEditing(false);
      return;
    }

    // Empêcher l'envoi de NaN pour les champs numériques
    if (type === "number" && (editValue === "" || isNaN(parseFloat(editValue)))) {
      handleCancel();
      return;
    }

    setSaving(true);
    try {
      await onSave(type === "number" ? parseFloat(editValue) : editValue);
      setIsEditing(false);
    } catch (error) {
      console.error("Erreur sauvegarde:", error);
      setEditValue(String(value ?? ""));
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = () => {
    setEditValue(String(value ?? ""));
    setIsEditing(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      handleSave();
    } else if (e.key === "Escape") {
      handleCancel();
    }
  };

  if (!isEditing) {
    return (
      <span
        className="editable-cell"
        onClick={() => setIsEditing(true)}
        title="Cliquer pour modifier"
      >
        {value ?? ""}
      </span>
    );
  }

  if (saving) {
    return <span className="editable-cell-saving">⏳</span>;
  }

  if (type === "select" && options) {
    return (
      <select
        ref={inputRef as React.RefObject<HTMLSelectElement>}
        value={editValue}
        onChange={(e) => setEditValue(e.target.value)}
        onBlur={handleSave}
        onKeyDown={handleKeyDown}
        className="editable-cell-input"
      >
        {options.map((opt) => (
          <option key={opt.value} value={opt.value}>
            {opt.label}
          </option>
        ))}
      </select>
    );
  }

  return (
    <input
      ref={inputRef as React.RefObject<HTMLInputElement>}
      type={type}
      value={editValue}
      onChange={(e) => setEditValue(e.target.value)}
      onBlur={handleSave}
      onKeyDown={handleKeyDown}
      className="editable-cell-input"
    />
  );
}
