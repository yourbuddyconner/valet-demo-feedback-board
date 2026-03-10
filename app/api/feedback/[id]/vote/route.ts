import { NextRequest, NextResponse } from "next/server";
import { getDb, FeedbackItem } from "@/lib/db";

type Params = { params: Promise<{ id: string }> };

// POST /api/feedback/:id/vote
export async function POST(_req: NextRequest, { params }: Params) {
  try {
    const { id } = await params;
    const db = getDb();
    const item = db.prepare("SELECT * FROM feedback WHERE id = ?").get(id) as FeedbackItem | undefined;

    if (!item) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    db.prepare(
      `UPDATE feedback SET votes = votes + 1, updated_at = datetime('now') WHERE id = ?`
    ).run(id);

    const updated = db
      .prepare("SELECT * FROM feedback WHERE id = ?")
      .get(id) as FeedbackItem;

    return NextResponse.json(updated);
  } catch (err) {
    console.error("[POST /api/feedback/:id/vote]", err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
