# Feedback Board

A full-stack feedback board application built with Next.js. Submit ideas, vote on what matters, and track progress across three statuses: **New**, **In Progress**, and **Done**.

Think a lightweight Canny / UserVoice clone.

## Tech Stack

- **Framework**: Next.js 15 (App Router) — single-port full-stack
- **Database**: SQLite via `better-sqlite3`
- **Styling**: Custom CSS (no UI frameworks)
- **Language**: TypeScript

## Features

- Kanban-style board with three columns (New / In Progress / Done)
- Submit new feedback items with title, description, and author name
- Upvote any feedback item
- Click a card to view full details, edit content/status, or delete
- Change item status inline from the card or in the detail modal
- Sort by most votes, newest, or recently updated
- 8 seed items loaded on first run
- Fully responsive layout

## Getting Started

### Prerequisites

- Node.js 18+
- npm 9+

### Install & Run

```bash
npm install
npm run dev
```

The app starts on **http://localhost:3000**.

### Production Build

```bash
npm run build
npm start
```

## Project Structure

```
/app
  /api
    /feedback
      route.ts          # GET list, POST create
      /[id]
        route.ts        # GET one, PATCH update, DELETE
        /vote
          route.ts      # POST upvote
  /components
    Board.tsx           # 3-column kanban layout
    FeedbackCard.tsx    # Individual card with inline actions
    DetailModal.tsx     # Full detail view + edit form
    SubmitModal.tsx     # New feedback submission form
  globals.css           # All styles
  layout.tsx            # Root layout
  page.tsx              # Main page (client component)
/lib
  db.ts                 # SQLite connection, schema init, seed data
```

## API Reference

| Method   | Path                        | Description              |
|----------|-----------------------------|--------------------------|
| GET      | `/api/feedback`             | List all items (sortable)|
| POST     | `/api/feedback`             | Create a new item        |
| GET      | `/api/feedback/:id`         | Get a single item        |
| PATCH    | `/api/feedback/:id`         | Update title/desc/status |
| DELETE   | `/api/feedback/:id`         | Delete an item           |
| POST     | `/api/feedback/:id/vote`    | Upvote an item           |

### Query params for `GET /api/feedback`

| Param   | Values                          | Default  |
|---------|---------------------------------|----------|
| `sort`  | `votes`, `created_at`, `updated_at`, `title` | `votes` |
| `order` | `asc`, `desc`                   | `desc`   |
| `status`| `new`, `in_progress`, `done`    | (all)    |
