import { neon } from "@neondatabase/serverless";

export const runtime = "nodejs";

const sql = neon(process.env.DATABASE_URL!);
const UUID_REGEX =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

function getUserId(req: Request) {
  const fromHeader = req.headers.get("x-user-id")?.trim();
  return fromHeader && UUID_REGEX.test(fromHeader) ? fromHeader : null;
}

export async function GET(req: Request, ctx: { params: { id: string } }) {
  const userId = getUserId(req);
  if (!userId) {
    return Response.json({ ok: false, error: "Missing user id." }, { status: 401 });
  }

  const sessionId = String(ctx?.params?.id ?? "").trim();
  if (!UUID_REGEX.test(sessionId)) {
    return Response.json({ ok: false, error: "Invalid session id." }, { status: 400 });
  }

  const owner = await sql`
    SELECT id FROM chat_sessions WHERE id = ${sessionId} AND user_id = ${userId} LIMIT 1
  `;
  if (!owner?.length) {
    return Response.json({ ok: false, error: "Session not found." }, { status: 404 });
  }

  const messages = await sql`
    SELECT id, role, content, created_at
    FROM chat_messages
    WHERE session_id = ${sessionId}
    ORDER BY created_at ASC
    LIMIT 500
  `;

  return Response.json({ ok: true, messages });
}
