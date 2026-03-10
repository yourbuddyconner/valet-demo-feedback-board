"use client";

import type { FeedbackItem } from "@/lib/db";
import FeedbackCard from "./FeedbackCard";

interface Props {
  items: FeedbackItem[];
  onUpdate: (item: FeedbackItem) => void;
  onDelete: (id: number) => void;
  onCardClick: (item: FeedbackItem) => void;
}

const COLUMNS = [
  { key: "new", label: "New", icon: "💡" },
  { key: "in_progress", label: "In Progress", icon: "🔧" },
  { key: "done", label: "Done", icon: "✅" },
] as const;

export default function Board({ items, onUpdate, onDelete, onCardClick }: Props) {
  return (
    <div className="board">
      {COLUMNS.map((col) => {
        const colItems = items
          .filter((i) => i.status === col.key)
          .sort((a, b) => b.votes - a.votes);

        return (
          <div key={col.key} className="column">
            <div className="column-header">
              <span className="col-icon">{col.icon}</span>
              <span className="col-title">{col.label}</span>
              <span className="col-count">{colItems.length}</span>
            </div>
            <div className="column-body">
              {colItems.length === 0 ? (
                <p className="column-empty">No items yet</p>
              ) : (
                colItems.map((item) => (
                  <FeedbackCard
                    key={item.id}
                    item={item}
                    onUpdate={onUpdate}
                    onDelete={onDelete}
                    onClick={onCardClick}
                  />
                ))
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
