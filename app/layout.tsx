import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Feedback Board",
  description: "Submit ideas, vote on what matters most.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
