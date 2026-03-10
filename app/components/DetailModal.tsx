"use client";

import { useState } from "react";
import type { FeedbackItem } from "@/lib/db";

interface Props {
  item: FeedbackItem;
  onUpdate: (item: FeedbackItem) => void;
  onDelete: (id: number) => void;
  onClose: () => void;
}

const STATUS_LABELS: Record<string, string> = {
  new: "New",
  in_progress: "In Progress",
  done: "Done",
};

export default function DetailModal({ item, onUpdate, onDelete, onClose }: Props) {
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [voting, setVoting] = useState(false);
  const [editTitle, setEditTitle] = useState(item.title);
  const [editDesc, setEditDesc] = useState(item.description);
  const [editStatus, setEditStatus] = useState(item.status);
  const [error, setError] = useState("");

  async function handleVote() {
    if (voting) return;
    setVoting(true);
    try {
      const res = await fetch(`/api/feedback/${item.id}/vote`, { method: "POST" });
      if (res.ok) onUpdate(await res.json());
    } finally {
      setVoting(false);
    }
  }

  async function handleSave() {
    if (saving) return;
    setError("");
    setSaving(true);
    try {
      const res = await fetch(`/api/feedback/${item.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: editTitle.trim(),
          description: editDesc.trim(),
          status: editStatus,
        }),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error || "Save failed"); return; }
      onUpdate(data);
      setEditing(false);
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete() {
    if (!confirm(`Delete "${item.title}"?`)) return;
    const res = await fetch(`/api/feedback/${item.id}`, { method: "DELETE" });
    if (res.ok) { onDelete(item.id); onClose(); }
  }

  const date = new Date(item.created_at).toLocaleDateString("en-US", {
    year: "numeric", month: "long", day: "numeric",
  });

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-head">
          <span className={`status-badge status-${item.status.replace("_", "-")}`}>
            {STATUS_LABELS[item.status]}
          </span>
          <button className="icon-btn" onClick={onClose} aria-label="Close">×</button>
        </div>

        {editing ? (
          <div>
            {error && <div className="form-error">{error}</div>}
            <div className="field">
              <label>Title</label>
              <input className="input" value={editTitle} onChange={(e) => setEditTitle(e.target.value)} />
            </div>
            <div className="field">
              <label>Description</label>
              <textarea className="input textarea" value={editDesc} onChange={(e) => setEditDesc(e.target.value)} rows={6} />
            </div>
            <div className="field">
              <label>Status</label>
              <select className="input" value={editStatus} onChange={(e) => setEditStatus(e.target.value as FeedbackItem["status"])}>
                <option value="new">New</option>
                <option value="in_progress">In Progress</option>
                <option value="done">Done</option>
              </select>
            </div>
            <div className="modal-actions">
              <button className="btn btn-primary" onClick={handleSave} disabled={saving || !editTitle.trim() || !editDesc.trim()}>
                {saving ? "Saving…" : "Save Changes"}
              </button>
              <button className="btn btn-ghost" onClick={() => { setEditing(false); setError(""); }}>
                Cancel
              </button>
            </div>
          </div>
        ) : (
          <div>
            <h2 className="detail-title">{item.title}</h2>
            <div className="detail-meta">
              <span>by <strong>{item.author_name}</strong></span>
              <span className="meta-sep">·</span>
              <span>{date}</span>
            </div>
            <p className="detail-body">{item.description}</p>
            <div className="detail-actions">
              <button
                className={`vote-btn vote-btn-lg${voting ? " voting" : ""}`}
                onClick={handleVote}
                disabled={voting}
              >
                <span className="vote-arrow">▲</span>
                <span>{item.votes} votes</span>
              </button>
              <div className="detail-secondary">
                <button className="btn btn-ghost" onClick={() => setEditing(true)}>Edit</button>
                <button className="btn btn-danger" onClick={handleDelete}>Delete</button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
