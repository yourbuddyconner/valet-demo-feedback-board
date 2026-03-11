import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Feedback Board",
  description: "Submit ideas, vote on what matters most.",
};

// Inline script to apply theme before first paint, preventing flash of wrong theme.
// Reads localStorage; falls back to prefers-color-scheme.
const themeScript = `
(function () {
  var stored = null;
  try { stored = localStorage.getItem('theme'); } catch (e) {}
  var prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
  var theme = stored === 'dark' || stored === 'light' ? stored : (prefersDark ? 'dark' : 'light');
  document.documentElement.setAttribute('data-theme', theme);
})();
`.trim();

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      {/* This inline script runs synchronously before first paint to prevent theme flash */}
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeScript }} />
      </head>
      <body>{children}</body>
    </html>
  );
}
