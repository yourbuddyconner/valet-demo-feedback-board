import { NextRequest, NextResponse } from "next/server";
import { getDb, FeedbackItem } from "@/lib/db";

// GET /api/feedback
export async function GET(req: NextRequest) {
  try {
    const db = getDb();
    const { searchParams } = req.nextUrl;
    const sort = searchParams.get("sort") || "votes";
    const order = searchParams.get("order") || "desc";
    const status = searchParams.get("status");

    const validSorts = ["votes", "created_at", "updated_at", "title"];
    const validOrders = ["asc", "desc"];
    const sortCol = validSorts.includes(sort) ? sort : "votes";
    const sortDir = validOrders.includes(order) ? order.toUpperCase() : "DESC";

    let query = "SELECT * FROM feedback";
    const params: string[] = [];

    if (status && ["new", "in_progress", "done"].includes(status)) {
      query += " WHERE status = ?";
      params.push(status);
    }

    query += ` ORDER BY ${sortCol} ${sortDir}`;

    const items = db.prepare(query).all(...params) as FeedbackItem[];
    return NextResponse.json(items);
  } catch (err) {
    console.error("[GET /api/feedback]", err);
    return NextResponse.json({ error: "Failed to fetch feedback" }, { status: 500 });
  }
}

// POST /api/feedback
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { title, description, author_name } = body;

    if (!title?.trim()) {
      return NextResponse.json({ error: "title is required" }, { status: 400 });
    }
    if (!description?.trim()) {
      return NextResponse.json({ error: "description is required" }, { status: 400 });
    }
    if (!author_name?.trim()) {
      return NextResponse.json({ error: "author_name is required" }, { status: 400 });
    }

    const db = getDb();
    const result = db
      .prepare(
        `INSERT INTO feedback (title, description, author_name, status, votes, created_at, updated_at)
         VALUES (?, ?, ?, 'new', 0, datetime('now'), datetime('now'))`
      )
      .run(title.trim(), description.trim(), author_name.trim());

    const item = db
      .prepare("SELECT * FROM feedback WHERE id = ?")
      .get(result.lastInsertRowid) as FeedbackItem;

    return NextResponse.json(item, { status: 201 });
  } catch (err) {
    console.error("[POST /api/feedback]", err);
    return NextResponse.json({ error: "Failed to create feedback" }, { status: 500 });
  }
}
