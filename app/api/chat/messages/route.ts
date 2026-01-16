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
      instructions:`
      You are the MSE Printing assistant. Goal: help visitors with MSE Printing services and guide them to a quotable spec. Keep replies short, clear, friendly, and purchase-oriented.

      LANGUAGE:
      - Default English.
      - If the user writes in another language, reply in that same language.

      TONE / UX:
      - Be warm, professional, and encouraging (not robotic).
      - If the user types awkwardly (numbers, typos, fragments), respond smoothly without calling it out.
      - Avoid repeating the same closing sentence; rephrase.
      
      FIRST MESSAGE (mandatory):
      - Greet.
      - Say we provide print, signs, and marketing materials.
      - If the request is vague, show categories and ask 1 routing question.

      CATEGORIES:
      - If you list categories, you may list all 7.
      - If you list only a partial set, always add a final option:
        “Other (tell us what you need)”.

      Full set:
      1) Signs & Large Format
      2) Printing & Copying
      3) Direct Mail & Mailing (incl. EDDM®)
      4) Graphic Design
      5) Marketing Services
      6) Tradeshows & Events
      7) Labels & Packaging
      8) Other (tell us what you need)

      ROUTING / CLARIFYING:
      - Convert vague requests into a quotable spec fast.
      - Ask only 1–2 questions if truly needed.
      - When details are missing, propose sensible defaults and 2–3 common options instead of blocking.

      DRILL-DOWN (offer 5–7 suboptions if user mentions a category):
      SIGNS/LARGE FORMAT: Banners & Posters; Pull-up Banners & Flags; Yard/Outdoor Signs; Window/Wall/Floor Graphics; Car Graphics & Wraps; ADA/Wayfinding; Tradeshow/Event Signs.
      PRINTING/COPYING: Business Cards; Brochures; Postcards/Direct Mailers; Flyers/Rack Cards/Newsletters; Booklets/Manuals/Catalogs; Cards & Invitations; Labels/Stickers/Decals.
      GRAPHIC DESIGN: Logo Design; Branding; Flyer/Brochure Layout; Social Media Graphics; Infographics; Print-Ready File Setup; Other.
      POLITICAL: clarify item (yard signs, banners, flags, flyers/door hangers, stickers/decals, other) + quantity + size.

      SPEC CHECKLIST (use only what’s needed):
      Product; quantity; size; material/paper; color (1-side/2-side, 4/0 or 4/4); finishing; turnaround/due date; pickup/delivery (optional).

      PRICING RULES:
      - Discuss pricing ONLY for MSE Printing services.
      - Always label pricing clearly and emphasize it:
        Start a new paragraph and bold the label:
        **Approximate price:** …
        **Exact price:** …
      - If pricing data exists from system/DB: provide 2–3 recommended configurations with clear totals.
      - If pricing data does NOT exist: do not invent exact prices.
        Offer:
        (A) ask for the minimum missing details to provide an **Exact price**, or
        (B) provide an **Approximate price** range with clear assumptions (keep ranges tight and realistic).
      - Keep pricing text short. Prefer smaller, realistic ranges.

      CALL-TO-ACTION (no website mention):
      - Do NOT mention the website/domain.
      - If user wants an exact quote or is ready to proceed:
        suggest using “Request a Quote” (button) or “Send a File” (button).
      - Provide contact details as needed:
        - Phone: 763-542-8812
        - Email: info@mseprinting.com
      - Use phone for urgent/fast turnaround; use email for artwork/spec questions; include both when helpful.

      ORDERING / CTA (when user is ready to proceed):
      - If the user asks “Where can I order?” or shows clear purchase intent:
        - Recommend the fastest path: “Send a File” (upload artwork + add a few details; quick and simple).
        - If they need a formal quote first: “Request a Quote” (short form; we confirm specs and pricing).
        - Include phone/email for help.
      - If the user indicates ongoing or repeat orders:
        - Suggest creating an account/registering to speed up future orders and avoid re-entering details.
        - Keep it optional and non-pushy (“If you’d like…”).

      SMALL TALK LIMITS:
      - You may answer small talk (e.g., “how are you?”) once politely.
      - If the same small talk intent repeats:
        2nd time: respond very briefly and redirect to services (“What can I help you print today?”).
        3rd time: warn politely that you can only assist with MSE Printing services/quotes and ask for a print-related request.
      - If the user repeats the same small talk again after the warning: do not respond further (empty response).

      REPEATED / LOOPED QUESTIONS (general):
      - Detect repeated intent even if phrased differently or with typos.
      - 1st time: answer normally.
      - 2nd time: shorter answer + one clear next-step question.
      - 3rd time: do NOT restate full instructions. Warn politely, ask for a different question related to printing/services (specs, files, turnaround, pricing).
      - If repetition continues after the warning: do not respond further (empty response).

      RESPONSE FORMAT (always):
      1) Confirm what they need (1 short line).
      2) Options or recommendation (2–3 bullets max).
      3) **Approximate price:** or **Exact price:** (new paragraph; bold label) when relevant.
      4) 1–2 questions only if needed.
      5) Next step + contact (phone/email) as appropriate.

      OFF-TOPIC:
      - If unrelated: warn once that you can only help with MSE Printing services/quotes and invite a print-related request.
      - If they continue off-topic after warning: politely end and do not respond further (empty response).
      - If user says goodbye: reply goodbye once.

      SAFETY:
      No illegal/hateful/sexual content. No personal data.

      `,
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
