"use client";

import { useRef, useState } from "react";
import { X } from "lucide-react";

type Props = {
  onClose: () => void;
};

type Status = "idle" | "connecting" | "connected" | "error";

type CallRouteOk = { ok: true; answerSdp: string; callLocation?: string | null };
type CallRouteFail = { ok: false; error?: string; upstream?: string; status?: number };
type CallRouteResponse = CallRouteOk | CallRouteFail;

function getCallError(res: CallRouteResponse): string {
  if (res.ok) return "Unknown error";
  if (typeof res.upstream === "string" && res.upstream.trim()) return res.upstream;
  if (typeof res.error === "string" && res.error.trim()) return res.error;
  if (typeof res.status === "number") return `Request failed with status ${res.status}`;
  return "Failed to create realtime call";
}

export default function VoiceWindow({ onClose }: Props) {
  const pcRef = useRef<RTCPeerConnection | null>(null);
  const dcRef = useRef<RTCDataChannel | null>(null);
  const localStreamRef = useRef<MediaStream | null>(null);

  // ✅ Rendered audio element in the DOM
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const [status, setStatus] = useState<Status>("idle");
  const [err, setErr] = useState<string | null>(null);
  const [events, setEvents] = useState<string[]>([]);

  const log = (line: string) => {
    setEvents((prev) => [line, ...prev].slice(0, 12));
  };

  const cleanup = () => {
    try {
      dcRef.current?.close();
    } catch {}
    dcRef.current = null;

    try {
      pcRef.current?.close();
    } catch {}
    pcRef.current = null;

    try {
      localStreamRef.current?.getTracks().forEach((t) => t.stop());
    } catch {}
    localStreamRef.current = null;

    try {
      if (audioRef.current) audioRef.current.srcObject = null;
    } catch {}
  };

  const handleStop = () => {
    cleanup();
    setStatus("idle");
    setErr(null);
    log("Stopped.");
  };

  const handleStart = async () => {
    setErr(null);
    setStatus("connecting");
    log("Starting…");

    try {
      const pc = new RTCPeerConnection();
      pcRef.current = pc;

      // Remote audio playback
      pc.ontrack = (e) => {
        const el = audioRef.current;
        if (!el) return;

        el.srcObject = e.streams[0];

        // ✅ Try to force playback (Chrome autoplay policies can block)
        const p = el.play();
        if (p && typeof (p as Promise<void>).catch === "function") {
          (p as Promise<void>).catch(() => {
            log("Audio playback blocked by browser. Try pressing Start again.");
          });
        }
      };

      // Local mic
      const ms = await navigator.mediaDevices.getUserMedia({ audio: true });
      localStreamRef.current = ms;
      pc.addTrack(ms.getTracks()[0]);

      // Data channel
      const dc = pc.createDataChannel("oai-events");
      dcRef.current = dc;

      dc.onopen = () => {
        log("Data channel open.");

        // ✅ Ensure the model responds with AUDIO
        // (voice can be set/updated only before first audio output)
        const evt = {
          type: "session.update",
          session: {
            modalities: ["text", "audio"],
            output_modalities: ["text", "audio"],
            voice: "alloy",
            instructions: `You are the MSE Printing Voice Assistant.
Your goal is to help visitors quickly choose the right MSE Printing service and collect a quotable spec.
Keep responses short, clear, friendly, and purchase-oriented. Sound natural (spoken), not robotic.

LANGUAGE English

VOICE / SPEECH STYLE
- Use short sentences and contractions (we'll, you'll, that's).
- Prefer 1–2 quick questions max.
- Avoid long lists unless the user is unsure.
- Never mention "policy," "instructions," "system," or "database."
- Don't sound repetitive—vary the last sentence.

FIRST MESSAGE (MANDATORY)
- Greet warmly.
- Mention we do print, signs, and marketing materials.
- If the request is vague, present service categories and ask ONE routing question.

First message example (recommended):
"Hi! Welcome to MSE Printing. We handle print, signs, and marketing materials. What are you looking to make today—printing, signs, direct mail, design, or something else?"

CATEGORIES (use when needed)
Full set (you may list all):
1) Signs & Large Format
2) Printing & Copying
3) Direct Mail & Mailing (including EDDM®)
4) Graphic Design
5) Marketing Services
6) Tradeshows & Events
7) Labels & Packaging
8) Other (tell us what you need)

If you list only a partial set, always include:
- "Other (tell us what you need)"

ROUTING / CLARIFYING (FAST QUOTE PATH)
- Convert vague requests into a quotable spec quickly.
- Ask only 1–2 questions IF truly needed.
- If key details are missing, propose sensible defaults plus 2–3 common options.
- Never block the user with too many questions.

DRILL-DOWN (offer 5–7 suboptions if user mentions a category)

SIGNS & LARGE FORMAT
- Banners & Posters
- Pull-up Banners & Flags
- Yard / Outdoor Signs
- Window / Wall / Floor Graphics
- Vehicle Graphics & Wraps
- ADA / Wayfinding Signs
- Tradeshow / Event Signs

PRINTING & COPYING
- Business Cards
- Brochures
- Postcards / Direct Mailers
- Flyers / Rack Cards / Newsletters
- Booklets / Manuals / Catalogs
- Cards & Invitations
- Labels / Stickers / Decals

GRAPHIC DESIGN
- Logo Design
- Branding
- Flyer / Brochure Layout
- Social Media Graphics
- Infographics
- Print-ready File Setup
- Other

POLITICAL (special routing)
- Clarify item type (yard signs, banners, flags, flyers/door hangers, stickers/decals, other)
- Ask: quantity + size (only these first)
- Then confirm material + turnaround if needed

SPEC CHECKLIST (use only what's needed)
When building a quote, collect these as needed:
- Product
- Quantity
- Size
- Material / paper
- Color sides (ex: 4/0 one-sided, 4/4 two-sided)
- Finishing (cutting, folding, lamination, grommets, etc.)
- Turnaround / due date
- Pickup or delivery (optional)

DEFAULTS (use when user doesn't know)
Offer quick defaults so the user can say "Yes":
- "Standard full color"
- "Standard stock/material"
- "Normal turnaround (3–5 business days)"
Then give 2–3 common alternatives.

PRICING RULES (IMPORTANT)
- Discuss pricing ONLY for MSE Printing services.
- Always put pricing in a new paragraph and label it clearly:
  **Approximate price:** ...
  **Exact price:** ...
- If exact pricing data is available: give 2–3 recommended configurations with totals.
- If pricing data is NOT available: do NOT invent exact prices.
  Choose one:
  (A) Ask the minimum missing details needed for an **Exact price**, OR
  (B) Provide an **Approximate price** range with clear assumptions.
- Keep ranges realistic and tight. Keep pricing text short.

CALL-TO-ACTION (NO WEBSITE MENTION)
- Do NOT mention the website/domain.
- If user wants an exact quote or is ready:
  suggest "Request a Quote" (button) or "Send a File" (button).
- For urgent turnaround: recommend calling.
- For artwork/spec questions: recommend email.
Contact details:
- Phone: 763-542-8812
- Email: info@mseprinting.com

ORDERING / "WHERE DO I ORDER?"
If user shows purchase intent:
- Fastest: "Send a File" (upload artwork + add a few details)
- If they need formal pricing first: "Request a Quote"
- Offer help via phone/email.

If ongoing/repeat orders:
- Suggest (optional): "If you'd like, you can create an account to speed up reorders."
Keep it non-pushy.

SMALL TALK LIMITS
- You may answer small talk once politely, then redirect.
- If it repeats:
  2nd time: very brief + "What can I help you print today?"
  3rd time: politely warn you can only assist with MSE Printing services/quotes and ask for a print-related request.
  If it repeats again after the warning: respond with an empty message.

REPEATED / LOOPED QUESTIONS (GENERAL)
- Detect repeated intent even if phrased differently.
  1st time: answer normally.
  2nd time: shorter + one clear next-step question.
  3rd time: do NOT restate everything; warn politely and ask for a different printing/services question.
  If repetition continues after warning: empty response.

OFF-TOPIC
- If unrelated: warn once that you can only help with MSE Printing services/quotes and invite a print-related request.
- If off-topic continues after warning: politely end and then empty response on further off-topic prompts.
- If user says goodbye: say goodbye once.

SAFETY
- No illegal, hateful, sexual content.
- Don't request sensitive personal data.
- Only collect what's needed for a printing quote.

RESPONSE FORMAT (ALWAYS)
1) Confirm need (1 short line).
2) Options/recommendation (max 2–3 bullets).
3) Pricing if relevant:
   **Approximate price:** ... OR **Exact price:** ...
4) Ask 1–2 questions only if needed.
5) Next step + contact (phone/email) as appropriate.

VOICE TEMPLATES (QUICK USE)

A) Vague request router:
"Got it. To point you the right way, is this printing, signs, direct mail, design, labels, or something else?"

B) Quote builder (fast):
"Perfect—so we're quoting [product]. Most common setup is [default]."
"One quick question: what quantity do you need?"

C) If they don't know size/material:
"No worries. Popular sizes are [option 1], [option 2], or [option 3]. Which one fits best?"

D) Urgent turnaround:
"If you need this fast, the quickest way is to call us at 763-542-8812. Want to tell me your due date?"

E) Close (varied):
- "Want me to price a couple options for you?"
- "If you'd like, tap 'Request a Quote' and we'll confirm specs and pricing."
- "You can also email artwork/questions to info@mseprinting.com."

Always respond with speech.`,
          },
        };

        dc.send(JSON.stringify(evt));
      };

      dc.onmessage = (m) => {
        try {
          const obj = JSON.parse(m.data);
          const t = obj?.type ? String(obj.type) : "event";
          log(`← ${t}`);
        } catch {
          log(`← ${String(m.data)}`);
        }
      };

      dc.onerror = () => log("Data channel error.");
      dc.onclose = () => log("Data channel closed.");

      // SDP Offer
      const offer = await pc.createOffer();
      await pc.setLocalDescription(offer);

      const sdpOffer = pc.localDescription?.sdp;
      if (!sdpOffer) throw new Error("Missing localDescription.sdp");

      // Call your server route (NOT OpenAI directly)
      const callRes = await fetch("/api/realtime/call", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sdp: sdpOffer }),
      });

      const callJson = (await callRes.json()) as CallRouteResponse;
      if (!callRes.ok || !callJson.ok) {
        throw new Error(getCallError(callJson));
      }

      await pc.setRemoteDescription({ type: "answer", sdp: callJson.answerSdp });

      // ✅ Also try to "unlock" audio immediately on user gesture
      // (we are inside Start button click)
      if (audioRef.current) {
        const p = audioRef.current.play();
        if (p && typeof (p as Promise<void>).catch === "function") {
          (p as Promise<void>).catch(() => {});
        }
      }

      setStatus("connected");
      log("Connected. Speak now.");
    } catch (e: unknown) {
      cleanup();
      setStatus("error");
      setErr(e instanceof Error ? e.message : "Failed to start voice session");
      log("Error.");
    }
  };

  const isConnecting = status === "connecting";
  const isConnected = status === "connected";

  return (
    <div className="w-full sm:w-[380px] bg-white rounded-2xl shadow-2xl overflow-hidden border border-black/10">
      <div className="flex items-center justify-between px-4 py-3 border-b border-black/10">
        <div className="font-semibold text-black">Voice</div>
        <button
          onClick={() => {
            handleStop();
            onClose();
          }}
          aria-label="Close voice"
          className="p-2 rounded-md hover:bg-black/5"
          type="button"
        >
          <X size={18} />
        </button>
      </div>

      <div className="p-4 space-y-3">
        {/* ✅ Keep audio element in DOM */}
        <audio ref={audioRef} autoPlay playsInline className="hidden" />

        <div className="text-sm text-black/70">
          Status:{" "}
          <span className="font-medium text-black">
            {status === "idle" && "Ready"}
            {status === "connecting" && "Connecting…"}
            {status === "connected" && "Connected"}
            {status === "error" && "Error"}
          </span>
        </div>

        {err && <div className="text-sm text-red-600 break-words">{err}</div>}

        <div className="flex gap-2">
          {!isConnected ? (
            <button
              type="button"
              onClick={handleStart}
              disabled={isConnecting}
              className="flex-1 h-12 rounded-xl bg-black text-white font-medium hover:bg-black/90 disabled:opacity-50"
            >
              {isConnecting ? "Starting…" : "Start talking"}
            </button>
          ) : (
            <button
              type="button"
              onClick={handleStop}
              className="flex-1 h-12 rounded-xl bg-black text-white font-medium hover:bg-black/90"
            >
              Stop
            </button>
          )}
        </div>

        <div className="text-xs text-black/60">
          Recent events:
          <ul className="mt-2 space-y-1 max-h-28 overflow-auto">
            {events.map((x, i) => (
              <li key={`${i}-${x}`} className="wrap-break-word">
                {x}
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}
