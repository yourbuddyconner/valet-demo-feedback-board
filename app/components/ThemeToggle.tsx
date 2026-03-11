"use client";

import { useState, useEffect } from "react";

export default function ThemeToggle() {
  const [isDark, setIsDark] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    // Determine initial state from the DOM (set by the inline script) or localStorage
    const stored = (() => {
      try {
        return localStorage.getItem("theme");
      } catch {
        return null;
      }
    })();

    const prefersDark = (() => {
      try {
        return window.matchMedia("(prefers-color-scheme: dark)").matches;
      } catch {
        return false;
      }
    })();

    const dark =
      stored === "dark" || (stored === null && prefersDark);

    setIsDark(dark);
    setMounted(true);
  }, []);

  function toggle() {
    const next = !isDark;
    setIsDark(next);

    try {
      if (next) {
        document.documentElement.setAttribute("data-theme", "dark");
        localStorage.setItem("theme", "dark");
      } else {
        document.documentElement.removeAttribute("data-theme");
        localStorage.setItem("theme", "light");
      }
    } catch {
      // localStorage may be unavailable in private browsing
    }
  }

  // Avoid hydration mismatch: render a placeholder until mounted
  if (!mounted) {
    return <button className="theme-toggle" aria-label="Toggle theme" disabled>☀</button>;
  }

  return (
    <button
      className="theme-toggle"
      onClick={toggle}
      aria-label={isDark ? "Switch to light mode" : "Switch to dark mode"}
      title={isDark ? "Switch to light mode" : "Switch to dark mode"}
    >
      {isDark ? "☀" : "🌙"}
    </button>
  );
}
