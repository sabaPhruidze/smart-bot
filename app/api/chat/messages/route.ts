import { neon } from "@neondatabase/serverless";
import OpenAI from "openai";

export const runtime = "nodejs";

const sql = neon(process.env.DATABASE_URL!);

const client = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

const UUID_REGEX =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

function getUserId(req: Request) {
  const fromHeader = req.headers.get("x-user-id")?.trim();
  return fromHeader && UUID_REGEX.test(fromHeader) ? fromHeader : null;
}

type DbMessageRow = {
  id: string;
  role: "user" | "assistant" | "system";
  content: string;
  created_at: string;
};

export async function POST(req: Request) {
  try {
    // env check
    if (!process.env.DATABASE_URL) {
      return Response.json(
        { ok: false, error: "DATABASE_URL is not configured." },
        { status: 500 }
      );
    }
    if (!process.env.OPENAI_API_KEY) {
      return Response.json(
        { ok: false, error: "OPENAI_API_KEY is not configured." },
        { status: 500 }
      );
    }

    const userId = getUserId(req);
    if (!userId) {
      return Response.json(
        { ok: false, error: "Missing user id." },
        { status: 401 }
      );
    }

    const body = await req.json().catch(() => ({}));
    const sessionId = String(body?.sessionId ?? "").trim();
    const role = String(body?.role ?? "user").trim();
    const content = String(body?.content ?? "").trim();

    if (!UUID_REGEX.test(sessionId)) {
      return Response.json(
        { ok: false, error: "Invalid session id." },
        { status: 400 }
      );
    }
    if (role !== "user") {
      return Response.json(
        { ok: false, error: "Only user messages are accepted here." },
        { status: 400 }
      );
    }
    if (!content) {
      return Response.json(
        { ok: false, error: "Content is required." },
        { status: 400 }
      );
    }

    // session owner check
    const owner = await sql`
      SELECT id FROM chat_sessions
      WHERE id = ${sessionId} AND user_id = ${userId}
      LIMIT 1
    `;
    if (!owner?.length) {
      return Response.json(
        { ok: false, error: "Session not found." },
        { status: 404 }
      );
    }

    // 1) insert user message
    const userRows = (await sql`
      INSERT INTO chat_messages (session_id, user_id, role, content)
      VALUES (${sessionId}, ${userId}, ${"user"}, ${content})
      RETURNING id, role, content, created_at
    `) as DbMessageRow[];

    const userMessage = userRows[0];

    // 2) update session timestamps
    await sql`
      UPDATE chat_sessions
      SET updated_at = now(), last_message_at = now()
      WHERE id = ${sessionId}
    `;

    // 3) load last N messages for context (keep cost down)
    const N = 20;
    const recentDesc = (await sql`
      SELECT id, role, content, created_at
      FROM chat_messages
      WHERE user_id = ${userId} AND session_id = ${sessionId}
      ORDER BY created_at DESC
      LIMIT ${N}
    `) as DbMessageRow[];

    const recent = [...recentDesc].reverse();

    // 4) OpenAI Responses API call (HTTP request, not phone call)
    const response = await client.responses.create({
      model: "gpt-4o-mini",
      // “instructions” = system message (კონტექსტში ჩაჯდება)
      instructions:
        "You are Project Help for MSE Printing. Be concise, practical, and ask clarifying questions only when necessary.",
      // input = message history
      input: recent.map((m) => ({
        role: m.role,
        content: m.content,
      })),
      // სურვილისამებრ: truncation auto, რომ დიდ კონტექსტზე არ ჩამოიშალოს
      truncation: "auto",
    });

    const assistantText = String(response.output_text ?? "").trim();
    const safeAssistantText =
      assistantText || "Sorry — I couldn’t generate a response. Please try again.";

    // 5) insert assistant message
    const assistantRows = (await sql`
      INSERT INTO chat_messages (session_id, user_id, role, content)
      VALUES (${sessionId}, ${userId}, ${"assistant"}, ${safeAssistantText})
      RETURNING id, role, content, created_at
    `) as DbMessageRow[];

    const assistantMessage = assistantRows[0];

    // 6) update session timestamps again (assistant reply time)
    await sql`
      UPDATE chat_sessions
      SET updated_at = now(), last_message_at = now()
      WHERE id = ${sessionId}
    `;

    return Response.json({
      ok: true,
      userMessage,
      assistantMessage,
    });
  } catch (err) {
    console.error("POST /api/chat/messages error:", err);
    return Response.json(
      { ok: false, error: "Server error in /api/chat/messages" },
      { status: 500 }
    );
  }
}
