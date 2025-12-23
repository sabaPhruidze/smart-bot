import { neon } from "@neondatabase/serverless";

export const runtime = "nodejs";
const sql = neon(process.env.DATABASE_URL!);

const UUID =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

const getUserId = (req: Request) => {
  const h = (req.headers.get("x-user-id") || "").trim();
  if (h && UUID.test(h)) return h;
  const q = new URL(req.url).searchParams.get("userId")?.trim() || "";
  return q && UUID.test(q) ? q : null;
};

const getSessionIdFromUrl = (url: string) => {
  const parts = new URL(url).pathname.split("/");
  // .../api/chat/sessions/{id}
  const idx = parts.findIndex((p) => p === "sessions");
  return idx >= 0 ? (parts[idx + 1] ?? "").trim() : "";
};

export async function DELETE(
  req: Request,
  { params }: { params: { id?: string } }
) {
  try {
    const userId = getUserId(req);
    const sessionId = (params?.id?.trim() || getSessionIdFromUrl(req.url)).trim();

    if (!userId) {
      return Response.json({ ok: false, error: "Missing user id." }, { status: 401 });
    }
    if (!sessionId || !UUID.test(sessionId)) {
      return Response.json(
        { ok: false, error: "Invalid session id.", sessionId },
        { status: 400 }
      );
    }

    const rows = await sql`
      DELETE FROM chat_sessions
      WHERE id = ${sessionId} AND user_id = ${userId}
      RETURNING id
    `;

    if (!rows?.length) {
      return Response.json({ ok: false, error: "Session not found." }, { status: 404 });
    }

    return Response.json({ ok: true, deletedId: rows[0].id });
  } catch {
    return Response.json({ ok: false, error: "Failed to delete session." }, { status: 500 });
  }
}
