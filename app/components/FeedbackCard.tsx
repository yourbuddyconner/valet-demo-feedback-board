"use client";

import type { FeedbackItem } from "@/lib/db";

interface Props {
  item: FeedbackItem;
  voted: boolean;
  onVote: (item: FeedbackItem) => void;
  onDelete: (id: number) => void;
  onClick: (item: FeedbackItem) => void;
}

const STATUS_LABELS: Record<string, string> = {
  new: "New",
  in_progress: "In Progress",
  done: "Done",
};

export default function FeedbackCard({ item, voted, onVote, onDelete, onClick }: Props) {
  const preview =
    item.description.length > 140
      ? item.description.slice(0, 140) + "…"
      : item.description;

  async function handleDelete(e: React.MouseEvent) {
    e.stopPropagation();
    if (!confirm(`Delete "${item.title}"?`)) return;
    const res = await fetch(`/api/feedback/${item.id}`, { method: "DELETE" });
    if (res.ok) onDelete(item.id);
  }

  return (
    <div className="list-item" onClick={() => onClick(item)}>
      {/* Vote button */}
      <button
        className={`vote-btn-list${voted ? " voted" : ""}`}
        onClick={(e) => { e.stopPropagation(); onVote(item); }}
        disabled={voted}
        title={voted ? "Already voted" : "Upvote"}
        aria-label={voted ? "Already voted" : "Upvote"}
      >
        <svg
          className="vote-icon"
          viewBox="0 0 24 24"
          fill={voted ? "currentColor" : "none"}
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden="true"
        >
          <path d="M12 19V5M5 12l7-7 7 7" />
        </svg>
        <span className="vote-count">{item.votes}</span>
      </button>

      {/* Content */}
      <div className="list-item-body">
        <div className="list-item-header">
          <h3 className="list-item-title">{item.title}</h3>
          <span className={`status-badge status-${item.status.replace("_", "-")}`}>
            {STATUS_LABELS[item.status]}
          </span>
        </div>
        <p className="list-item-preview">{preview}</p>
        <div className="list-item-meta">
          <span className="list-item-author">by {item.author_name}</span>
        </div>
      </div>

      {/* Delete */}
      <button
        className="icon-btn danger-hover list-item-delete"
        onClick={handleDelete}
        title="Delete"
        aria-label="Delete"
      >
        ×
      </button>
    </div>
  );
}
