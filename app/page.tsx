"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import type { FeedbackItem } from "@/lib/db";
import Board from "./components/Board";
import SubmitModal from "./components/SubmitModal";
import DetailModal from "./components/DetailModal";

const VOTED_KEY = "voted_items";
const POLL_INTERVAL = 4000; // 4 seconds
const SEARCH_DEBOUNCE_MS = 300;

type StatusFilter = "all" | "new" | "in_progress" | "done";

function getVotedItems(): Set<number> {
  if (typeof window === "undefined") return new Set();
  try {
    const raw = localStorage.getItem(VOTED_KEY);
    if (!raw) return new Set();
    return new Set(JSON.parse(raw) as number[]);
  } catch {
    return new Set();
  }
}

function addVotedItem(id: number) {
  if (typeof window === "undefined") return;
  try {
    const current = getVotedItems();
    current.add(id);
    localStorage.setItem(VOTED_KEY, JSON.stringify([...current]));
  } catch {
    // ignore
  }
}

export default function Home() {
  const [items, setItems] = useState<FeedbackItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [sortBy, setSortBy] = useState("votes");
  const [showSubmit, setShowSubmit] = useState(false);
  const [selected, setSelected] = useState<FeedbackItem | null>(null);
  const [votedIds, setVotedIds] = useState<Set<number>>(new Set());
  const [searchInput, setSearchInput] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const sortByRef = useRef(sortBy);

  useEffect(() => {
    sortByRef.current = sortBy;
  }, [sortBy]);

  // Debounce search input → searchQuery
  useEffect(() => {
    const timer = setTimeout(() => {
      setSearchQuery(searchInput);
    }, SEARCH_DEBOUNCE_MS);
    return () => clearTimeout(timer);
  }, [searchInput]);

  useEffect(() => {
    setVotedIds(getVotedItems());
  }, []);

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

  // Silent background poll — no loading spinner, no flicker
  const pollSilent = useCallback(async () => {
    try {
      const res = await fetch(`/api/feedback?sort=${sortByRef.current}&order=desc`);
      if (!res.ok) return;
      const fresh: FeedbackItem[] = await res.json();
      setItems(fresh);
    } catch {
      // silently ignore poll errors
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  // Polling: start/stop based on tab visibility, clean up on unmount
  useEffect(() => {
    const startPolling = () => {
      if (intervalRef.current) return;
      intervalRef.current = setInterval(pollSilent, POLL_INTERVAL);
    };

    const stopPolling = () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };

    const handleVisibilityChange = () => {
      if (document.hidden) {
        stopPolling();
      } else {
        pollSilent(); // immediate refresh on tab focus
        startPolling();
      }
    };

    startPolling();
    document.addEventListener("visibilitychange", handleVisibilityChange);

    return () => {
      stopPolling();
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, [pollSilent]);

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

  function handleVoted(id: number) {
    addVotedItem(id);
    setVotedIds((prev) => new Set([...prev, id]));
  }

  const filteredItems = items.filter((item) => {
    const matchesStatus =
      statusFilter === "all" || item.status === statusFilter;
    if (!matchesStatus) return false;
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    return (
      item.title.toLowerCase().includes(q) ||
      item.description.toLowerCase().includes(q)
    );
  });

  const hasActiveFilters = searchInput !== "" || statusFilter !== "all";

  function handleReset() {
    setSearchInput("");
    setSearchQuery("");
    setStatusFilter("all");
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
            <a
              href="/api/feedback/export"
              download
              className="btn btn-ghost"
            >
              ↓ Export JSON
            </a>
            <button className="btn btn-primary" onClick={() => setShowSubmit(true)}>
              + Submit Feedback
            </button>
          </div>
        </div>
      </header>

      {/* ── Toolbar ── */}
      <div className="toolbar">
        <div className="toolbar-inner">
          {/* Search input */}
          <div className="search-wrap">
            <svg className="search-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <circle cx="11" cy="11" r="8" />
              <line x1="21" y1="21" x2="16.65" y2="16.65" />
            </svg>
            <input
              id="search"
              type="search"
              className="search-input"
              placeholder="Search feedback…"
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              aria-label="Search feedback by title or description"
            />
            {searchInput && (
              <button
                className="search-clear icon-btn"
                onClick={() => { setSearchInput(""); setSearchQuery(""); }}
                title="Clear search"
                aria-label="Clear search"
              >
                ×
              </button>
            )}
          </div>

          {/* Status filter buttons */}
          <div className="filter-group" role="group" aria-label="Filter by status">
            {(["all", "new", "in_progress", "done"] as StatusFilter[]).map((s) => (
              <button
                key={s}
                className={`filter-btn${statusFilter === s ? " active" : ""}`}
                onClick={() => setStatusFilter(s)}
              >
                {s === "all" ? "All" : s === "in_progress" ? "In Progress" : s === "new" ? "New" : "Done"}
              </button>
            ))}
          </div>

          <div className="toolbar-sep" />

          {/* Sort */}
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

          {/* Reset all filters */}
          {hasActiveFilters && (
            <button className="btn btn-ghost reset-btn" onClick={handleReset}>
              Reset filters
            </button>
          )}

          {/* Result count */}
          {hasActiveFilters && !loading && (
            <span className="filter-count">
              {filteredItems.length} of {items.length}
            </span>
          )}
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
            items={filteredItems}
            hasActiveFilters={hasActiveFilters}
            votedIds={votedIds}
            onVote={async (item) => {
              if (votedIds.has(item.id)) return;
              const res = await fetch(`/api/feedback/${item.id}/vote`, { method: "POST" });
              if (res.ok) {
                handleVoted(item.id);
                handleUpdate(await res.json());
              }
            }}
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
          voted={votedIds.has(selected.id)}
          onUpdate={handleUpdate}
          onDelete={handleDelete}
          onClose={() => setSelected(null)}
          onVoted={handleVoted}
        />
      )}
    </div>
  );
}
