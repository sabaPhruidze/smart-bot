import { NextResponse } from "next/server";

export const runtime = "nodejs";

type CallBody = { sdp: string };

function isCallBody(x: unknown): x is CallBody {
  return (
    typeof x === "object" &&
    x !== null &&
    "sdp" in x &&
    typeof (x as Record<string, unknown>).sdp === "string"
  );
}

export async function POST(req: Request) {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    return NextResponse.json(
      { ok: false, error: "Missing OPENAI_API_KEY" },
      { status: 500 }
    );
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json(
      { ok: false, error: "Invalid JSON body" },
      { status: 400 }
    );
  }

  if (!isCallBody(body) || !body.sdp.trim()) {
    return NextResponse.json(
      { ok: false, error: "Missing 'sdp' (string) in request body" },
      { status: 400 }
    );
  }

  const fd = new FormData();
  fd.append("sdp", body.sdp);

  // ✅ Updated to GA API structure
  fd.append(
    "session",
    JSON.stringify({
      type: "realtime",
      model: "gpt-realtime",
    })
  );

  const r = await fetch("https://api.openai.com/v1/realtime/calls", {
    method: "POST",
    headers: { Authorization: `Bearer ${apiKey}` },
    body: fd,
  });

  const upstreamText = await r.text();

  if (!r.ok) {
    return NextResponse.json(
      {
        ok: false,
        status: r.status,
        error: "Realtime call failed",
        upstream: upstreamText,
      },
      { status: 500 }
    );
  }

  return NextResponse.json({
    ok: true,
    answerSdp: upstreamText,
    callLocation: r.headers.get("location"),
  });
}
