"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import type { FeedbackItem } from "@/lib/db";
import Board from "./components/Board";
import SubmitModal from "./components/SubmitModal";
import DetailModal from "./components/DetailModal";

const VOTED_KEY = "voted_items";
const POLL_INTERVAL = 4000; // 4 seconds

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
  const [searchQuery, setSearchQuery] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const sortByRef = useRef(sortBy);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    sortByRef.current = sortBy;
  }, [sortBy]);

  // Cleanup debounce timer on unmount
  useEffect(() => {
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, []);

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

  const displayedItems = items.filter((item) => {
    const matchesStatus = statusFilter === 'all' || item.status === statusFilter;
    const q = debouncedSearch.toLowerCase().trim();
    const matchesSearch =
      !q ||
      item.title.toLowerCase().includes(q) ||
      (item.description ?? '').toLowerCase().includes(q);
    return matchesStatus && matchesSearch;
  });

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
          {/* Search */}
          <div className="search-wrapper">
            <input
              type="text"
              className="search-input"
              placeholder="Search feedback…"
              value={searchQuery}
              onChange={(e) => {
                const val = e.target.value;
                setSearchQuery(val);
                if (debounceRef.current) clearTimeout(debounceRef.current);
                debounceRef.current = setTimeout(() => setDebouncedSearch(val), 300);
              }}
              aria-label="Search feedback"
            />
            {searchQuery && (
              <button
                className="search-clear"
                aria-label="Clear search"
                onClick={() => {
                  setSearchQuery('');
                  setDebouncedSearch('');
                  if (debounceRef.current) clearTimeout(debounceRef.current);
                }}
              >
                ×
              </button>
            )}
          </div>

          {/* Status filter pills */}
          <div className="filter-pills" role="group" aria-label="Filter by status">
            {([
              { label: 'All', value: 'all' },
              { label: 'New', value: 'new' },
              { label: 'In Progress', value: 'in_progress' },
              { label: 'Done', value: 'done' },
            ] as const).map(({ label, value }) => (
              <button
                key={value}
                className={`filter-pill${statusFilter === value ? ' active' : ''}`}
                onClick={() => setStatusFilter(value)}
                aria-pressed={statusFilter === value}
              >
                {label}
              </button>
            ))}
          </div>

          {/* Sort */}
          <div className="toolbar-sort">
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
            items={displayedItems}
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
