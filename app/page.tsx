"use client";

import { useState, useEffect, useCallback } from "react";
import type { FeedbackItem } from "@/lib/db";
import Board from "./components/Board";
import SubmitModal from "./components/SubmitModal";
import DetailModal from "./components/DetailModal";

export default function Home() {
  const [items, setItems] = useState<FeedbackItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [sortBy, setSortBy] = useState("votes");
  const [showSubmit, setShowSubmit] = useState(false);
  const [selected, setSelected] = useState<FeedbackItem | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const res = await fetch(`/api/feedback?sort=${sortBy}&order=desc`);
      if (!res.ok) throw new Error("fetch failed");
      setItems(await res.json());
    } catch {
      setError("Could not load feedback. Make sure the server is running.");
    } finally {
      setLoading(false);
    }
  }, [sortBy]);

  useEffect(() => { load(); }, [load]);

  function handleUpdate(updated: FeedbackItem) {
    setItems((prev) => prev.map((i) => (i.id === updated.id ? updated : i)));
    if (selected?.id === updated.id) setSelected(updated);
  }

  function handleDelete(id: number) {
    setItems((prev) => prev.filter((i) => i.id !== id));
    if (selected?.id === id) setSelected(null);
  }

  function handleCreated(item: FeedbackItem) {
    setItems((prev) => [item, ...prev]);
  }

  const counts = {
    total: items.length,
    new: items.filter((i) => i.status === "new").length,
    in_progress: items.filter((i) => i.status === "in_progress").length,
    done: items.filter((i) => i.status === "done").length,
  };

  return (
    <div className="app">
      {/* ── Header ── */}
      <header className="app-header">
        <div className="header-inner">
          <div>
            <h1 className="app-title">Feedback Board</h1>
            <p className="app-sub">Share ideas · Vote on what matters</p>
          </div>
          <div className="header-right">
            <div className="stats">
              {[
                { label: "Total", value: counts.total },
                { label: "New", value: counts.new },
                { label: "In Progress", value: counts.in_progress },
                { label: "Done", value: counts.done },
              ].map(({ label, value }) => (
                <div key={label} className="stat">
                  <span className="stat-val">{value}</span>
                  <span className="stat-label">{label}</span>
                </div>
              ))}
            </div>
            <button className="btn btn-primary" onClick={() => setShowSubmit(true)}>
              + Submit Feedback
            </button>
          </div>
        </div>
      </header>

      {/* ── Toolbar ── */}
      <div className="toolbar">
        <div className="toolbar-inner">
          <label htmlFor="sort" className="sort-label">Sort by</label>
          <select
            id="sort"
            className="sort-select"
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
          >
            <option value="votes">Most Votes</option>
            <option value="created_at">Newest First</option>
            <option value="updated_at">Recently Updated</option>
          </select>
        </div>
      </div>

      {/* ── Main ── */}
      <main className="main">
        {loading && (
          <div className="center-state">
            <div className="spinner" />
            <p>Loading feedback…</p>
          </div>
        )}
        {!loading && error && (
          <div className="center-state error-state">
            <p>{error}</p>
            <button className="btn btn-primary" onClick={load}>Retry</button>
          </div>
        )}
        {!loading && !error && (
          <Board
            items={items}
            onUpdate={handleUpdate}
            onDelete={handleDelete}
            onCardClick={setSelected}
          />
        )}
      </main>

      {/* ── Modals ── */}
      {showSubmit && (
        <SubmitModal onCreated={handleCreated} onClose={() => setShowSubmit(false)} />
      )}
      {selected && (
        <DetailModal
          item={selected}
          onUpdate={handleUpdate}
          onDelete={handleDelete}
          onClose={() => setSelected(null)}
        />
      )}
    </div>
  );
}
