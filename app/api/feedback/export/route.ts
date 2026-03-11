import { NextResponse } from "next/server";
import { getDb, FeedbackItem } from "@/lib/db";

// GET /api/feedback/export
export async function GET() {
  try {
    const db = getDb();
    const items = db
      .prepare("SELECT * FROM feedback ORDER BY created_at DESC")
      .all() as FeedbackItem[];

    const json = JSON.stringify(items, null, 2);
    const filename = `feedback-export-${new Date().toISOString().slice(0, 10)}.json`;

    return new Response(json, {
      status: 200,
      headers: {
        "Content-Type": "application/json",
        "Content-Disposition": `attachment; filename="${filename}"`,
      },
    });
  } catch (err) {
    console.error("[GET /api/feedback/export]", err);
    return NextResponse.json({ error: "Failed to export feedback" }, { status: 500 });
  }
}
