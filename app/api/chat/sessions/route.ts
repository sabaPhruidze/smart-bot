import { neon } from "@neondatabase/serverless";

export const runtime = "nodejs";

const sql = neon(process.env.DATABASE_URL!);
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

// GET /api/chat/sessions  -> აბრუნებს user-ის ყველა chat session-ს
export async function GET(req: Request) {
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
}

// POST /api/chat/sessions -> ქმნის ახალ chat session-ს
export async function POST(req: Request) {
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
}
