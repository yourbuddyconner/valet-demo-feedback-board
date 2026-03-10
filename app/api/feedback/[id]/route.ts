import { NextRequest, NextResponse } from "next/server";
import { getDb, FeedbackItem } from "@/lib/db";

type Params = { params: Promise<{ id: string }> };

// GET /api/feedback/:id
export async function GET(_req: NextRequest, { params }: Params) {
  try {
    const { id } = await params;
    const db = getDb();
    const item = db.prepare("SELECT * FROM feedback WHERE id = ?").get(id) as FeedbackItem | undefined;

    if (!item) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }
    return NextResponse.json(item);
  } catch (err) {
    console.error("[GET /api/feedback/:id]", err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}

// PATCH /api/feedback/:id
export async function PATCH(req: NextRequest, { params }: Params) {
  try {
    const { id } = await params;
    const db = getDb();
    const item = db.prepare("SELECT * FROM feedback WHERE id = ?").get(id) as FeedbackItem | undefined;

    if (!item) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    const body = await req.json();
    const { title, description, status } = body;

    const validStatuses = ["new", "in_progress", "done"];
    if (status !== undefined && !validStatuses.includes(status)) {
      return NextResponse.json({ error: "Invalid status" }, { status: 400 });
    }

    const updates: Record<string, string> = {};
    if (title !== undefined) updates.title = title.trim();
    if (description !== undefined) updates.description = description.trim();
    if (status !== undefined) updates.status = status;

    if (Object.keys(updates).length === 0) {
      return NextResponse.json({ error: "Nothing to update" }, { status: 400 });
    }

    const setClauses = Object.keys(updates)
      .map((k) => `${k} = ?`)
      .join(", ");

    db.prepare(
      `UPDATE feedback SET ${setClauses}, updated_at = datetime('now') WHERE id = ?`
    ).run(...Object.values(updates), id);

    const updated = db
      .prepare("SELECT * FROM feedback WHERE id = ?")
      .get(id) as FeedbackItem;

    return NextResponse.json(updated);
  } catch (err) {
    console.error("[PATCH /api/feedback/:id]", err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}

// DELETE /api/feedback/:id
export async function DELETE(_req: NextRequest, { params }: Params) {
  try {
    const { id } = await params;
    const db = getDb();
    const item = db.prepare("SELECT * FROM feedback WHERE id = ?").get(id) as FeedbackItem | undefined;

    if (!item) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    db.prepare("DELETE FROM feedback WHERE id = ?").run(id);
    return new NextResponse(null, { status: 204 });
  } catch (err) {
    console.error("[DELETE /api/feedback/:id]", err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
