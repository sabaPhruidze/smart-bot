// components/ChatWidget/chatIdentity.ts

export type ChatIdentity = {
  id: string; // UUID
  displayName: string;
  kind: "guest" | "user";
};

const STORAGE_KEY = "chat_user";

// UUID v4 fallback (თუ crypto.randomUUID არ არის ხელმისაწვდომი)
function uuidv4Fallback() {
  // RFC4122-ish fallback (საკმარისია local identity-სთვის)
  return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === "x" ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

function safeParse(raw: string | null): ChatIdentity | null {
  if (!raw) return null;
  try {
    const obj = JSON.parse(raw);
    if (typeof obj?.id !== "string") return null;
    if (typeof obj?.displayName !== "string") return null;

    const kind: ChatIdentity["kind"] = obj?.kind === "user" ? "user" : "guest";
    return { id: obj.id, displayName: obj.displayName, kind };
  } catch {
    return null;
  }
}

/**
 * აბრუნებს არსებულ identity-ს, ან ქმნის Guest-ს პირველად.
 * IMPORTANT: ეს უნდა გამოიძახო მხოლოდ client-side (use client გარემოში).
 */
export function getOrCreateIdentity(): ChatIdentity {
  const existing = safeParse(localStorage.getItem(STORAGE_KEY));
  if (existing) return existing;

  const id =
    (globalThis.crypto as any)?.randomUUID?.() ??
    uuidv4Fallback();

  const suffix = id.split("-")[0]?.toUpperCase() || "GUEST";
  const identity: ChatIdentity = {
    id,
    displayName: `Guest ${suffix}`,
    kind: "guest",
  };

  localStorage.setItem(STORAGE_KEY, JSON.stringify(identity));
  return identity;
}

/** როცა რეალურად ლოგინდება, guest-ს “გაანახლებს” user-ად */
export function setAuthedUser(user: { id: string; displayName: string }) {
  const identity: ChatIdentity = { ...user, kind: "user" };
  localStorage.setItem(STORAGE_KEY, JSON.stringify(identity));
}

/** სურვილისამებრ: გაიგო ვინ არის (guest/user) */
export function getIdentity(): ChatIdentity | null {
  return safeParse(localStorage.getItem(STORAGE_KEY));
}
