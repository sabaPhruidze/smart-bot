import { neon } from "@neondatabase/serverless";

export const runtime = "nodejs";

const sql = neon(process.env.DATABASE_URL!);
const UUID_REGEX =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

function getUserId(req: Request) {
  const fromHeader = req.headers.get("x-user-id")?.trim();
  return fromHeader && UUID_REGEX.test(fromHeader) ? fromHeader : null;
}

export async function POST(req: Request) {
  const userId = getUserId(req);
  if (!userId) {
    return Response.json({ ok: false, error: "Missing user id." }, { status: 401 });
  }

  const body = await req.json().catch(() => ({}));
  const sessionId = String(body?.sessionId ?? "").trim();
  const role = String(body?.role ?? "user").trim();
  const content = String(body?.content ?? "").trim();

  if (!UUID_REGEX.test(sessionId)) {
    return Response.json({ ok: false, error: "Invalid session id." }, { status: 400 });
  }
  if (!["user", "assistant", "system"].includes(role)) {
    return Response.json({ ok: false, error: "Invalid role." }, { status: 400 });
  }
  if (!content) {
    return Response.json({ ok: false, error: "Content is required." }, { status: 400 });
  }

  const owner = await sql`
    SELECT id FROM chat_sessions WHERE id = ${sessionId} AND user_id = ${userId} LIMIT 1
  `;
  if (!owner?.length) {
    return Response.json({ ok: false, error: "Session not found." }, { status: 404 });
  }

  const rows = await sql`
    INSERT INTO chat_messages (session_id, user_id, role, content)
    VALUES (${sessionId}, ${userId}, ${role}, ${content})
    RETURNING id, role, content, created_at
  `;

  await sql`
    UPDATE chat_sessions
    SET updated_at = now(), last_message_at = now()
    WHERE id = ${sessionId}
  `;

  return Response.json({ ok: true, message: rows[0] });
}
