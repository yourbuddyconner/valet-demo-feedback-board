import Database from "better-sqlite3";
import path from "path";

const DB_PATH = path.join(process.cwd(), "feedback.db");

let db: Database.Database | null = null;

export function getDb(): Database.Database {
  if (!db) {
    db = new Database(DB_PATH);
    db.pragma("journal_mode = WAL");
    db.pragma("foreign_keys = ON");
    initSchema();
  }
  return db;
}

function initSchema() {
  if (!db) return;

  db.exec(`
    CREATE TABLE IF NOT EXISTS feedback (
      id          INTEGER PRIMARY KEY AUTOINCREMENT,
      title       TEXT    NOT NULL,
      description TEXT    NOT NULL,
      status      TEXT    NOT NULL DEFAULT 'new'
                          CHECK(status IN ('new', 'in_progress', 'done')),
      votes       INTEGER NOT NULL DEFAULT 0,
      author_name TEXT    NOT NULL,
      created_at  TEXT    NOT NULL DEFAULT (datetime('now')),
      updated_at  TEXT    NOT NULL DEFAULT (datetime('now'))
    )
  `);

  const { count } = db
    .prepare("SELECT COUNT(*) as count FROM feedback")
    .get() as { count: number };

  if (count === 0) {
    seed(db);
  }
}

function seed(db: Database.Database) {
  const insert = db.prepare(`
    INSERT INTO feedback (title, description, status, votes, author_name, created_at, updated_at)
    VALUES (@title, @description, @status, @votes, @author_name,
            datetime('now', @offset), datetime('now', @offset))
  `);

  const items = [
    {
      title: "Export feedback to CSV",
      description:
        "Allow admins to export all feedback items to a CSV file for reporting and analysis. Should include all fields (title, description, author, votes, status, date) and support filtering by status before exporting.",
      status: "new",
      votes: 52,
      author_name: "Marcus Johnson",
      offset: "-8 days",
    },
    {
      title: "Mobile-friendly layout",
      description:
        "The board is hard to use on small screens. A responsive layout optimized for mobile would help users submit and vote on feedback from their phones without pinching and zooming.",
      status: "new",
      votes: 41,
      author_name: "Alex Rodriguez",
      offset: "-3 days",
    },
    {
      title: "Email notifications for status changes",
      description:
        "Send an email notification to the feedback author when the status of their item changes. This keeps submitters in the loop without needing to check back manually every day.",
      status: "new",
      votes: 38,
      author_name: "Priya Patel",
      offset: "-7 days",
    },
    {
      title: "Dark mode support",
      description:
        "Add a dark mode option for the app. Should respect the system-level preference by default but also allow manual override via a toggle in the header. Many users work in low-light environments.",
      status: "new",
      votes: 34,
      author_name: "Sarah Chen",
      offset: "-10 days",
    },
    {
      title: "Filter feedback by status",
      description:
        "Add filter buttons or tabs to show only New, In Progress, or Done items. Right now all items are shown in a single list and there is no way to focus on a subset without scrolling through everything.",
      status: "new",
      votes: 27,
      author_name: "Tom Williams",
      offset: "-5 days",
    },
    {
      title: "Add tags and categories to feedback",
      description:
        "Allow tagging feedback with categories like UI, Performance, Bug, or Feature Request. Tags would make it easier to filter, group, and prioritize items — especially as the board grows.",
      status: "new",
      votes: 23,
      author_name: "Jordan Kim",
      offset: "-6 days",
    },
    {
      title: "Public shareable links to individual feedback items",
      description:
        "Each feedback item should have its own URL so it can be linked directly from Slack, email, or external docs. Right now everything lives on a single page and deep-linking is not possible.",
      status: "new",
      votes: 19,
      author_name: "Emma Davis",
      offset: "-14 days",
    },
    {
      title: "Admin comment / response on feedback",
      description:
        "Let admins leave a public comment or response on a feedback item so users know it has been acknowledged. A simple text field below the description would be enough to start.",
      status: "new",
      votes: 15,
      author_name: "Rachel Thompson",
      offset: "-20 days",
    },
  ];

  const insertMany = db.transaction(
    (rows: typeof items) => rows.forEach((r) => insert.run(r))
  );
  insertMany(items);
  console.log(`[db] Seeded ${items.length} feedback items`);
}

export interface FeedbackItem {
  id: number;
  title: string;
  description: string;
  status: "new" | "in_progress" | "done";
  votes: number;
  author_name: string;
  created_at: string;
  updated_at: string;
}
