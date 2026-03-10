"use client";

import { useState } from "react";
import type { FeedbackItem } from "@/lib/db";

interface Props {
  item: FeedbackItem;
  onUpdate: (item: FeedbackItem) => void;
  onDelete: (id: number) => void;
  onClick: (item: FeedbackItem) => void;
}

const STATUS_LABELS: Record<string, string> = {
  new: "New",
  in_progress: "In Progress",
  done: "Done",
};

export default function FeedbackCard({ item, onUpdate, onDelete, onClick }: Props) {
  const [voting, setVoting] = useState(false);
  const [changingStatus, setChangingStatus] = useState(false);

  async function handleVote(e: React.MouseEvent) {
    e.stopPropagation();
    if (voting) return;
    setVoting(true);
    try {
      const res = await fetch(`/api/feedback/${item.id}/vote`, { method: "POST" });
      if (res.ok) onUpdate(await res.json());
    } finally {
      setVoting(false);
    }
  }

  async function handleStatusChange(e: React.ChangeEvent<HTMLSelectElement>) {
    e.stopPropagation();
    const newStatus = e.target.value;
    if (newStatus === item.status || changingStatus) return;
    setChangingStatus(true);
    try {
      const res = await fetch(`/api/feedback/${item.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      });
      if (res.ok) onUpdate(await res.json());
    } finally {
      setChangingStatus(false);
    }
  }

  async function handleDelete(e: React.MouseEvent) {
    e.stopPropagation();
    if (!confirm(`Delete "${item.title}"?`)) return;
    const res = await fetch(`/api/feedback/${item.id}`, { method: "DELETE" });
    if (res.ok) onDelete(item.id);
  }

  const preview =
    item.description.length > 110
      ? item.description.slice(0, 110) + "…"
      : item.description;

  return (
    <div className="card" onClick={() => onClick(item)}>
      <div className="card-header">
        <span className={`status-badge status-${item.status.replace("_", "-")}`}>
          {STATUS_LABELS[item.status]}
        </span>
        <button className="icon-btn danger-hover" onClick={handleDelete} title="Delete">
          ×
        </button>
      </div>

      <h3 className="card-title">{item.title}</h3>
      <p className="card-preview">{preview}</p>

      <div className="card-footer">
        <span className="card-author">by {item.author_name}</span>
        <div className="card-actions">
          <select
            className="status-select"
            value={item.status}
            onChange={handleStatusChange}
            onClick={(e) => e.stopPropagation()}
            disabled={changingStatus}
          >
            <option value="new">New</option>
            <option value="in_progress">In Progress</option>
            <option value="done">Done</option>
          </select>
          <button
            className={`vote-btn${voting ? " voting" : ""}`}
            onClick={handleVote}
            disabled={voting}
            title="Upvote"
          >
            <span className="vote-arrow">▲</span>
            <span className="vote-count">{item.votes}</span>
          </button>
        </div>
      </div>
    </div>
  );
}
