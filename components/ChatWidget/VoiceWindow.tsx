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
            output_modalities: ["audio"],
            voice: "alloy",
            instructions:
              "Speak in Georgian clearly and simply. Be concise and direct.",
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
        <audio ref={audioRef} autoPlay className="hidden" />

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
