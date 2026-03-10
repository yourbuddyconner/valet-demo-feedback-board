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
      title: "Dark mode support",
      description:
        "It would be great to have a dark mode option for the app. Many users prefer working in dark environments, especially at night. This should respect the system preference by default but also allow manual override.",
      status: "in_progress",
      votes: 47,
      author_name: "Sarah Chen",
      offset: "-10 days",
    },
    {
      title: "Export feedback to CSV",
      description:
        "Allow admins to export all feedback items to a CSV file for reporting and analysis purposes. Should include all fields and support filtering by status.",
      status: "new",
      votes: 32,
      author_name: "Marcus Johnson",
      offset: "-8 days",
    },
    {
      title: "Email notifications for status changes",
      description:
        "Send an email notification to the feedback author when the status of their item changes. This keeps submitters in the loop without them needing to check back manually.",
      status: "new",
      votes: 28,
      author_name: "Priya Patel",
      offset: "-7 days",
    },
    {
      title: "Add tags and categories to feedback",
      description:
        "It would be helpful to tag feedback items with categories like UI, Performance, Bug, Feature Request, etc. This would make filtering and prioritization much easier for the team.",
      status: "new",
      votes: 19,
      author_name: "Tom Williams",
      offset: "-5 days",
    },
    {
      title: "Keyboard shortcuts",
      description:
        "Add keyboard shortcuts for common actions like submitting feedback, voting, and navigating between items. Power users will love this and it improves accessibility.",
      status: "done",
      votes: 15,
      author_name: "Emma Davis",
      offset: "-14 days",
    },
    {
      title: "Mobile app",
      description:
        "A dedicated mobile app for iOS and Android would make it much easier to submit and track feedback on the go. Even a well-optimized PWA would be a great start.",
      status: "new",
      votes: 41,
      author_name: "Alex Rodriguez",
      offset: "-3 days",
    },
    {
      title: "Merge duplicate feedback items",
      description:
        "Admins should be able to merge duplicate feedback items and combine their vote counts. This keeps the board clean and prevents fragmented voting on the same idea.",
      status: "in_progress",
      votes: 23,
      author_name: "Jordan Kim",
      offset: "-6 days",
    },
    {
      title: "Public roadmap view",
      description:
        "Create a public-facing roadmap view so users can see what features are planned and in progress without logging in. Transparency builds trust and reduces repeat submissions.",
      status: "done",
      votes: 56,
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
