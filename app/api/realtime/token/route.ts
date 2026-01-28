import { NextResponse } from "next/server";

export const runtime = "nodejs";

export async function POST() {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    return NextResponse.json(
      { ok: false, error: "Missing OPENAI_API_KEY" },
      { status: 500 }
    );
  }

  const r = await fetch("https://api.openai.com/v1/realtime/sessions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: "gpt-4o-realtime-preview",
      voice: "alloy",
    }),
  });

  const j = await r.json();

  if (!r.ok) {
    return NextResponse.json(
      { ok: false, error: j?.error?.message ?? "Failed to create realtime session" },
      { status: r.status }
    );
  }

  return NextResponse.json({ ok: true, session: j });
}
