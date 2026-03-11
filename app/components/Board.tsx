"use client";

import type { FeedbackItem } from "@/lib/db";
import FeedbackCard from "./FeedbackCard";

interface Props {
  items: FeedbackItem[];
  votedIds: Set<number>;
  onVote: (item: FeedbackItem) => void;
  onUpdate: (item: FeedbackItem) => void;
  onDelete: (id: number) => void;
  onCardClick: (item: FeedbackItem) => void;
}

export default function Board({ items, votedIds, onVote, onUpdate, onDelete, onCardClick }: Props) {
  if (items.length === 0) {
    return (
      <div className="center-state">
        <p>No feedback yet. Be the first to submit!</p>
      </div>
    );
  }

  return (
    <div className="feedback-list">
      {items.map((item) => (
        <FeedbackCard
          key={item.id}
          item={item}
          voted={votedIds.has(item.id)}
          onVote={onVote}
          onDelete={onDelete}
          onClick={onCardClick}
        />
      ))}
    </div>
  );
}
