import { neon } from "@neondatabase/serverless";

export const runtime = "nodejs";
const sql = neon(process.env.DATABASE_URL!);

const UUID =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

function getSessionIdFromUrl(url: string) {
  const parts = new URL(url).pathname.split("/");
  // .../api/chat/sessions/{id}/messages
  const idx = parts.findIndex((p) => p === "sessions");
  return idx >= 0 ? parts[idx + 1] ?? "" : "";
}

export async function GET(
  req: Request,
  { params }: { params: { id?: string } }
) {
  try {
    const url = new URL(req.url);

    const userId =
      (req.headers.get("x-user-id") || url.searchParams.get("userId") || "").trim();

    const sessionId = (params?.id?.trim() || getSessionIdFromUrl(req.url)).trim();

    if (!userId || !UUID.test(userId)) {
      return Response.json(
        { ok: false, error: "Invalid or missing userId." },
        { status: 400 }
      );
    }

    if (!sessionId || !UUID.test(sessionId)) {
      return Response.json(
        { ok: false, error: "Invalid or missing sessionId." },
        { status: 400 }
      );
    }

    const rows = await sql`
      SELECT id, role, content, created_at
      FROM chat_messages
      WHERE user_id = ${userId} AND session_id = ${sessionId}
      ORDER BY created_at ASC
    `;

    return Response.json({ ok: true, messages: rows }, { status: 200 });
  } catch {
    return Response.json(
      { ok: false, error: "Failed to load messages." },
      { status: 500 }
    );
  }
}
