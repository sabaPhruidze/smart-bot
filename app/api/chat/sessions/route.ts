import { neon } from "@neondatabase/serverless";

export const runtime = "nodejs";

const UUID_REGEX =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

function getUserId(req: Request) {
  const fromHeader = req.headers.get("x-user-id")?.trim();
  if (fromHeader && UUID_REGEX.test(fromHeader)) return fromHeader;

  const url = new URL(req.url);
  const fromQuery = url.searchParams.get("userId")?.trim();
  if (fromQuery && UUID_REGEX.test(fromQuery)) return fromQuery;

  return null;
}

function getSql() {
  const cs = process.env.DATABASE_URL;
  if (!cs) return null;
  return neon(cs);
}

// GET /api/chat/sessions
export async function GET(req: Request) {
  try {
    const sql = getSql();
    if (!sql) {
      return Response.json(
        { ok: false, error: "DATABASE_URL is not configured" },
        { status: 500 }
      );
    }

    const userId = getUserId(req);
    if (!userId) {
      return Response.json({ ok: false, error: "Missing user id." }, { status: 401 });
    }

    const sessions = await sql`
      SELECT id, title, created_at, updated_at, last_message_at
      FROM chat_sessions
      WHERE user_id = ${userId}
      ORDER BY last_message_at DESC
      LIMIT 50
    `;

    return Response.json({ ok: true, sessions });
  } catch (err) {
    console.error("GET /api/chat/sessions error:", err);
    return Response.json(
      { ok: false, error: "Server error in GET /chat/sessions" },
      { status: 500 }
    );
  }
}

// POST /api/chat/sessions
export async function POST(req: Request) {
  try {
    const sql = getSql();
    if (!sql) {
      return Response.json(
        { ok: false, error: "DATABASE_URL is not configured" },
        { status: 500 }
      );
    }

    const userId = getUserId(req);
    if (!userId) {
      return Response.json({ ok: false, error: "Missing user id." }, { status: 401 });
    }

    const body = await req.json().catch(() => ({}));
    const title = String(body?.title ?? "New chat").trim().slice(0, 60) || "New chat";

    const rows = await sql`
      INSERT INTO chat_sessions (user_id, title)
      VALUES (${userId}, ${title})
      RETURNING id, title, created_at, updated_at, last_message_at
    `;

    return Response.json({ ok: true, session: rows[0] });
  } catch (err) {
    console.error("POST /api/chat/sessions error:", err);
    return Response.json(
      { ok: false, error: "Server error in POST /chat/sessions" },
      { status: 500 }
    );
  }
}
