import { neon } from "@neondatabase/serverless";
import type { NextRequest } from "next/server";

export const runtime = "nodejs";
const sql = neon(process.env.DATABASE_URL!);

const UUID =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

const getSessionIdFromUrl = (url: string) => {
  const parts = new URL(url).pathname.split("/");
  const idx = parts.findIndex((p) => p === "sessions");
  return idx >= 0 ? (parts[idx + 1] ?? "").trim() : "";
};

const getUserId = (req: NextRequest) => {
  const h = (req.headers.get("x-user-id") || "").trim();
  if (h && UUID.test(h)) return h;

  const q = req.nextUrl.searchParams.get("userId")?.trim() || "";
  return q && UUID.test(q) ? q : null;
};

export async function GET(
  req: NextRequest,
  ctx: { params: Promise<{ id: string }> }
) {
  try {
    const userId = getUserId(req);
    const p = await ctx.params;
    const sessionId = (p?.id?.trim() || getSessionIdFromUrl(req.url)).trim();

    if (!userId) {
      return Response.json({ ok: false, error: "Invalid or missing userId." }, { status: 400 });
    }
    if (!sessionId || !UUID.test(sessionId)) {
      return Response.json({ ok: false, error: "Invalid or missing sessionId." }, { status: 400 });
    }

    const rows = await sql`
      SELECT id, role, content, created_at
      FROM chat_messages
      WHERE user_id = ${userId} AND session_id = ${sessionId}
      ORDER BY created_at ASC
    `;

    return Response.json({ ok: true, messages: rows });
  } catch {
    return Response.json({ ok: false, error: "Failed to load messages." }, { status: 500 });
  }
}
