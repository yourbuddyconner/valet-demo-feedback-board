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
      title: "Please add a coffee break button",
      description:
        "I clicked every button on this app and none of them made coffee. This is frankly unacceptable. A single button that says 'Brew' and does nothing would at least set realistic expectations. 0/10, would not recommend to my coffee maker.",
      status: "new",
      votes: 1,
      author_name: "A Very Tired Developer",
      offset: "0 days",
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
