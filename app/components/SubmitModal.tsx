"use client";

import { useState } from "react";
import type { FeedbackItem } from "@/lib/db";

interface Props {
  onCreated: (item: FeedbackItem) => void;
  onClose: () => void;
}

export default function SubmitModal({ onCreated, onClose }: Props) {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [authorName, setAuthorName] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (submitting) return;
    setError("");
    setSubmitting(true);
    try {
      const res = await fetch("/api/feedback", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: title.trim(),
          description: description.trim(),
          author_name: authorName.trim(),
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Failed to submit");
        return;
      }
      onCreated(data);
      onClose();
    } catch {
      setError("Network error — please try again.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-head">
          <h2 className="modal-title">Submit Feedback</h2>
          <button className="icon-btn" onClick={onClose} aria-label="Close">×</button>
        </div>

        <form onSubmit={handleSubmit}>
          {error && <div className="form-error">{error}</div>}

          <div className="field">
            <label htmlFor="title">Title <span className="req">*</span></label>
            <input
              id="title"
              className="input"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Short summary of your feedback"
              maxLength={120}
              required
            />
          </div>

          <div className="field">
            <label htmlFor="desc">Description <span className="req">*</span></label>
            <textarea
              id="desc"
              className="input textarea"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Describe your idea or issue in detail…"
              rows={5}
              required
            />
          </div>

          <div className="field">
            <label htmlFor="author">Your Name <span className="req">*</span></label>
            <input
              id="author"
              className="input"
              value={authorName}
              onChange={(e) => setAuthorName(e.target.value)}
              placeholder="Jane Doe"
              required
            />
          </div>

          <div className="modal-actions">
            <button type="submit" className="btn btn-primary" disabled={submitting}>
              {submitting ? "Submitting…" : "Submit Feedback"}
            </button>
            <button type="button" className="btn btn-ghost" onClick={onClose}>
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
